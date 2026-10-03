#!/usr/bin/env bash
set -Eeuo pipefail

deploy_dir=${1:-}
version=${2:-}
image_bundle=${3:-}
incoming_compose=${4:-}

if [[ ! ${deploy_dir} =~ ^/[A-Za-z0-9_./-]+$ ]]; then
  echo "Deployment directory must be an absolute path without whitespace." >&2
  exit 2
fi

if [[ ! ${version} =~ ^[A-Za-z0-9._-]{7,64}$ ]]; then
  echo "Invalid release version: ${version}" >&2
  exit 2
fi

if [[ ! -f ${image_bundle} || ! -f ${incoming_compose} ]]; then
  echo "The image bundle or Compose file is missing." >&2
  exit 2
fi

for required_command in docker gzip flock; do
  if ! command -v "${required_command}" >/dev/null 2>&1; then
    echo "Required command is not installed: ${required_command}" >&2
    exit 2
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required." >&2
  exit 2
fi

mkdir -p "${deploy_dir}"
env_file="${deploy_dir}/.env"
compose_file="${deploy_dir}/docker-compose.yml"
previous_compose_file="${deploy_dir}/docker-compose.previous.yml"
current_version_file="${deploy_dir}/.current-version"
previous_version_file="${deploy_dir}/.previous-version"
lock_file="${deploy_dir}/deploy.lock"
staging_dir=$(dirname "${image_bundle}")
expected_staging_dir="${deploy_dir}/incoming/${version}"

if [[ ${staging_dir} != "${expected_staging_dir}" || $(dirname "${incoming_compose}") != "${expected_staging_dir}" ]]; then
  echo "Deployment files must be inside ${expected_staging_dir}." >&2
  exit 2
fi

cleanup() {
  rm -rf -- "${staging_dir}"
}
trap cleanup EXIT

exec 9>"${lock_file}"
if ! flock -n 9; then
  echo "Another deployment is already running." >&2
  exit 1
fi

if [[ ! -f ${env_file} ]]; then
  echo "Create ${env_file} before the first deployment." >&2
  exit 1
fi

if ! grep -Eq '^POSTGRES_PASSWORD=.+$' "${env_file}"; then
  echo "POSTGRES_PASSWORD must be set in ${env_file}." >&2
  exit 1
fi

current_version=
old_previous_version=
if [[ -f ${current_version_file} ]]; then
  current_version=$(<"${current_version_file}")
fi
if [[ -f ${previous_version_file} ]]; then
  old_previous_version=$(<"${previous_version_file}")
fi

if [[ -n ${current_version} && ! ${current_version} =~ ^[A-Za-z0-9._-]{7,64}$ ]]; then
  echo "Invalid version stored in ${current_version_file}." >&2
  exit 1
fi
if [[ -n ${old_previous_version} && ! ${old_previous_version} =~ ^[A-Za-z0-9._-]{7,64}$ ]]; then
  echo "Invalid version stored in ${previous_version_file}." >&2
  exit 1
fi

CASTOR_IMAGE_TAG=${version} docker compose \
  --env-file "${env_file}" \
  --file "${incoming_compose}" \
  config --quiet

echo "Loading Castor ${version} images..."
gzip --decompress --stdout "${image_bundle}" | docker load

if [[ -f ${compose_file} ]]; then
  cp "${compose_file}" "${previous_compose_file}"
fi
install -m 0644 "${incoming_compose}" "${compose_file}.new"
mv "${compose_file}.new" "${compose_file}"

activate() {
  local target_version=$1
  local target_compose=$2

  if ! CASTOR_IMAGE_TAG=${target_version} docker compose \
    --env-file "${env_file}" \
    --file "${target_compose}" \
    up --detach --wait --wait-timeout 180 --remove-orphans; then
    return 1
  fi

  local service
  for service in db backend frontend; do
    if [[ $(CASTOR_IMAGE_TAG=${target_version} docker compose \
      --env-file "${env_file}" \
      --file "${target_compose}" \
      ps --status running --services "${service}") != "${service}" ]]; then
      echo "Service did not remain running: ${service}" >&2
      return 1
    fi
  done
}

echo "Activating Castor ${version}..."
if ! activate "${version}" "${compose_file}"; then
  echo "Release ${version} failed to start." >&2

  if [[ -n ${current_version} && -f ${previous_compose_file} ]]; then
    echo "Rolling back to ${current_version}..." >&2
    cp "${previous_compose_file}" "${compose_file}"
    if activate "${current_version}" "${compose_file}"; then
      echo "Rollback to ${current_version} succeeded." >&2
    else
      echo "Rollback to ${current_version} also failed; manual recovery is required." >&2
    fi
  else
    echo "No previous release is available for rollback." >&2
  fi

  exit 1
fi

if [[ -n ${current_version} && ${current_version} != "${version}" ]]; then
  printf '%s\n' "${current_version}" > "${previous_version_file}"

  if [[ -n ${old_previous_version} && ${old_previous_version} != "${current_version}" ]]; then
    docker image rm \
      "castor-backend:${old_previous_version}" \
      "castor-frontend:${old_previous_version}" >/dev/null 2>&1 || true
  fi
fi
printf '%s\n' "${version}" > "${current_version_file}"

docker image prune --force >/dev/null || true

echo "Castor ${version} is running."
