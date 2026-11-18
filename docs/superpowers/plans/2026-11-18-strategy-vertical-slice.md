# Strategy Vertical Slice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar en Vercel la primera lección completa (**Strategy**, cálculo de cuotas del box) con motor isométrico, dos temas, dos idiomas, código Java sincronizado, quiz, cheatsheet y su módulo Spring Boot ejecutable.

**Architecture:** Monorepo con `examples/` (Maven multimódulo, Java 25 + Spring Boot 4) y `web/` (Astro + TypeScript). En el build, Astro carga cada lección (`scene.ts` + `es.md`/`en.md`), extrae los fragmentos Java de `examples/` por marcadores, valida todo y genera HTML estático. En el navegador, una isla TS (`LessonPlayer`) aplica los snapshots de cada paso al SVG isométrico y anima los paquetes.

**Tech Stack:** Java 25, Spring Boot 4.0.x, Maven Wrapper, JUnit 5, MockMvc · Node 26, pnpm, Astro (última estable al hacer el scaffold), TypeScript strict, Shiki, Vitest + happy-dom, Playwright, `@fontsource/ibm-plex-mono`, `@vercel/analytics` · GitHub Actions, Vercel.

**Spec:** [`docs/spec.md`](../../spec.md). Leerlo antes de cada tarea; las secciones citadas (§) son normativas.

## Global Constraints

- Java **25**, Spring Boot **4.0.x**, builds solo con `./mvnw` (Maven Wrapper). Versiones fijadas en `.mise.toml`: `java = "25"`, `node = "26"`.
- `groupId` `com.patterns2learn`; paquete raíz `com.patterns2learn.box.<pattern>`; módulo en `examples/<category>/<pattern>`.
- Web: Astro + TypeScript `strict`. **Sin React ni otro framework de UI.** Gestor de paquetes: **pnpm**.
- Locales `es`, `en`; URLs `/{lang}/patterns/{slug}`; el slug es igual en los dos idiomas; `defaultLocale` `en`.
- Temas: solo `paper` y `blueprint`, en `<html data-theme>`, con los tokens exactos de spec §5.2. Nunca colores fijos en componentes o SVG.
- Tipografía: IBM Plex Mono (`@fontsource/ibm-plex-mono`).
- `localStorage`: claves `p2l:progress` y `p2l:theme`. Cada acceso dentro de `try/catch`.
- Nada de cookies; la analítica es solo `@vercel/analytics`.
- Licencia **MIT** para todo el repo.
- Todo el texto de las lecciones es original; no se copia de refactoring.guru ni del libro GoF.
- Diagramas nuevos en la documentación: **UML en Mermaid**.
- Código, identificadores y commits en inglés; documentación y contenido `es` en español.

## Review Focus

1. **`localStorage` lanza o no existe** (modo privado, cookies bloqueadas) → la lección se ve y se navega; el progreso no se guarda y no hay errores en consola. Test en Task 9.
2. **`goTo` encadenado durante una animación** (pulsar → cinco veces rápido) → el DOM queda exactamente en el snapshot del último paso, sin paquetes huérfanos. Test en Task 6.
3. **Marcador Java mal formado** (región ausente, duplicada, sin `@end` o anidada) → el build falla con un mensaje que nombra fichero y región. Test en Task 4.
4. **Desalineación `es`/`en`/`scene`** (paso que falta, orden distinto, entidad inexistente) → el build falla nombrando la lección, el idioma y el id. Test en Task 5.
5. **Viewport de 360 px** → sin scroll horizontal, código plegable y botones de paso accesibles. Test en Task 11.

---

## Estructura de ficheros

```
.mise.toml  LICENSE  README.md  .gitignore  .editorconfig
.github/workflows/ci.yml
examples/
  pom.xml  mvnw  mvnw.cmd  .mvn/wrapper/…
  behavioral/strategy/
    pom.xml
    src/main/java/com/patterns2learn/box/strategy/
      StrategyApplication.java
      Money.java  PricingRequest.java  UnknownPlanException.java
      PricingStrategy.java  MonthlyPricing.java  TenPackPricing.java
      DropInPricing.java  StudentPricing.java  PricingService.java
      web/PricingController.java  web/QuoteResponse.java  web/ApiErrors.java
      before/LegacyPricingService.java
    src/test/java/com/patterns2learn/box/strategy/
      PricingStrategiesTest.java  PricingServiceTest.java
      LegacyPricingServiceTest.java  web/PricingControllerTest.java
      SpringDoesItTooTest.java
web/
  package.json  astro.config.mjs  tsconfig.json  vitest.config.ts  playwright.config.ts  vercel.json
  src/styles/{tokens.css, base.css, print.css}
  src/i18n/{es.ts, en.ts, index.ts}
  src/engine/{types.ts, iso.ts, render.ts, player.ts, tween.ts}
  src/lib/{snippets.ts, lesson-text.ts, validate.ts, lessons.ts, progress.ts, theme.ts, contrast.ts}
  src/content/lessons/strategy/{scene.ts, es.md, en.md}
  src/components/{Header.astro, CourseTree.astro, IsoCanvas.astro, StepPanel.astro,
                  CodePanel.astro, StepBar.astro, Quiz.astro, DonateCard.astro, Seo.astro}
  src/layouts/{BaseLayout.astro, LessonLayout.astro}
  src/pages/index.astro
  src/pages/[lang]/index.astro
  src/pages/[lang]/patterns/[slug].astro
  src/pages/[lang]/patterns/[slug]/cheatsheet.astro
  src/scripts/{lesson.ts, quiz.ts, theme-toggle.ts}
  tests/unit/*.test.ts
  tests/e2e/*.spec.ts
```

---

### Task 1: Toolchain, monorepo y módulo Strategy (dominio y estrategias)

**Files:**
- Create: `.mise.toml`, `LICENSE` (MIT, "Jaime Hernandez", 2026), `.gitignore` (Java + Node + `.astro/` + `dist/` + `target/`), `.editorconfig`, `README.md` (actualizar el existente: nombre, subtítulo, cómo arrancar `examples` y `web`)
- Create: `examples/pom.xml` (parent: `spring-boot-starter-parent` 4.0.x, `<java.version>25</java.version>`, `<modules>` con `behavioral/strategy`), Maven Wrapper (`mvn -N wrapper:wrapper` vía `mise x maven -- …` o descargando los scripts oficiales)
- Create: `examples/behavioral/strategy/pom.xml` (deps: `spring-boot-starter-web`, `spring-security-crypto`, `spring-boot-starter-test`)
- Create: `Money.java`, `PricingRequest.java`, `UnknownPlanException.java`, `PricingStrategy.java`, `MonthlyPricing.java`, `TenPackPricing.java`, `DropInPricing.java`, `StudentPricing.java`, `PricingService.java`, `StrategyApplication.java`
- Test: `PricingStrategiesTest.java`, `PricingServiceTest.java`

