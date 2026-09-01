# Architecture — Hexagonal / Ports & Adapters

> Configured for `obsidian-academic-cms`. Ports are the primary vocabulary (ADR 001: `VaultPort`, `ModalPort`, `SettingsPort`, `ClockPort`).

## Layers

```
          /----------- Ports (interfaces) -----------\
  Frameworks & Drivers  <->  Adapters  <->  Use Cases  <->  Entities
  (Obsidian API,        (VaultPort,   (application      (pure domain:
   Templater legacy,     ModalPort,    business          buildTitle,
   DOM, fs)              SettingsPort, rules,            buildFilename,
                         ClockPort)    CreateAssignment  scaffold dirs)
                                        Service)
```

Dependency Rule: `Use Cases` and `Entities` depend only on **ports (interfaces)**, never on concrete frameworks. Adapters implement ports and wrap the framework. `Entities` (pure domain) know nothing external — no `tp`, `app`, `DOM`, `fs`.

## Ports in this repo

| Port | Responsibility | Framework adapter |
|------|----------------|-------------------|
| `VaultPort` | createFolder, getAbstractFileByPath, read, move, getMatchedPath | Obsidian `app.vault` (no `fs`) |
| `ModalPort` | openAssignmentForm | `obsidian.Modal` (not raw DOM) |
| `SettingsPort` | getCodePath, from `data.json` GUI, fallback vault-relative | Obsidian settings |
| `ClockPort` | date/now | `moment` vs legacy `tp.date.now` |

No `FileSystemPort`/symlink — vault-only, agnostic paths, `isDesktopOnly: false`.

## RUP/Waterfall vs Agile

- RUP/Waterfall: document in `docs/03-architecture/` with C4 + detailed UML + ADR per decision.
- Agile: ADR + just-enough C4; UML only for critical parts.

## Associated GoF Patterns

| Layer | Typical Pattern | Use |
|-------|-----------------|-----|
| Use Cases | Strategy, Command, State | interchangeable rules |
| Adapters | Adapter, Proxy, Decorator | decouple framework |
| Frameworks | Factory, Singleton (with caution) | configured creation |

## How to Verify

- Import graph does not violate the Dependency Rule (ports point inward, no framework import in `Use Cases`/`Entities`; lint `dependency-cruiser` or review).
- Each UseCase mapped to UC/US.
- Each `Service` receives injected ports; tests use in-memory fakes (`Map<string, TFile>`), no `tp`/`document`/`fs`.