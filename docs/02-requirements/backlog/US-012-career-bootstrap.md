# US-012 — Career / Course Bootstrap (Deferred)

Status: Deferred — post 0.2.x
MoSCoW: Could
Labels: `enhancement`

## Narrative

As a student I want to bootstrap `_career.md` / `_course.md` metadata via plugin instead of `career/entrypoint.md` Templater.

## Notes

- Current `career/entrypoint.md`, `_course-metadata.md`, `_career-meta.md` remain Templater until this US ships.
- Requires GUI for student/course fields, vault writes via `VaultPort`.

## Acceptance Criteria (draft)

- [ ] `Bootstrap Career` + `Bootstrap Course` commands.
- [ ] Validation of existing `_career.md`/`_course.md`.

## Trace

- `career/` per `docs/architecture.md:74`.