**Interfaces:**
- Produces:
  - `record Money(BigDecimal amount)`: normaliza a escala 2 con HALF_UP en el constructor compacto; `static Money eur(String)`; `Money times(int)`; `Money percentOff(int)`.
  - `record PricingRequest(String plan, int sessions)`: lanza `IllegalArgumentException("sessions must be >= 1")` si `sessions < 1`.
  - `interface PricingStrategy { Money priceFor(PricingRequest request); }`
  - Beans `@Component("monthly")`, `@Component("ten-pack")`, `@Component("drop-in")` y `@Component("student")`.
  - `@Service PricingService(Map<String, PricingStrategy> strategies)` con `Money quote(PricingRequest)` y `Set<String> plans()`.
  - `UnknownPlanException extends RuntimeException`, con el mensaje `"unknown plan: " + plan`.

- [ ] **Step 1: Toolchain.** Crear `.mise.toml` con `[tools] java = "25"  node = "26"  pnpm = "latest"`, ejecutar `mise install`. Verificar con `mise x -- java -version` (muestra `25`) y `mise x -- node -v` (muestra `v26`).

- [ ] **Step 2: Escribir los tests de las estrategias**

```java
class PricingStrategiesTest {
    @Test void monthlyIsFlat() {
        assertThat(new MonthlyPricing().priceFor(new PricingRequest("monthly", 1))).isEqualTo(Money.eur("79.00"));
        assertThat(new MonthlyPricing().priceFor(new PricingRequest("monthly", 30))).isEqualTo(Money.eur("79.00"));
    }
    @Test void tenPackChargesPerBlockOfTenRoundingUp() {
        var s = new TenPackPricing();
        assertThat(s.priceFor(new PricingRequest("ten-pack", 1))).isEqualTo(Money.eur("120.00"));
        assertThat(s.priceFor(new PricingRequest("ten-pack", 10))).isEqualTo(Money.eur("120.00"));
        assertThat(s.priceFor(new PricingRequest("ten-pack", 12))).isEqualTo(Money.eur("240.00"));
    }
    @Test void dropInChargesPerSession() {
        assertThat(new DropInPricing().priceFor(new PricingRequest("drop-in", 3))).isEqualTo(Money.eur("45.00"));
    }
    @Test void studentGetsTwentyPercentOffMonthly() {
        assertThat(new StudentPricing().priceFor(new PricingRequest("student", 1))).isEqualTo(Money.eur("63.20"));
    }
    @Test void sessionsBelowOneAreRejected() {
        assertThatThrownBy(() -> new PricingRequest("monthly", 0)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void moneyEqualityIgnoresInputScale() {
        assertThat(new Money(new BigDecimal("79"))).isEqualTo(Money.eur("79.00"));
    }
}
```

- [ ] **Step 3: Escribir el test del servicio (contexto Spring real)**

```java
@SpringBootTest
class PricingServiceTest {
    @Autowired PricingService service;
    @Test void springInjectsEveryStrategyByBeanName() {
        assertThat(service.plans()).containsExactlyInAnyOrder("monthly", "ten-pack", "drop-in", "student");
    }
    @Test void delegatesToTheStrategyNamedByThePlan() {
        assertThat(service.quote(new PricingRequest("ten-pack", 12))).isEqualTo(Money.eur("240.00"));
    }
    @Test void unknownPlanFailsWithClearMessage() {
        assertThatThrownBy(() -> service.quote(new PricingRequest("yoga", 1)))
            .isInstanceOf(UnknownPlanException.class).hasMessage("unknown plan: yoga");
    }
}
```

- [ ] **Step 4: Ejecutar y ver que fallan.** `cd examples && ./mvnw -q -pl behavioral/strategy test`. Esperado: errores de compilación por clases inexistentes.

- [ ] **Step 5: Implementar las clases** de "Interfaces" con las reglas de precio de spec §10.1. `TenPackPricing` calcula los bloques como `(sessions + 9) / 10`.

- [ ] **Step 6: Ejecutar y ver que pasan.** `./mvnw -q -pl behavioral/strategy test`. Esperado: `BUILD SUCCESS`, 9 tests.

- [ ] **Step 7: Commit**

```bash
git add .mise.toml LICENSE .gitignore .editorconfig README.md examples
git commit -m "feat(examples): strategy module with membership pricing strategies"
```

---

### Task 2: API REST, versión "before", demo de Spring y marcadores

**Files:**
- Create: `web/PricingController.java`, `web/QuoteResponse.java`, `web/ApiErrors.java` (`@RestControllerAdvice`), `before/LegacyPricingService.java`
- Modify: `PricingStrategy.java`, `PricingService.java`, `TenPackPricing.java`, `StudentPricing.java` (añadir los marcadores)
- Test: `web/PricingControllerTest.java`, `LegacyPricingServiceTest.java`, `SpringDoesItTooTest.java`

**Interfaces:**
- Consumes: todo lo de la Task 1.
- Produces:
  - `GET /api/pricing/quote?plan&sessions`, que responde `QuoteResponse(String plan, int sessions, String amount)`. `amount` usa `toPlainString()` con 2 decimales.
  - `LegacyPricingService.quote(String plan, int sessions): Money`, un `switch` sobre `monthly` / `ten-pack` / `drop-in`.
  - **Regiones de marcadores** que consume la Task 8. Deben existir exactamente así:

| Región | Fichero | Contenido |
|---|---|---|
| `legacy-switch` | `before/LegacyPricingService.java` | el método `quote` con el `switch` |
| `pricing-interface` | `PricingStrategy.java` | la interfaz |
| `ten-pack-strategy` | `TenPackPricing.java` | la clase completa con `@Component("ten-pack")` |
| `service-map` | `PricingService.java` | el campo `Map`, el constructor y `quote` |
| `controller` | `web/PricingController.java` | el método handler |
| `student-strategy` | `StudentPricing.java` | la clase completa |
| `delegating-encoder` | `SpringDoesItTooTest.java` | el cuerpo del test |

- [ ] **Step 1: Escribir los tests**

