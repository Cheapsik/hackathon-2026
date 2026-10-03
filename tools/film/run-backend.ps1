# Film backend: its own database (castor_film) and port 5257, the committed seed with demo content, placeholder LLM.
# Needs the database container: `docker compose up -d --wait db` in the repository root.
# -Fresh drops castor_film first, so the inbox holds only the demo reports and the ones the scenes send.
param([switch]$Fresh)

$repo = Resolve-Path "$PSScriptRoot\..\.."

if ($Fresh) {
  docker compose --project-directory $repo exec -T db dropdb -U castor --if-exists castor_film
}

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'http://localhost:5257'
$env:ConnectionStrings__Castor = 'Host=localhost;Port=5432;Database=castor_film;Username=castor;Password=castor'
$env:Database__MigrateOnStartup = 'true'
$env:Seed__Path = "$repo\data\seed"
$env:Seed__OnStartup = 'true'
$env:Seed__DemoContent = 'true'
# Local throwaway database only. The scenes sign in with the same FILM_PASSWORD.
$env:Seed__DemoPassword = if ($env:FILM_PASSWORD) { $env:FILM_PASSWORD } else { 'castor-demo' }
$env:Llm__Provider = 'placeholder'

dotnet run --no-launch-profile --project "$repo\backend\src\Castor.Api\Castor.Api.csproj"
