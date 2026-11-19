# Singleton Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Second lesson, Singleton. A runnable module `examples/creational/singleton` plus an es/en lesson with 9 steps, a quiz and a cheatsheet. It follows the arc the user approved on 2026-11-19.

**Architecture:** Same as the Strategy slice:
- Java code with `// @step:<region>` markers.
- `web/src/content/lessons/singleton/{scene.ts, es.md, en.md}`, validated at build time.
- Two new icons, `board` and `timer`, in the icon catalogue.

**Tech Stack:** Java 25, Spring Boot 4.0.9, Maven wrapper; Astro 7 / TypeScript / Vitest / Playwright.

**Spec:** `docs/spec.md`:
- §3: arc of 6..10 steps; problem → Spring way → "Spring ya lo hace" → recap.
- §4: domain `WodCatalog`; Spring angle: singleton scope.
- §7: content model and validation.
- ADR 0001: icons.

## Global Constraints

- **Package and module.** Package `com.patterns2learn.box.singleton`. The module is `<module>creational/singleton</module>` in `examples/pom.xml`.
- **Lesson rules.**
  - Original text only. Never copy refactoring.guru or GoF prose.
  - Tuteo, light CrossFit nods.
  - es and en with the same step ids.
- **Validator limits.** Steps 6..10, quiz 3..5, a `@describe` per step, and highlight lines within the snippet.
- **Content values.**
  - Seed WODs: **Fran** ("21-15-9 thrusters and pull-ups") and **Cindy** ("20-minute AMRAP: 5 pull-ups, 10 push-ups, 15 air squats").
  - The coach adds **Murph** ("1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run").
- **API.**

  | Request | Success | Error |
  |---|---|---|
  | `GET /api/wods` | the WODs sorted by name | |
  | `POST /api/wods` with JSON `{"name","workout"}` | 201 | 409 `{"error":"WOD already exists: <name>"}` on duplicate |
  | `POST /api/bookings?wod=<name>` | 201 `{"wod":"<name>"}` | 404 `{"error":"unknown WOD: <name>"}` |

- Commit trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Branch `feature/singleton`.

## Review Focus

1. **Duplicate WOD names** (`POST` Murph twice) must answer 409 and must not overwrite. Pinned in Task 1.
2. **Concurrent adds** must not lose entries (`ConcurrentHashMap` and `putIfAbsent`). Pinned in Task 1.
3. **Snippet markers** in `before/` classes must compile and extract cleanly. Pinned by the web build in Task 3.
4. **Scene layout.** Two catalogs in the same steps must not overlap labels. Pinned by the visual check in Task 3.
5. **Home "Empieza aquí"** links Singleton once the lesson exists. Pinned in Task 3 (pages test).

---

### Task 1: Java module

**Files:**
- `examples/creational/singleton/pom.xml` (webmvc and the test starters, as in strategy)
- Main code under `src/main/java/com/patterns2learn/box/singleton/`:
  - `SingletonApplication`
  - `Wod` (record `name`, `workout`)
  - `WodCatalog`:
    - `@Component`, with a `ConcurrentHashMap` seeded with Fran and Cindy;
    - `List<Wod> all()`, sorted by name;
    - `Optional<Wod> find(String)`;
    - `void add(Wod)`, which throws `DuplicateWodException` when the name already exists.
  - `DuplicateWodException`
  - `UnknownWodException`
  - `BookingService` (`Booking book(String wod)`, throws `UnknownWodException`)
  - `Booking` (record `wod`)
  - `WodTimer` (`@Component @Scope("prototype")`, with `start()` and `elapsed()`)
  - `web/WodController`
  - `web/BookingController`
  - `web/ApiErrors`
  - `before/NaiveWiring`: nested `NaiveWodController` and `NaiveBookingService`, each doing `new NaiveWodCatalog()`
  - `before/NaiveWodCatalog`
  - `before/ClassicWodCatalog`: private constructor plus a static holder `getInstance()`
- Tests:
  - `WodCatalogTest`: seeds, sorting, find, duplicate, and a concurrent add of 1000 WODs ending at size 1002
  - `before/NaiveWiringTest`: Murph added through the controller's catalog is not visible to the booking service
  - `before/ClassicWodCatalogTest`: same instance, and state leaks between callers
  - `web/WodApiTest`: `@SpringBootTest` + MockMvc. POST Murph returns 201 and a booking for Murph returns 201, so the instance is shared; a duplicate returns 409; an unknown WOD returns 404.
  - `SpringDoesItTooTest`: with `AnnotationConfigApplicationContext`, `WodCatalog` is the same instance twice and `WodTimer` gives different instances.
- Marker regions:
  - `naive-new`
  - `naive-smell` (in the test)
  - `classic`
  - `classic-leak` (in the test)
  - `catalog-bean`
  - `shared-instance` (in the test)
  - `thread-safe`
  - `scopes` (in the test)

- [ ] Write the tests first (`./mvnw -q -pl creational/singleton test` fails because the classes are missing), then implement, then `./mvnw -B verify` passes for every module.
- [ ] Commit: `feat(examples): Singleton module (WodCatalog, naive/classic before, scopes)`

### Task 2: Icons `board` and `timer`

- [ ] Extend `ICON_NAMES` with `'board'` and `'timer'`. The existing `every icon renders token-only markup` test iterates the catalogue. Add `expect(ICON_NAMES).toContain('board')` and `toContain('timer')`, and run it RED first.
- [ ] Draw them: `board` is a whiteboard with a title bar and lines; `timer` is a stopwatch. The lab e2e count of icons becomes 11.
- [ ] Commit: `feat(engine): board and timer icons`

### Task 3: Lesson content

- **Scene:** `web/src/content/lessons/singleton/scene.ts`, with `category: 'creational'`.
  - Entities:
    - `coach` and `athlete` (actors);
    - `context`;
    - `controller` (WodController, `arrow-in`) and `booking` (BookingService, `calendar`);
    - `catalogA` and `catalogB` (WodCatalog copies, warn, `board`);
    - `classic` (ClassicWodCatalog, danger, `board`);
    - `catalog` (WodCatalog, accent, `board`);
    - `timer1` and `timer2` (WodTimer, `timer`).
  - Steps: `problem`, `smell`, `classic`, `classic-cons`, `spring-bean`, `shared`, `threads`, `spring-does-it`, `recap`.
- **Texts:** `es.md` and `en.md`, 9 steps with callouts, a recap, and a 4-question quiz.
- **Tests:**
  - `tests/unit/lessons.test.ts` lists both slugs;
  - `tests/unit/pages.test.ts` adds that the home links `/{lang}/patterns/singleton/` and that the run-it link points to `examples/creational/singleton`.
- [ ] Full checks: `pnpm test`, `pnpm check`, `pnpm build`, `pnpm test:e2e`. Visually check all 9 steps (paper and dark).
- [ ] Commit: `content(singleton): Singleton lesson (es, en)`