```java
@WebMvcTest(PricingController.class) @Import({PricingService.class, MonthlyPricing.class, TenPackPricing.class, DropInPricing.class, StudentPricing.class})
class PricingControllerTest {
    @Autowired MockMvc mvc;
    @Test void quotesAPlan() throws Exception {
        mvc.perform(get("/api/pricing/quote").param("plan", "ten-pack").param("sessions", "12"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.plan").value("ten-pack"))
           .andExpect(jsonPath("$.sessions").value(12))
           .andExpect(jsonPath("$.amount").value("240.00"));
    }
    @Test void unknownPlanIs400() throws Exception {
        mvc.perform(get("/api/pricing/quote").param("plan", "yoga").param("sessions", "1"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown plan: yoga"));
    }
    @Test void zeroSessionsIs400() throws Exception {
        mvc.perform(get("/api/pricing/quote").param("plan", "monthly").param("sessions", "0"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("sessions must be >= 1"));
    }
}

class LegacyPricingServiceTest {
    @Test void legacyMatchesTheNewPrices() {
        var legacy = new LegacyPricingService();
        assertThat(legacy.quote("monthly", 1)).isEqualTo(Money.eur("79.00"));
        assertThat(legacy.quote("ten-pack", 12)).isEqualTo(Money.eur("240.00"));
        assertThat(legacy.quote("drop-in", 3)).isEqualTo(Money.eur("45.00"));
    }
}

class SpringDoesItTooTest {
    @Test void delegatingPasswordEncoderPicksStrategyByPrefix() {
        // @step:delegating-encoder
        PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        String hash = encoder.encode("wod-2026");
        assertThat(hash).startsWith("{bcrypt}");
        assertThat(encoder.matches("wod-2026", hash)).isTrue();
        assertThat(encoder.matches("wod-2026", "{noop}wod-2026")).isTrue();
        // @end
    }
}
```

- [ ] **Step 2: Ejecutar y ver que fallan.** `./mvnw -q -pl behavioral/strategy test`. Esperado: fallos de compilación en las clases web y `before`.

- [ ] **Step 3: Implementar** el controlador, el `ApiErrors` (que mapea `UnknownPlanException` e `IllegalArgumentException` a 400 con `{"error": message}`) y `LegacyPricingService`. Después, **añadir las siete regiones de marcadores** de la tabla.

- [ ] **Step 4: Ejecutar.** `./mvnw -q verify`. Esperado: `BUILD SUCCESS`, 14 tests. Comprobar a mano con `./mvnw -q -pl behavioral/strategy spring-boot:run` y `curl 'localhost:8080/api/pricing/quote?plan=student&sessions=1'`, que debe devolver `{"plan":"student","sessions":1,"amount":"63.20"}`.

- [ ] **Step 5: Commit.** `git commit -m "feat(examples): pricing API, legacy version and snippet markers"`

---

### Task 3: Scaffold web, tokens de los dos temas y contraste AA

**Files:**
- Create: `web/` con `pnpm create astro@latest web -- --template minimal --typescript strict --no-git --install`; `astro.config.mjs` con `i18n: { locales: ['es','en'], defaultLocale: 'en', routing: { prefixDefaultLocale: true } }`, `site: 'https://patterns2learn.vercel.app'`, la integración `@astrojs/sitemap` y la opción `vite.server.fs.allow: ['..']` para leer `../examples`.
- Create: `src/styles/tokens.css` (los tokens exactos de spec §5.2 en `:root[data-theme="paper"]` y `:root[data-theme="blueprint"]`, más `--radius: 10px` y `--font: "IBM Plex Mono", ui-monospace, monospace`), `src/styles/base.css`
- Create: `src/lib/contrast.ts`, `src/lib/theme.ts`, `src/i18n/{es,en,index}.ts`
- Create: `vitest.config.ts` (environment `happy-dom`), scripts en `package.json`: `test`, `test:e2e`, `check` (`astro check`)
- Test: `tests/unit/contrast.test.ts`, `tests/unit/theme.test.ts`

**Interfaces:**
- Produces:
  - `contrastRatio(hexA: string, hexB: string): number` (WCAG 2.x).
  - `readTokens(css: string, theme: 'paper' | 'blueprint'): Record<string, string>`.
  - `type Theme = 'paper' | 'blueprint'`; `getTheme(): Theme` (lee `p2l:theme`, guardado como JSON string (`"blueprint"`), y si no hay nada o es inválido, usa `prefers-color-scheme`); `setTheme(t: Theme): void` (escribe `data-theme` y `p2l:theme`; si `localStorage` lanza, solo escribe `data-theme`).
  - `t(lang: Locale, key: UiKey): string` y `type Locale = 'es' | 'en'`. Las claves mínimas: `next`, `back`, `step`, `of`, `code`, `showCode`, `hideCode`, `quiz`, `check`, `correct`, `incorrect`, `cheatsheet`, `print`, `donate`, `donateCta`, `startHere`, `themePaper`, `themeBlueprint`, `language`, `course`, `minutes`, `runIt`.

- [ ] **Step 1: Escribir los tests**

```ts
// tests/unit/contrast.test.ts
import css from '../../src/styles/tokens.css?raw';
import { contrastRatio, readTokens } from '../../src/lib/contrast';
for (const theme of ['paper', 'blueprint'] as const) {
  const t = readTokens(css, theme);
  test(`${theme}: ink on bg/surface ≥ 4.5`, () => {
    expect(contrastRatio(t['--ink'], t['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t['--ink'], t['--surface'])).toBeGreaterThanOrEqual(4.5);
  });
  test(`${theme}: muted and accent-ink on surface ≥ 4.5`, () => {
    expect(contrastRatio(t['--muted'], t['--surface'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t['--accent-ink'], t['--accent-soft'])).toBeGreaterThanOrEqual(4.5);
  });
  test(`${theme}: accent-strong as graphic on bg/surface ≥ 3`, () => {
    expect(contrastRatio(t['--accent-strong'], t['--bg'])).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(t['--accent-strong'], t['--surface'])).toBeGreaterThanOrEqual(3);
  });
}
test('known ratio', () => expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1));
```

```ts
// tests/unit/theme.test.ts
test('setTheme survives a throwing localStorage', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  expect(() => setTheme('blueprint')).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('blueprint');
});
test('getTheme falls back to prefers-color-scheme', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
  expect(getTheme()).toBe('blueprint');
});
```

- [ ] **Step 2:** `pnpm -C web test`. Esperado: FAIL (los módulos no existen).
- [ ] **Step 3:** Implementar `contrast.ts`, `theme.ts`, `tokens.css` e i18n. **Si algún token de spec §5.2 no llega a AA, ajustar el valor en `tokens.css` y también en la tabla del spec**, en el mismo commit.
- [ ] **Step 4:** `pnpm -C web test && pnpm -C web check`. Esperado: PASS y 0 errores.
- [ ] **Step 5:** `git commit -m "feat(web): astro scaffold, paper/blueprint tokens with AA contrast tests"`

---

### Task 4: Extractor de fragmentos Java

**Files:**
- Create: `web/src/lib/snippets.ts`
- Test: `web/tests/unit/snippets.test.ts` (con fixtures inline, sin leer `examples/`)

