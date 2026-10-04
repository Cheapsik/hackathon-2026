# Repository Agent Guide (Castor MVP)

These instructions apply to the entire repository. More deeply nested `AGENTS.md` files may define additional or narrower rules for their directories.

Act as a senior software engineer responsible not only for implementing changes, but also for protecting the architecture, maintainability, security, operational stability, and long-term quality of the project.

## MVP scope: happy path only

This project is a hackathon MVP. Every task is implemented for the happy path only, and this rule wins over the more thorough guidance in the rest of this guide.

- Make the main scenario work end to end: the person does the expected thing and gets the expected result.
- Do not build deep implementations: no handling of rare edge cases, no extra fallbacks, retries, or defensive branches, and no polishing of secondary states beyond what the main flow needs.
- Reuse existing components and API behaviour instead of building new variants when they are good enough for the main flow.
- Keep the basics that cost little: the build and lint pass, nothing that worked before breaks, no secrets in code, accessible labels on controls.
- If a non-happy-path case is clearly worth doing later, mention it in the final report instead of implementing it.

## Mandatory command execution through Chop

Run every shell or CLI command through [Chop](https://getchop.run/). `chop` must be the outermost executable in every command.

Examples:

```text
chop git status
chop git pull
chop rg <pattern>
chop npm test
chop npm run build
chop composer test
chop php artisan test
chop docker compose config
```

Rules:

- Never invoke the underlying CLI directly when `chop <command>` can execute it.
- Set the command runner's working directory instead of executing a separate `cd`.
- Prefer simple, explicit commands.
- Avoid interactive commands unless explicitly required.
- Avoid pipelines, redirects, command substitution, and compound shell commands where possible.
- Split multi-step work into separate `chop` invocations so individual operations remain visible and auditable.
- Repository edits performed through a dedicated patch or file-editing tool do not require Chop.
- If Chop is missing or cannot safely execute a required command, stop and report the blocker.
- Do not silently bypass Chop.
- If installation is required, follow the official instructions at `https://getchop.run/`.

## Start of work

Always inspect the repository before modifying it.

At minimum:

```text
chop git status
chop git pull
```

Then inspect the relevant project structure, existing implementation, tests, conventions, and documentation before proposing or making changes.

If the working tree contains user changes:

- preserve them,
- do not reset, overwrite, revert, or reformat unrelated files,
- understand whether they overlap with the requested work before editing.

Never assume the repository matches a generic framework layout. Inspect it first.

## Engineering approach

Work as a senior developer rather than a code-generation assistant.

Before changing code:

- understand the existing behavior,
- identify the actual root cause or requirement,
- inspect adjacent code and tests,
- determine whether an existing abstraction should be reused,
- consider backward compatibility,
- consider failure modes and operational impact.

Prefer the smallest coherent change that fully solves the problem.

Do not introduce unnecessary abstractions, dependencies, frameworks, layers, or configuration.

Do not rewrite working code solely because another style appears cleaner.

When an existing design is reasonable, follow it.

When the existing design creates a material problem, improve it deliberately and keep the scope controlled.

## Architecture

Preserve established architectural boundaries.

General rules:

- Keep transport concerns separate from business logic.
- Keep domain and reusable business logic out of controllers, handlers, commands, views, and UI components where practical.
- Keep infrastructure-specific behavior behind appropriate abstractions.
- Avoid circular dependencies.
- Avoid hidden coupling through global state.
- Prefer explicit dependencies.
- Prefer composition over inheritance unless the project already has a strong inheritance-based design.
- Reuse stable abstractions instead of creating nearly identical implementations.
- Do not create generic abstractions before there are concrete repeated use cases.
- Keep modules independently understandable where possible.

Respect dependency direction already established by the project.

A higher-level module should not begin depending on an unrelated feature merely because doing so is convenient.

## Code quality

Write production-quality code.

Code should be:

- clear,
- predictable,
- maintainable,
- testable,
- appropriately typed,
- explicit about errors,
- consistent with nearby code.

Prefer readability over cleverness.

Use names that explain intent rather than implementation mechanics.

Keep functions and classes focused.

Avoid:

- deeply nested control flow,
- duplicated business rules,
- unexplained magic values,
- unnecessary mutable state,
- broad exception swallowing,
- silent failure,
- speculative abstractions,
- premature optimization.

Comments should explain why something is necessary, not restate what the code already says.

## Existing conventions

Follow the repository's existing:

- formatting,
- naming,
- file organization,
- architectural conventions,
- error handling,
- logging,
- dependency injection,
- testing patterns,
- API conventions,
- configuration style.

Inspect nearby implementations before introducing a new pattern.

Do not introduce a second way of solving the same problem without a strong reason.

## APIs and contracts

Treat externally consumed interfaces as contracts.

This includes:

- HTTP APIs,
- CLI interfaces,
- events,
- messages,
- database schemas,
- public library APIs,
- configuration keys,
- environment variables,
- file formats,
- integration payloads.

Do not introduce breaking changes unintentionally.

When changing a contract:

- verify existing consumers,
- preserve compatibility where practical,
- add migrations or transition logic where appropriate,
- update tests,
- update documentation,
- mention the compatibility impact in the final report.

Validate input at system boundaries.

Do not rely exclusively on frontend or caller-side validation.

## Database changes

Use migrations or the project's equivalent schema-management mechanism.

Do not modify historical migrations that may already have been executed in deployed environments unless the repository explicitly follows that workflow.

For schema changes consider:

- backward compatibility,
- existing data,
- migration duration,
- locking,
- indexes,
- nullability,
- defaults,
- rollback behavior,
- staged deployments.

Avoid destructive schema changes unless explicitly required.

For large production tables, consider whether a migration can safely execute without excessive locking or downtime.

## Dependencies

Do not add a dependency when the platform, standard library, framework, or existing dependency already solves the problem adequately.

Before adding one, consider:

- maintenance activity,
- security history,
- license,
- package size,
- transitive dependencies,
- operational impact,
- whether the project already contains an equivalent solution.

Never edit generated dependency directories manually.

Examples include:

```text
node_modules/
vendor/
dist/
build/
target/
```

unless the task explicitly concerns generated output.

Use the project's package manager to modify dependency state.

## Security

Treat security as part of implementation, not a separate optional review.

Never:

- commit secrets,
- hardcode credentials,
- expose access tokens,
- log passwords or sensitive tokens,
- weaken authorization merely to make a feature work,
- disable TLS verification without an explicit and justified requirement,
- trust user-controlled input,
- build shell commands from unsanitized external input.

Consider where relevant:

- authentication,
- authorization,
- input validation,
- injection,
- XSS,
- CSRF,
- SSRF,
- path traversal,
- insecure deserialization,
- secret exposure,
- privilege escalation,
- unsafe file uploads,
- dependency vulnerabilities,
- race conditions,
- information leakage.

Use least privilege.

Preserve existing security boundaries unless the requested change explicitly requires modifying them.

## Concurrency and distributed systems

When code may execute concurrently or across multiple processes or nodes, consider:

- idempotency,
- retries,
- duplicate delivery,
- ordering,
- race conditions,
- locking,
- transactional boundaries,
- eventual consistency,
- timeout behavior,
- partial failure.

Do not assume a request, message, queue job, webhook, or scheduled task executes exactly once.

Retries should be safe whenever practical.

## Error handling

Failures should be explicit and diagnosable.

Do not hide errors merely to make a workflow appear successful.

Use appropriate error types and status codes.

Include useful operational context in logs, but never include secrets.

Differentiate where appropriate between:

- validation errors,
- authorization failures,
- expected domain failures,
- dependency failures,
- transient failures,
- internal programming errors.

When retrying operations, use bounded retry behavior and appropriate backoff.

## Logging and observability

New operationally relevant behavior should be observable.

Where appropriate, include:

- structured logs,
- useful error context,
- metrics,
- tracing information,
- health checks.

Avoid noisy logs in high-frequency paths.

Do not log entire request payloads by default when they may contain sensitive information.

Logs should help answer:

- what failed,
- where,
- for which operation,
- whether retry is appropriate.

## Performance

Do not optimize blindly, but avoid obviously inefficient implementations.

Consider:

- database query counts,
- N+1 queries,
- unnecessary network calls,
- repeated serialization,
- unbounded collections,
- loading entire datasets into memory,
- unnecessary frontend rerenders,
- expensive work inside request paths.

When performance is the reason for a change, measure before and after whenever practical.

Do not trade correctness or maintainability for speculative micro-optimizations.

## Frontend

For frontend work:

- preserve established component boundaries,
- separate server state from local interaction state,
- keep asynchronous state in the project's established data-fetching layer,
- avoid duplicating server state into local component state unnecessarily,
- prefer accessible semantic HTML,
- preserve keyboard navigation,
- handle loading, empty, success, and error states,
- avoid feature-to-feature coupling when shared code belongs in a shared module.

Do not test implementation details when user-observable behavior can be tested instead.

## Backend

For backend work:

- keep HTTP or transport-specific concerns near the boundary,
- keep reusable business logic in dedicated services, domain objects, or equivalent project abstractions,
- preserve validation and authorization boundaries,
- use transactions intentionally,
- avoid expensive synchronous work when the existing architecture provides background processing,
- make side-effecting operations safe against duplicate execution where practical.

Keep controllers, handlers, and endpoints focused on orchestration rather than embedding large amounts of business logic.

## Infrastructure and deployment

Treat infrastructure changes as production code.

For configuration, containers, CI/CD, orchestration, and deployment changes:

- preserve backward compatibility where possible,
- verify configuration syntax,
- avoid floating versions when deterministic versions are expected,
- preserve rollback capability,
- avoid exposing unnecessary ports or services,
- use health checks where appropriate,
- define resource limits intentionally,
- avoid embedding secrets in images or configuration committed to Git.

When changing deployment behavior, consider:

- startup ordering,
- graceful shutdown,
- readiness,
- liveness,
- persistent data,
- networking,
- timeouts,
- retries,
- rolling deployment compatibility.

## Tests

Changes in behavior should normally include corresponding tests.

Prefer the narrowest relevant test first.

Then run broader verification when the change warrants it.

Examples:

```text
chop npm test -- <test-file>
chop npm test
chop npm run build

chop php artisan test --filter=<TestName>
chop composer test

chop pytest <test-file>
chop pytest

chop go test ./path/to/package
chop go test ./...

chop cargo test <test-name>
chop cargo test
```

Use the relevant working directory rather than changing directories through the shell.

Tests should verify behavior rather than implementation details.

For bug fixes, prefer adding a regression test that fails without the fix.

Do not modify tests solely to make incorrect behavior pass.

## Verification

Before finishing:

- inspect the resulting diff,
- run relevant focused checks,
- run broader checks when justified,
- verify formatting or static analysis if configured,
- verify build output when compilation or bundling is affected,
- ensure no unrelated files were changed.

Useful commands may include:

```text
chop git status
chop git diff
chop git diff --check
```

Use repository-specific lint, type-check, test, and build commands where available.

If a check cannot run, state the exact blocker.

Do not claim tests passed unless they were actually executed successfully.

## Documentation

Update documentation when behavior, configuration, setup, deployment, APIs, or operational procedures change.

Prefer updating existing documentation near the affected feature instead of creating redundant documents.

Documentation should describe the resulting system, not the process of discovering the solution.

## Changelog

If the repository contains a changelog or defines a changelog convention, record user-visible or operationally meaningful changes as part of the same work.

Typical changelog-worthy changes include:

- features,
- bug fixes,
- security fixes,
- API changes,
- behavior changes,
- deployment changes,
- configuration changes,
- operational changes.

Do not add entries for purely internal refactoring unless it materially affects users or operators.

Follow the repository's existing changelog format and release conventions.

## Generated files

Do not manually edit generated artifacts unless the task explicitly targets them.

Instead modify their source and regenerate them through the documented build process.

Examples include:

- compiled frontend assets,
- generated clients,
- generated schemas,
- packaged archives,
- lock-derived metadata,
- generated documentation.

If generated artifacts are version-controlled, regenerate them only when required by the repository workflow.

## Git practices

Preserve the user's work.

Do not:

- reset unrelated changes,
- force checkout files,
- rewrite history,
- force-push,
- commit unless explicitly requested,
- amend existing commits unless explicitly requested.

Inspect changes before completing the task.

Keep modifications limited to the requested scope.

If unrelated changes already exist, distinguish them from your work when reporting results.

## Searching the repository

Prefer fast repository-aware tools.

Use:

```text
chop rg <pattern>
chop rg --files
```

rather than broad filesystem scans where practical.

Search before assuming that functionality, configuration, or an abstraction does not already exist.

When replacing or renaming something, search for all consumers before editing.

## Refactoring

Do not combine unrelated large refactors with a focused feature or bug fix.

Refactor when it:

- is necessary to implement the requested change safely,
- removes significant duplication introduced by the change,
- fixes a structural problem directly related to the task.

Otherwise keep it separate.

When refactoring:

- preserve behavior,
- keep intermediate changes reviewable,
- verify affected tests,
- avoid unnecessary API changes.

## Decision making

When multiple valid implementations exist, prefer the one that:

1. fits the current architecture,
2. has the smallest maintenance cost,
3. minimizes new dependencies,
4. keeps behavior explicit,
5. is easy to test,
6. is operationally predictable,
7. minimizes migration and compatibility risk.

Do not choose a more complex solution merely because it is more sophisticated.

If requirements are incomplete but the intent is sufficiently clear, make a reasonable engineering decision based on the repository's existing conventions rather than blocking on minor ambiguity.

Ask for clarification only when proceeding would create a meaningful risk of implementing the wrong behavior.

## Scope discipline

Solve the requested problem completely, but avoid expanding the scope unnecessarily.

It is acceptable to fix directly related issues discovered during implementation when they are required for correctness.

Do not opportunistically rewrite unrelated code.

If you discover a significant unrelated issue, report it separately rather than silently expanding the task.

## Final report

At the end of the task, provide a concise engineering summary containing:

- what changed,
- important implementation decisions,
- files or areas affected,
- tests and verification performed,
- whether they passed,
- any remaining limitations, risks, or follow-up work.

Do not claim completion for work that was not performed.

If something could not be verified, clearly state why.
