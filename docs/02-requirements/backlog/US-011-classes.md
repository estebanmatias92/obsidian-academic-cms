# US-011 — Classes / Lecture Scaffolding (Deferred)

Status: Deferred — post 0.2.x
MoSCoW: Should
Labels: `enhancement`

## Narrative

As a student I want to scaffold class notes (`classes/clase.md`, `lecture.md`) via plugin.

## Notes

- Mirror `assignments/` ports pattern; reuse `VaultPort`/`ClockPort`.
- Deferred to keep 0.2.0 assignment-only.

## Acceptance Criteria (draft)

- [ ] `src/domain/class_domain.ts` pure.
- [ ] `Create Class` command.

## Trace

- `classes/` per `docs/architecture.md:74`.