**Interfaces:**
- Produces:
  - `type Snippet = { file: string; region: string; code: string; lineCount: number }`.
  - `extractRegion(source: string, file: string, region: string): Snippet`. Elimina las líneas de marcador y la sangría común. Lanza `SnippetError`.
  - `class SnippetError extends Error { file: string; region: string }`. El mensaje empieza por `${file}#${region}: ` y sigue con `region not found`, `region defined 2 times`, `region not closed with // @end` o `nested region "<otra>" inside "<region>"`.
  - `loadSnippet(examplesRoot: string, file: string, region: string): Snippet`. Lee el fichero; si no existe, lanza `SnippetError` con `file not found`.

- [ ] **Step 1: Escribir los tests**

```ts
const src = [
  'class A {',
  '    // @step:body',
  '    void run() {',
  '        go();',
  '    }',
  '    // @end',
  '}',
].join('\n');

test('extracts and dedents a region without marker lines', () => {
  const s = extractRegion(src, 'A.java', 'body');
  expect(s.code).toBe('void run() {\n    go();\n}');
  expect(s.lineCount).toBe(3);
});
test('missing region', () => expect(() => extractRegion(src, 'A.java', 'nope')).toThrow('A.java#nope: region not found'));
test('duplicate region', () => expect(() => extractRegion(src + '\n' + src, 'A.java', 'body')).toThrow('A.java#body: region defined 2 times'));
test('unclosed region', () => expect(() => extractRegion('// @step:x\nfoo();', 'B.java', 'x')).toThrow('B.java#x: region not closed with // @end'));
test('nested region', () => expect(() => extractRegion('// @step:a\n// @step:b\n// @end\n// @end', 'C.java', 'a')).toThrow('C.java#a: nested region "b" inside "a"'));
test('missing file', () => expect(() => loadSnippet('/nonexistent', 'X.java', 'r')).toThrow('X.java#r: file not found'));
```

- [ ] **Step 2:** `pnpm -C web test snippets`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. Los marcadores se reconocen con `/^\s*\/\/\s*@step:([a-z0-9-]+)\s*$/` y `/^\s*\/\/\s*@end\s*$/`.
- [ ] **Step 4:** `pnpm -C web test snippets`. Esperado: PASS (6).
- [ ] **Step 5:** `git commit -m "feat(web): java snippet extractor with marker validation"`

---

### Task 5: Modelo de lección, parser de Markdown y validador

**Files:**
- Create: `web/src/engine/types.ts` (tipos del modelo, spec §7.2), `web/src/lib/lesson-text.ts`, `web/src/lib/validate.ts`, `web/src/lib/lessons.ts`
- Test: `web/tests/unit/lesson-text.test.ts`, `web/tests/unit/validate.test.ts`

**Interfaces:**
- Produces (en `types.ts`; los nombres y campos son exactamente los del diagrama de spec §7.2):
  - `Locale`, `Category = 'creational' | 'structural' | 'behavioral' | 'spring'`, `Level = 'beginner' | 'intermediate' | 'advanced'`.
  - `EntityKind`, `LinkStyle`, `Tone = 'neutral' | 'accent' | 'warn' | 'danger'`.
  - `IsoPoint {x,y,z?}`, `IsoSize {w,d,h}`, `Entity`, `Link`, `Packet`, `SnippetRef`, `SceneStep`, `Scene`, `StepText`, `QuizQuestion`, `Recap`, `LessonText`, `Lesson`.
  - `ResolvedStep = SceneStep & { text: StepText; snippet?: Snippet }`.
- Produces (en `lesson-text.ts`): `parseLessonText(markdown: string, file: string): LessonText`.
  - El frontmatter YAML trae `title`, `summary`, `minutes`, `level`, `recap` y `quiz`.
  - El cuerpo se parte por `## @step:<id> — <title>`.
  - La línea `@describe: …` se extrae a `describe` y se quita del HTML.
  - Los callouts `> [!problem]`, `> [!key-idea]`, `> [!spring]` y `> [!warning]` se convierten en `<aside class="callout callout--<kind>">`.
  - Markdown a HTML con `marked`.
- Produces (en `validate.ts`): `validateLesson(slug: string, scene: Scene, texts: Record<Locale, LessonText>, snippets: Map<string, Snippet>): string[]`. Devuelve la lista de errores (vacía si todo es válido) con las reglas 1–5 de spec §7.3. La clave de `snippets` es `${file}#${region}`.
- Produces (en `lessons.ts`): `loadLesson(slug: string): Promise<Lesson>`. Importa `scene.ts`, lee `es.md`/`en.md`, carga los fragmentos desde `../examples` y valida; si hay errores lanza `LessonValidationError` con todos ellos juntos. También `listLessons(): Promise<Lesson[]>` y `resolveSteps(lesson, lang): ResolvedStep[]`.

- [ ] **Step 1: Escribir los tests del parser**

```ts
const md = `---
title: Strategy
summary: s
minutes: 12
level: beginner
recap: { intent: i, participants: [a], pros: [p], cons: [c], related: [state] }
quiz:
  - { q: Q1, options: [a, b, c], answer: 1, explain: e }
---
## @step:problem — El problema
Texto **fuerte**.
> [!problem]
> Cuidado.
@describe: Un bloque grande con tres ramas.

## @step:fix — La solución
Otro texto.
@describe: Tres bloques.
`;
test('parses steps, describe and callouts', () => {
  const t = parseLessonText(md, 'x/es.md');
  expect(t.steps.map(s => s.id)).toEqual(['problem', 'fix']);
  expect(t.steps[0].title).toBe('El problema');
  expect(t.steps[0].describe).toBe('Un bloque grande con tres ramas.');
  expect(t.steps[0].html).toContain('<strong>fuerte</strong>');
  expect(t.steps[0].html).toContain('callout--problem');
  expect(t.steps[0].html).not.toContain('@describe');
  expect(t.quiz[0].answer).toBe(1);
});
```

- [ ] **Step 2: Escribir los tests del validador.** Usar un helper `fixture()` que devuelva una escena válida de 6 pasos con textos `es`/`en` coherentes, y en cada test romper una sola cosa:

