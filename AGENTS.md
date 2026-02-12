# Repository Best Practices

## Architecture & Design
- Follow the Single Responsibility Principle (SRP) for components and modules.
- Avoid tightly coupling concerns; keep responsibilities clearly separated.
- Favor hexagonal architecture patterns to isolate domain logic from external interfaces.
- Organise **entities, stores, services, and controllers by domain concept** (e.g. `user`, `item`) rather than by technical type.
- Apply **hexagonal architecture**: define ports in the domain, implement adapters (DB/files/etc), and wire them together via a domain module.

## Implementation Guidance
- Keep modules focused and cohesive; extract new modules when responsibilities grow.
- Prefer dependency inversion (interfaces/ports) at boundaries.
- Ensure new code aligns with existing structure and naming conventions.
- Use shadcn components over creating new ones where available.
- Add unit tests for any reasonably complex logic or transformations; calling another service or repository does not necessarily need a unit test.

## Domain & module conventions

- **Domain code location**: `src/lib/server/domain/<domain>/...`
- **Infra code location**: `src/lib/server/infra/...`
  - Infra can contain decision logic (environment selection, wiring helpers, etc).
  - Domain modules should be **wiring only** (no environment checks or file system probing logic).

- **Ports (interfaces)**: define in `<domain>.ports.ts` (e.g. `item.ports.ts`)
  - Services depend on ports, not concrete adapters.

- **Adapters (implementations)**:
  - Prefer naming by adapter: `<domain>.store.ts` for DB adapter, `<domain>.store.fs.ts` for filesystem adapter, etc.

- **Services**:
  - Default service implementation in `<domain>.service.ts`
  - Environment-specific service implementation can live in `<domain>.service.<environment>.ts` if needed.

- **Domain modules (wiring)**:
  - Base module: `<domain>.module.ts` (must `export default function ...(): <DomainModule>`)
  - Environment modules: `<domain>.module.development.ts`, `<domain>.module.production.ts`, `<domain>.module.testing.ts`
  - When the env module exists, it should swap **entire adapter/service implementations** (not patch objects).

- **How controllers/pages access domain**:
  - Import `getDomainModule` from `src/lib/server/infra/domainModule.ts`
  - Example: `const { itemService } = getDomainModule<ItemModule>('item');`

## Tools
### Svelte
- Always ensure to use svelte5 syntax
- Never use runes={false}
- use let { data }: Props = $props(); not export let data
