# patterns2learn

**Design patterns, the Spring Boot way.** An interactive, bilingual (es/en) course
on design patterns: each lesson walks through an isometric diagram step by step,
next to real, runnable Spring Boot code.

Live site: https://patterns2learn.vercel.app

## Monorepo layout

- `examples/`: Maven multi-module project (Java 25, Spring Boot 4), one module
  per pattern at `examples/<category>/<pattern>`, e.g. `examples/behavioral/strategy`.
  Each module is a small, tested app; the lessons quote its code.
- `web/`: Astro static site (TypeScript strict).
  - `src/content/lessons/<slug>/`: `scene.ts` (entities, links and steps of the
    diagram) plus `es.md` and `en.md` (step texts, recap and quiz).
  - `src/engine/`: isometric projection, SVG renderer and lesson player.
  - `src/lib/`: lesson loading, validation, snippet extraction, highlighting.
- `docs/spec.md`: product spec.

## Getting started

The toolchain (Java 25, Node 26, pnpm 12) is pinned with [mise](https://mise.jdx.dev):

```bash
mise install
```

### examples

```bash
cd examples
./mvnw verify                                   # build and test every module
./mvnw -pl behavioral/strategy spring-boot:run  # run the Strategy demo on :8080
curl 'localhost:8080/api/pricing/quote?plan=ten-pack&sessions=12'
```

### web

```bash
cd web
pnpm install
pnpm dev          # http://localhost:4321
pnpm test         # unit tests (vitest)
pnpm check        # astro check (types)
pnpm build        # static build into dist/ (validates every lesson)
pnpm test:e2e     # Playwright; builds and serves on :4321 locally
```

Locally Playwright uses `/usr/bin/chromium`; in CI it installs its own browser.

## Code snippets in lessons

Lessons never copy code: a step points at a region of a Java file under `examples/`
and the build extracts it. Mark the region with line comments:

```java
// @step:ten-pack-strategy
@Component("ten-pack")
public class TenPackPricing implements PricingStrategy { ... }
// @end
```

and reference it from the scene:

```ts
code: { file: 'behavioral/strategy/src/main/java/.../TenPackPricing.java', region: 'ten-pack-strategy', highlight: [1] }
```

`file` is relative to `examples/`; `highlight` lists 1-based lines inside the
region. The build fails on a missing region, a duplicate marker, an
out-of-range highlight line, or es/en texts that do not match the scene's steps.

## Deployment (Vercel)

The site deploys from `web/` (Root Directory `web`, see `web/vercel.json`).
Lessons read their code from `../examples` at build time, so the Vercel project
must have **"Include files outside of the Root Directory in the Build Step"** (Settings → Build and Deployment → Root Directory)
enabled. Node 26 is selected through `engines.node` in `web/package.json`.

## License

MIT