```ts
test('valid fixture has no errors', () => expect(validateLesson('demo', ...fixture())).toEqual([]));
test('en missing a step', () => {
  const [scene, texts, snips] = fixture(); texts.en.steps.splice(2, 1);
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/en.md: step "s3" missing (expected after "s2")');
});
test('steps out of order', () => {
  const [scene, texts, snips] = fixture(); texts.es.steps.reverse();
  expect(validateLesson('demo', scene, texts, snips)[0]).toMatch(/^demo\/es\.md: step order differs from scene/);
});
test('unknown entity in visible', () => {
  const [scene, texts, snips] = fixture(); scene.steps[0].visible.push('ghost');
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/scene.ts: step "s1" references unknown entity "ghost"');
});
test('unknown link in packet', () => {
  const [scene, texts, snips] = fixture(); scene.steps[1].packets.push({ link: 'nope', label: 'x' });
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/scene.ts: step "s2" references unknown link "nope"');
});
test('highlight outside snippet', () => {
  const [scene, texts, snips] = fixture(); scene.steps[0].code!.highlight = [99];
  expect(validateLesson('demo', scene, texts, snips)[0]).toMatch(/highlight line 99 outside snippet/);
});
test('step count bounds', () => {
  const [scene, texts, snips] = fixture(); scene.steps = scene.steps.slice(0, 5);
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/scene.ts: 5 steps (allowed 6..10)');
});
test('quiz bounds and answer index', () => {
  const [scene, texts, snips] = fixture(); texts.es.quiz[0].answer = 7;
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/es.md: quiz question 1 answer 7 out of range');
});
test('empty describe', () => {
  const [scene, texts, snips] = fixture(); texts.en.steps[0].describe = '';
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/en.md: step "s1" has no @describe');
});
```

- [ ] **Step 3:** `pnpm -C web test lesson-text validate`. Esperado: FAIL.
- [ ] **Step 4:** Implementar `types.ts`, `lesson-text.ts` (dependencias `marked` y `yaml`), `validate.ts` y `lessons.ts`.
- [ ] **Step 5:** `pnpm -C web test`. Esperado: PASS.
- [ ] **Step 6:** `git commit -m "feat(web): lesson model, markdown step parser and validator"`

---

### Task 6: Motor isométrico: proyección, renderer y reproductor

**Files:**
- Create: `web/src/engine/iso.ts`, `web/src/engine/render.ts`, `web/src/engine/tween.ts`, `web/src/engine/player.ts`
- Create: `web/src/styles/engine.css` (clases `.iso-entity`, `.is-hidden` con opacidad 0 y transición de 250 ms, `.is-highlighted` con contorno `--accent-strong` de 2.5 px y `--pop-shadow`, y los `tone-*` que mapean a tokens; `@media (prefers-reduced-motion: reduce)` sin transiciones)
- Test: `web/tests/unit/iso.test.ts`, `web/tests/unit/render.test.ts`, `web/tests/unit/player.test.ts`

**Interfaces:**
- Consumes: los tipos de `engine/types.ts` (Task 5).
- Produces:
  - `TILE_W = 64`, `TILE_H = 32`; `project(p: IsoPoint): { sx: number; sy: number }` con las fórmulas de spec §8.1; `depth(e: Entity): number` (`x + y + z`).
  - `renderScene(scene: Scene): string`. Devuelve un `<svg>` completo con `viewBox` calculado más 32 px de margen. Las entidades van ordenadas por `depth` (y por orden de declaración si empatan), cada una en un `<g class="iso-entity kind-<kind> tone-<tone>" data-id="<id>">` con una píldora de etiqueta. Los enlaces van en `<g class="iso-link style-<style>" data-id="<id>">` con un `<path id="path-<id>">`. Hay una capa `<g class="iso-packets">` vacía. Sin colores literales: solo `var(--…)`.
  - `class LessonPlayer`:
    - `constructor(root: HTMLElement, scene: Scene, opts: { onStep?: (index: number) => void; reducedMotion?: boolean })`.
    - `goTo(index: number): void` (acota el índice a `[0, n-1]`), `next()`, `prev()`, `get index(): number`, `destroy()`.
    - Escucha `keydown` en `root`: `ArrowRight`, `ArrowLeft`, `Home` y `End`.
    - Al cambiar de paso escribe `root.dataset.step = step.id` y `aria-describedby="describe-<id>"` en el `<svg>`.
  - `tween(durationMs: number, onFrame: (t: number) => void): { cancel(): void; finished: Promise<void> }`, con *ease-in-out* y `requestAnimationFrame`.

- [ ] **Step 1: Escribir los tests de proyección y renderer**

```ts
test('origin projects to 0,0', () => expect(project({ x: 0, y: 0 })).toEqual({ sx: 0, sy: 0 }));
test('x axis goes down-right, y axis down-left, z up', () => {
  expect(project({ x: 1, y: 0 })).toEqual({ sx: 32, sy: 16 });
  expect(project({ x: 0, y: 1 })).toEqual({ sx: -32, sy: 16 });
  expect(project({ x: 0, y: 0, z: 1 })).toEqual({ sx: 0, sy: -32 });
});
test('renders entities in depth order with data-ids and no literal colors', () => {
  const svg = renderScene(miniScene); // 3 entities declared far→near shuffled
  const ids = [...svg.matchAll(/class="iso-entity[^"]*" data-id="([^"]+)"/g)].map(m => m[1]);
  expect(ids).toEqual(['back', 'mid', 'front']);
  expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  expect(svg).toContain('id="path-l1"');
});
```

- [ ] **Step 2: Escribir los tests del reproductor** (happy-dom, con `requestAnimationFrame` falso mediante `vi.useFakeTimers()`)

```ts
function mount(reducedMotion = false) {
  const root = document.createElement('div'); root.innerHTML = renderScene(scene);
  document.body.append(root); return { root, p: new LessonPlayer(root, scene, { reducedMotion }) };
}
const visibleIds = (root: HTMLElement) =>
  [...root.querySelectorAll('.iso-entity:not(.is-hidden)')].map(e => (e as HTMLElement).dataset.id).sort();

test('goTo applies the step snapshot', () => {
  const { root, p } = mount(); p.goTo(2);
  expect(visibleIds(root)).toEqual([...scene.steps[2].visible].sort());
  expect(root.dataset.step).toBe(scene.steps[2].id);
});
test('goTo clamps out-of-range indices', () => {
  const { p } = mount(); p.goTo(99); expect(p.index).toBe(scene.steps.length - 1); p.goTo(-3); expect(p.index).toBe(0);
});
test('rapid goTo during animation ends on last snapshot with no orphan packets', async () => {
  const { root, p } = mount();
  for (let i = 0; i < 5; i++) p.next();
  await vi.runAllTimersAsync();
  expect(p.index).toBe(5);
  expect(visibleIds(root)).toEqual([...scene.steps[5].visible].sort());
  expect(root.querySelectorAll('.iso-packets > *').length).toBe(scene.steps[5].packets.length);
});
test('reduced motion places packets at destination without animating', () => {
  const raf = vi.spyOn(window, 'requestAnimationFrame');
  const { root, p } = mount(true); p.goTo(indexWithPackets);
  expect(raf).not.toHaveBeenCalled();
  expect(root.querySelectorAll('.iso-packets > *').length).toBeGreaterThan(0);
});
test('keyboard navigation', () => {
  const { root, p } = mount();
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); expect(p.index).toBe(1);
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' })); expect(p.index).toBe(scene.steps.length - 1);
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' })); expect(p.index).toBe(0);
});
```

