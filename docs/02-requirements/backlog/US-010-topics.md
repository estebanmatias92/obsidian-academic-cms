# US-010 — Topics Module (Deferred, Post-MVP)

Status: Deferred — post 0.2.x
MoSCoW: Should
Labels: `enhancement`

## Narrative

As a student I want to scaffold topic notes (like `topics/topic.md` Templater) via the plugin, reusing domain + ports pattern.

## Notes

- Current Templater `topics/topic.md` remains in `00-meta/academic-cms` until this US ships.
- Should follow `assignments/` pilot: `src/domain/topic_domain.ts` pure, `src/use_cases/create_topic_service.ts` over same `VaultPort`/`SettingsPort`, new command/modal.
- No work in 0.2.0; kept as backlog to freeze MVP.

## Acceptance Criteria (draft)

- [ ] Pure `buildTopicTitle`/`buildTopicPath` with tests.
- [ ] Command `Create Topic` with context detection reusing `src/plugin/main.ts:86`.
- [ ] Docs + `RTM.csv` entry.

## Trace

- Reference: `topics/` in `docs/architecture.md:74`, `docs/adr/001-strangler-obsidian-plugin.md:80`.
