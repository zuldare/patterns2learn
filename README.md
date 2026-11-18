# patterns2learn

Learn design patterns by example: a runnable Java 25 / Spring Boot 4 examples repo plus an Astro website that explains each pattern.

## Layout

- `examples/` - Maven multi-module project, one module per pattern (`examples/<category>/<pattern>`).
- `web/` - Astro site (added in later stages).

## Getting started

Toolchain (Java 25, Node 26, pnpm) is managed with [mise](https://mise.jdx.dev):

```bash
mise install
```

### examples

```bash
cd examples
./mvnw verify                                   # build and test everything
./mvnw -pl behavioral/strategy spring-boot:run  # run the Strategy demo
```

### web

```bash
cd web
pnpm install
pnpm dev
```

## License

MIT