En los tests, `scene` es una escena de 6 pasos definida en `tests/unit/fixtures/scene.ts`, en la que el paso `indexWithPackets = 3` tiene un paquete y el paso 5 tiene otro, que queda en reposo en su destino.

- [ ] **Step 3:** `pnpm -C web test iso render player`. Esperado: FAIL.
- [ ] **Step 4:** Implementar.
  - **Prismas en `render.ts`:** se dibujan con 3 polígonos (tapa, cara izquierda y cara derecha) a partir de las 8 esquinas proyectadas. La tapa usa `var(--surface)` y las caras `color-mix(in srgb, var(--tone) 35%, var(--surface))` y `55%`.
  - **Paquetes en `player.ts`:** se posicionan con `path.getPointAtLength(t · total)`. Como happy-dom no implementa `getPointAtLength`, se usa como alternativa una interpolación lineal entre los extremos del enlace, guardados en `data-x1/y1/x2/y2`.
- [ ] **Step 5:** `pnpm -C web test`. Esperado: PASS.
- [ ] **Step 6:** `git commit -m "feat(web): isometric projection, svg renderer and lesson player"`

---

### Task 7: Páginas, layout de lección y rutas i18n

**Files:**
- Create: `src/layouts/BaseLayout.astro` (`<html lang data-theme>`, un script inline anti-parpadeo que aplica `p2l:theme` o `prefers-color-scheme` antes del primer pintado, las fuentes, `tokens.css`, `base.css` y `engine.css`, y `<Analytics />` de `@vercel/analytics/astro`)
- Create: `src/components/Header.astro` (marca "patterns2learn" con el subtítulo "Design patterns, the Spring Boot way", selector de idioma que conserva el slug, `ThemeToggle` y un botón de donar con enlace a `DONATE_URL`)
- Create: `src/components/{CourseTree, IsoCanvas, StepPanel, CodePanel, StepBar, Seo}.astro`, `src/layouts/LessonLayout.astro`
- Create: `src/pages/index.astro`, `src/pages/[lang]/index.astro` (versión mínima; se completa en la Task 10), `src/pages/[lang]/patterns/[slug].astro`
- Create: `src/scripts/lesson.ts` (monta `LessonPlayer` sobre `[data-lesson]`, sincroniza los botones, la barra de pasos y la URL `#step-<id>`), `src/scripts/theme-toggle.ts`
- Create: `src/config.ts` con `export const DONATE_URL = 'https://buymeacoffee.com/REPLACE_ME'` y `export const REPO_URL = 'https://github.com/zuldare/patterns2learn'`
- Test: `tests/unit/pages.test.ts` (build smoke con `astro build` sobre una lección fixture `demo` bajo `src/content/lessons/__fixtures__/demo` que solo se incluye cuando `P2L_FIXTURES=1`)

**Interfaces:**
- Consumes: `loadLesson`, `listLessons` y `resolveSteps` (Task 5); `renderScene` y `LessonPlayer` (Task 6); `t()` y `setTheme()` (Task 3); `Shiki.codeToHtml` con `createCssVariablesTheme({ name: 'p2l', variablePrefix: '--shiki-' })` y el transformer de líneas resaltadas (`class="line is-hl"`).
- Produces:
  - **Marcado HTML** que leen `lesson.ts`, la Task 9 y la Task 11. Los atributos exactos son:
    - `<article data-lesson="<slug>" data-steps="<n>">`
    - Por cada paso: `<section class="step-text" data-step-id="<id>" id="step-<id>">` en `StepPanel`, `<div class="code-snippet" data-step-id="<id>">` en `CodePanel` y `<p id="describe-<id>" class="sr-only">` con la descripción.
    - CSS: `[data-lesson]:not([data-step="X"]) [data-step-id="X"] { display: none }`, generado con un bloque `<style>` por lección. **Sin JS** se ven todos los pasos seguidos (progressive enhancement); el script añade `data-step` al montar.
    - `StepBar`: `<ol class="step-bar">` con `<button data-goto="<index>">`.
    - Botones `[data-action="prev"]`, `[data-action="next"]` y `[data-action="toggle-code"]`.
  - Variables `--shiki-*` añadidas a `tokens.css` para cada tema.

- [ ] **Step 1: Escribir el test de humo del build**

```ts
test('build emits both locales with hreflang, step sections and svg', async () => {
  execSync('pnpm astro build', { cwd: webRoot, env: { ...process.env, P2L_FIXTURES: '1' } });
  for (const lang of ['es', 'en']) {
    const html = readFileSync(`${webRoot}/dist/${lang}/patterns/demo/index.html`, 'utf8');
    expect(html).toContain(`<html lang="${lang}"`);
    expect(html).toContain('hreflang="es"'); expect(html).toContain('hreflang="en"');
    expect(html.match(/class="step-text"/g)?.length).toBe(6);
    expect(html).toContain('<svg'); expect(html).toContain('role="img"');
    expect(html).toContain('var(--shiki-');
  }
  expect(readFileSync(`${webRoot}/dist/index.html`, 'utf8')).toContain('<noscript>');
}, 120_000);
```

- [ ] **Step 2:** `pnpm -C web test pages`. Esperado: FAIL.
- [ ] **Step 3:** Implementar los componentes y las páginas.
  - **`[slug].astro`:** `getStaticPaths` genera el producto de `listLessons()` por `['es','en']`.
  - **Raíz `index.astro`:** un script inline que hace `navigator.languages.some(l => l.startsWith('es')) ? '/es/' : '/en/'` con `location.replace`, y un `<noscript>` con los dos enlaces.
  - **Layout:** las tres columnas, los breakpoints de spec §5.1 y la cuadrícula de fondo del lienzo con `--grid` (en Blueprint, líneas a 32 px y 160 px).
- [ ] **Step 4:** `pnpm -C web test && pnpm -C web check`. Esperado: PASS. Comprobar a mano con `pnpm -C web dev`, abriendo `/es/patterns/demo` con `P2L_FIXTURES=1`: las flechas cambian de paso, el código cambia y el tema cambia sin parpadeo.
- [ ] **Step 5:** `git commit -m "feat(web): lesson layout, i18n routes, synced text/code panels"`

---

### Task 8: Contenido de la lección Strategy

**Files:**
- Create: `web/src/content/lessons/strategy/scene.ts`, `es.md`, `en.md`

**Interfaces:**
- Consumes: los tipos de la Task 5 y las regiones de la Task 2.
- Produces: la lección `strategy` (categoría `behavioral`, nivel `beginner`, 12 minutos).

**Escena.** Las entidades usan los ids exactos y una posición de rejilla orientativa (se ajusta visualmente):

