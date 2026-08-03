# Tech Stack

## Backend
- Java 21, Spring Boot 3.x, Maven
- Spring Web (REST controllers, JSON)
- Spring Data JPA — H2 for local dev, easy swap to Postgres later
- Jakarta Bean Validation for request validation (`@Valid`, `@NotNull`, etc.)
- JUnit 5 + Spring Boot Test for unit/integration tests
- Run locally: `mvn spring-boot:run` (port 8080)

## Frontend
- Angular 21, standalone components (no NgModules)
- Signals for state, OnPush change detection everywhere
- SCSS, mobile-first responsive, accessible by default (labels,
  focus states, semantic HTML — not an afterthought)
- Run locally: `ng serve` (port 4200), proxied to backend on 8080

## Architecture style: modular monolith
One deployable Spring Boot app, split into feature modules
(`category`, `expense`, `budget`, `comparison`) — see structure.md
for the exact package layout. The rule that makes it "modular" and
not just folders:

- A module may only call another module through its **Service's
  public interface**. Never reach into another module's Repository
  or Entity directly.
- Controllers only talk to their own module's Service.
- The `comparison` module is the one exception allowed to depend on
  both `expense` and `budget` — everything else stays independent.
- No circular dependencies between modules, ever.

This is a convention, not compiler-enforced — if it's worth testing
the CLI on later, an ArchUnit test that fails the build on a
violation would be a good small feature to add in a later pass.

## Conventions
- DTOs at module boundaries — controllers never return JPA entities
  directly.
- Package-by-feature, not package-by-layer (no top-level
  `controllers/`, `services/`, `repositories/` packages).
- Dates as ISO-8601 (`yyyy-MM-dd`), periods as `yyyy-MM`.