| id | kind | label | pos | tone |
|---|---|---|---|---|
| `athlete` | actor | Athlete | (0,3) | neutral |
| `context` | container | Spring context | (2,0) w6 d6 | neutral |
| `controller` | block | PricingController | (2,3) | neutral |
| `legacy` | block | LegacyPricingService | (4,3) | danger |
| `service` | block | PricingService | (4,3) | accent |
| `iface` | interface | PricingStrategy | (6,3) | neutral |
| `monthly` | block | monthly | (7,1) | neutral |
| `tenpack` | block | ten-pack | (7,2.5) | neutral |
| `dropin` | block | drop-in | (7,4) | neutral |
| `student` | block | student | (7,5.5) | accent |
| `encoder` | block | DelegatingPasswordEncoder | (4,1) | accent |

Los enlaces son `athlete→controller` (call), `controller→service` (call), `controller→legacy` (call), `service→iface` (injects) y `monthly/tenpack/dropin/student→iface` (implements). Los ids siguen el formato `l-<from>-<to>`.

**Pasos.** Los ids, en este orden, coinciden en `scene.ts`, `es.md` y `en.md`:

| # | id | Visible / destacado | Paquete | Código (región · highlight) |
|---|---|---|---|---|
| 1 | `problem` | athlete, controller, legacy · hl legacy | `plan=ten-pack` en athlete→controller | `legacy-switch` · líneas del `switch` |
| 2 | `smell` | igual · hl legacy | — | `legacy-switch` · la rama nueva comentada como `// student?` |
| 3 | `interface` | + iface · hl iface | — | `pricing-interface` |
| 4 | `strategies` | + monthly, tenpack, dropin · hl los tres | — | `ten-pack-strategy` · `@Component("ten-pack")` |
| 5 | `injection` | + context, service (− legacy) · hl context, service | — | `service-map` · el constructor |
| 6 | `request` | todo salvo student y encoder · hl tenpack | `plan=ten-pack` → controller → service; `240.00` de vuelta | `controller` |
| 7 | `extend` | + student · hl student | — | `student-strategy` |
| 8 | `spring-does-it` | context, encoder · hl encoder | `{bcrypt}…` | `delegating-encoder` |
| 9 | `recap` | todo salvo encoder | — | `service-map` |

**Textos.** Escribir `es.md` y `en.md` siguiendo el tono de spec §4 (cercano, tuteando, guiños de CrossFit moderados) y con el formato de la Task 5. Contenido mínimo de cada idioma:
- **Recap:** la intención en palabras propias (no la frase del GoF); participantes: Context (`PricingService`), Strategy (`PricingStrategy`) y ConcreteStrategy; pros: Open/Closed, sin condicionales, testeable por separado; contras: más clases, el cliente debe conocer las claves; relacionados: State, Template Method, Factory Method.
- **Quiz de 4 preguntas:**
  1. ¿Qué inyecta Spring en `Map<String, PricingStrategy>`? Respuesta: todos los beans que implementan la interfaz, con su nombre de bean como clave.
  2. ¿Qué tienes que tocar para añadir `student`? Respuesta: solo la nueva clase.
  3. ¿Cuál es la diferencia con State?
  4. ¿Cómo elige `DelegatingPasswordEncoder` la estrategia? Respuesta: por el prefijo `{id}`.

- [ ] **Step 1:** Escribir `scene.ts` con las tablas de arriba.
- [ ] **Step 2:** Escribir `es.md` y `en.md`.
- [ ] **Step 3: Verificar.** `pnpm -C web astro build`. Esperado: termina sin `LessonValidationError`. Si falla, el mensaje indica qué id o región corregir.
- [ ] **Step 4: Revisión visual.** Con `pnpm -C web dev`, recorrer `/es/patterns/strategy` y `/en/patterns/strategy` en los dos temas y ajustar las posiciones en `scene.ts` hasta que no haya solapes. **Pedir al usuario que revise el texto en español** antes de cerrar la tarea.
- [ ] **Step 5:** `git commit -m "content: strategy lesson (scene, es, en)"`

---

### Task 9: Quiz, progreso y cheatsheet

**Files:**
- Create: `src/lib/progress.ts`, `src/components/Quiz.astro`, `src/scripts/quiz.ts`, `src/components/DonateCard.astro`, `src/pages/[lang]/patterns/[slug]/cheatsheet.astro`, `src/styles/print.css`
- Modify: `src/scripts/lesson.ts` (guardar y restaurar el paso), `src/components/CourseTree.astro` (marca de lección completada, hidratada en el cliente)
- Test: `tests/unit/progress.test.ts`, `tests/unit/quiz.test.ts`

**Interfaces:**
- Consumes: el marcado de la Task 7 y `LessonText.quiz` y `recap` (Task 5).
- Produces:
  - `type Progress = { lessons: Record<string, { step: number; done: boolean; quiz?: number }> }`.
  - `loadProgress(): Progress`. Devuelve `{ lessons: {} }` si falla o el JSON es inválido.
  - `saveStep(slug: string, step: number, total: number): void`. Marca `done: true` cuando `step === total - 1`.
  - `saveQuiz(slug: string, score: number): void`, con la puntuación en `[0, 1]`.
  - `scoreQuiz(answers: (number | null)[], questions: QuizQuestion[]): number`.
  - Quiz en el HTML: `<form class="quiz" data-slug>` con `<fieldset data-q="<i>">`, `<input type="radio">` y `<p class="quiz-explain" hidden>`.

- [ ] **Step 1: Escribir los tests**

```ts
beforeEach(() => localStorage.clear());
test('round-trips step and marks done on last step', () => {
  saveStep('strategy', 3, 9); expect(loadProgress().lessons.strategy).toEqual({ step: 3, done: false });
  saveStep('strategy', 8, 9); expect(loadProgress().lessons.strategy.done).toBe(true);
});
test('done stays true when going back', () => {
  saveStep('strategy', 8, 9); saveStep('strategy', 2, 9);
  expect(loadProgress().lessons.strategy).toEqual({ step: 2, done: true });
});
test('corrupt JSON yields empty progress', () => {
  localStorage.setItem('p2l:progress', '{nope'); expect(loadProgress()).toEqual({ lessons: {} });
});
test('throwing storage is silent', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  expect(() => saveStep('strategy', 1, 9)).not.toThrow();
  expect(loadProgress()).toEqual({ lessons: {} });
});
test('scoreQuiz counts correct answers, unanswered as wrong', () => {
  const qs = [{ answer: 0 }, { answer: 2 }, { answer: 1 }, { answer: 1 }] as QuizQuestion[];
  expect(scoreQuiz([0, 2, null, 0], qs)).toBe(0.5);
});
```

- [ ] **Step 2:** `pnpm -C web test progress quiz`. Esperado: FAIL.
- [ ] **Step 3: Implementar.**
  - **Quiz:** al pulsar "Comprobar" se muestra la explicación en cada pregunta fallada, se marcan las acertadas con `--accent` y se llama a `saveQuiz`.
  - **Cheatsheet:** una página con la intención, los participantes, un mini diagrama (`renderScene` del paso `recap`), el fragmento `service-map`, pros/contras y relacionados. Un botón `window.print()`.
  - **`print.css`:** A4 vertical, sin cabecera, sin navegación ni donaciones, fondo blanco y tinta negra en los dos temas, y todo en **una sola página**.
  - **`DonateCard`:** se muestra al final de la lección, después del quiz.
- [ ] **Step 4:** `pnpm -C web test`. Esperado: PASS.
- [ ] **Step 5:** `git commit -m "feat(web): quiz, local progress, printable cheatsheet, donate card"`

---

### Task 10: Portada, SEO y accesibilidad

**Files:**
- Modify: `src/pages/[lang]/index.astro` (hero con nombre y subtítulo, tarjeta "Empieza aquí" con el orden de spec §5.1 en el que solo Strategy enlaza y el resto aparece como "Próximamente / Coming soon", y árbol del curso)
- Modify: `src/components/Seo.astro` (`<title>`, description, canonical, `hreflang` es/en/x-default, Open Graph y Twitter card con `public/og.png` de 1200×630, generado como SVG→PNG a partir de un render de la escena de Strategy y guardado en el repo)
- Create: `public/robots.txt`, `public/favicon.svg`
- Test: amplía `tests/unit/pages.test.ts`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: `dist/sitemap-index.xml` y las metaetiquetas en todas las páginas.

- [ ] **Step 1: Ampliar el test**

```ts
test('SEO and a11y basics on strategy pages', () => {
  const html = readFileSync(`${webRoot}/dist/es/patterns/strategy/index.html`, 'utf8');
  expect(html).toMatch(/<link rel="canonical" href="https:\/\/patterns2learn\.vercel\.app\/es\/patterns\/strategy\/?"/);
  expect(html).toContain('hreflang="x-default"');
  expect(html).toContain('property="og:image"');
  expect(html).toMatch(/aria-describedby="describe-problem"/);
  expect(existsSync(`${webRoot}/dist/sitemap-index.xml`)).toBe(true);
  const home = readFileSync(`${webRoot}/dist/es/index.html`, 'utf8');
  expect(home).toContain('href="/es/patterns/strategy/"');
});
```

- [ ] **Step 2:** `pnpm -C web test pages`. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `pnpm -C web test`. Esperado: PASS.
- [ ] **Step 5:** `git commit -m "feat(web): home with start-here path, SEO metadata, sitemap"`

---

### Task 11: E2E, CI y despliegue en Vercel

**Files:**
- Create: `web/playwright.config.ts` (`webServer: pnpm build && pnpm preview`; proyectos `desktop` a 1440×900 y `mobile` a 360×780)
- Create: `web/tests/e2e/lesson.spec.ts`, `web/tests/e2e/mobile.spec.ts`
- Create: `.github/workflows/ci.yml` (jobs `examples`: setup-java 25 temurin + `./mvnw -B verify` en `examples/`; `web`: pnpm + node 26 + `pnpm install --frozen-lockfile` + `pnpm test` + `pnpm check` + `pnpm build` + `pnpm exec playwright install --with-deps chromium` + `pnpm test:e2e`)
- Create: `web/vercel.json` (`{"framework": "astro", "buildCommand": "pnpm build", "outputDirectory": "dist"}`)

**Interfaces:**
- Consumes: el marcado de las Tasks 7 y 9.

- [ ] **Step 1: Escribir los tests e2e**

```ts
for (const lang of ['es', 'en'])
  for (const theme of ['paper', 'blueprint'])
    test(`${lang}/${theme}: walk all steps with keyboard`, async ({ page }) => {
      await page.addInitScript(t => localStorage.setItem('p2l:theme', JSON.stringify(t)), theme);
      await page.goto(`/${lang}/patterns/strategy/`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const lesson = page.locator('[data-lesson="strategy"]');
      await lesson.focus();
      for (let i = 1; i < 9; i++) await page.keyboard.press('ArrowRight');
      await expect(lesson).toHaveAttribute('data-step', 'recap');
      await expect(page.locator('.step-text[data-step-id="recap"]')).toBeVisible();
      await expect(page.locator('.step-text[data-step-id="problem"]')).toBeHidden();
    });

test('progress survives reload', async ({ page }) => {
  await page.goto('/en/patterns/strategy/');
  await page.click('[data-action="next"]'); await page.click('[data-action="next"]');
  await page.reload();
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'interface');
});

test('works with storage blocked', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await page.goto('/en/patterns/strategy/'); await page.click('[data-action="next"]');
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'smell');
  expect(errors).toEqual([]);
});

test('root redirects by browser language', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'es-ES' }); const page = await ctx.newPage();
  await page.goto('/'); await expect(page).toHaveURL(/\/es\/$/);
});
```

```ts
// mobile.spec.ts (proyecto mobile)
test('no horizontal scroll and collapsible code at 360px', async ({ page }) => {
  await page.goto('/es/patterns/strategy/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const code = page.locator('.code-panel'); await expect(code).toHaveAttribute('data-open', 'false');
  await page.click('[data-action="toggle-code"]'); await expect(code).toHaveAttribute('data-open', 'true');
  await page.click('[data-action="next"]');
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'smell');
});
```

- [ ] **Step 2:** `pnpm -C web test:e2e`. Esperado: PASS. Si algo falla, se corrige en el componente correspondiente, no en el test.
- [ ] **Step 3:** Crear `ci.yml` y `vercel.json`. Comprobar con `git push` en una rama y `gh run watch`. Esperado: los dos jobs en verde.
- [ ] **Step 4: Desplegar.** Seguir la skill `vercel:deploy`: vincular el proyecto con raíz `web/`, activar Web Analytics y hacer un despliegue *preview*. **Pedir confirmación al usuario antes del despliegue a producción** y antes de sustituir `DONATE_URL` por su URL real de Buy Me a Coffee.
- [ ] **Step 5:** `git commit -m "ci: e2e suite, github actions and vercel config"`

---

## Después de esta tarea

- Repetir las Tasks 2, 8 y 9 por cada patrón restante del lanzamiento (Singleton, Proxy, Template Method, Observer, Decorator, Chain of Responsibility y Factory Method), cada una con su propio plan corto.
- Si el motor necesita una primitiva nueva (por ejemplo, la "cadena" de filtros para Chain of Responsibility), se escribe un ADR en `docs/adr/` con un diagrama UML antes de implementarla.
