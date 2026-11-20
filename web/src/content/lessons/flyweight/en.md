---
title: Flyweight
summary: Thousands of logged sets, and nearly all of them repeat the same movements. Share a single object per movement and let each set keep only what's its own.
minutes: 9
level: intermediate
recap:
  intent: When a huge number of objects repeat the same data, split out what they have in common, share it in a few immutable objects, and keep outside what changes in each one.
  participants:
    - Flyweight (Movement), the shared (intrinsic) state; immutable
    - FlyweightFactory (MovementCatalog), creates each flyweight once and always hands back the same one
    - Client (SetLog, LoggedSet), keeps its own (extrinsic) state and passes it in when needed
  pros:
    - One object per movement, even with thousands of sets
    - Common data lives in one place, with no copies to maintain
    - Movements can be compared by identity
  cons:
    - It only pays off with many objects and lots of repeated state; otherwise it's complication for nothing
    - The flyweight must be immutable, or a change would show up in every set at once
    - The extrinsic state is passed on every call, and the code gets a bit more indirect
  related:
    - Singleton
    - Composite
    - State
quiz:
  - q: What is intrinsic state in this example?
    options:
      - The athlete's name on each set
      - The set's reps and kilos
      - The movement's standard and equipment
      - The set's position in the log
    answer: 2
    explain: Intrinsic is what every set of a movement shares, and it goes inside the flyweight. The athlete, reps and kilos belong to each set.
  - q: Why does Movement have to be immutable?
    options:
      - So equals() stays consistent
      - Because all its sets share it at once
      - So the map key never changes
      - So it can be serialized safely
    answer: 1
    explain: A flyweight is the same object for everyone using it. If one set could change its standard, it would change it for all the others.
  - q: What makes two squat sets share an object?
    options:
      - Java merges equal objects on its own
      - LoggedSet copies the previous set's movement
      - The Movement record overrides equals()
      - They both ask the same catalog for it
    answer: 3
    explain: computeIfAbsent creates the movement the first time and then returns the same instance. equals() returning true isn't enough; someone has to hand out the same object.
  - q: What should NOT go inside Movement?
    options:
      - The kilos each athlete lifted
      - The movement's category
      - The equipment it needs
      - The standard for how it's done
    answer: 0
    explain: The kilos change in every set, so they're extrinsic state. If they went inside Movement, it could no longer be shared.
---
## @step:problem — One copy per set
The box logs every set: who, which movement, how many reps and how many kilos. In a month that's thousands, and nearly all of them are squats, deadlifts or thrusters.

In the first version, each set carries the whole movement: name, category, the standard for how it's done (a long text) and the equipment. It's what happens with a denormalized query or a JSON import: every row brings its own texts. With 3,000 sets there are 3,000 copies of two texts; the `CopiedMovementLogTest` test counts them.

> [!problem]
> What's the same in every set is repeated in each one, and every copy holds its own characters in memory.
@describe: Three sets, each with its own copy of the movement, highlighted in red: two copies of the squat and one of the deadlift.

## @step:flyweight — What's shared
Flyweight splits the data in two. What's the same for every set of a movement (name, category, standard, equipment) goes in `Movement`: it's the **intrinsic state**, and the object is shared.

`Movement` is a `record` and its equipment list is copied with `List.copyOf`: it's **immutable**. It has to be, because thousands of sets use it at once.

> [!key-idea]
> What becomes light is each set: the heavy, common part is stored once.
@describe: The two shared movements appear, the squat and the deadlift, highlighted.

## @step:extrinsic — What belongs to each set
What changes in each set (the athlete, the reps, the kilos) is the **extrinsic state**. It doesn't go inside the movement: `LoggedSet` keeps it and passes it to `line()` when needed.

Ana and Leo squat and share **the same** `Movement` object; each has their own line: "Ana · 5 × back squat @ 100 kg", "Leo · 3 × back squat @ 120 kg".
@describe: Ana's and Leo's sets point to the same squat, highlighted, and pass it their reps and kilos with line().

## @step:factory — One per name
`MovementCatalog` is the **flyweight factory**. `get("Back Squat")` normalises the name and uses `computeIfAbsent`: the first time it reads the data and builds the `Movement`; after that it returns the same object. It's thread-safe because it's a `ConcurrentHashMap`.

A movement that doesn't exist answers 404 "unknown movement".

> [!key-idea]
> Two objects being `equals` saves nothing. The saving comes from someone always handing out the same instance.
@describe: MovementCatalog, highlighted, creates the squat and the deadlift just once with computeIfAbsent.

## @step:client — The client asks, it doesn't create
`SetLog` doesn't do `new Movement(...)`: it asks the catalog for the movement and creates a `LoggedSet` with the shared part and its own. As long as everyone goes through the catalog, no set ends up with its own copy (the type doesn't enforce it: anyone could `new Movement(...)`).
@describe: SetLog, highlighted, asks the catalog for get("deadlift") and creates Eva's set with the shared movement.

## @step:share — 3,000 sets, 2 movements
The test logs 3,000 sets alternating squat and deadlift. At the end, the catalog has created **two** `Movement` objects. All 3,000 sets point to those two.

Each set is still a small object (athlete, reps, kilos and one reference); what disappears is the copied movement. How much you save depends on how big that common part is and how often it repeats: here, a standard of about 100 characters per set.

(In the book, sometimes there isn't even an object per element: the extrinsic state is computed from the structure, like a letter's position in a document.)
@describe: The squat, the deadlift and the catalog, highlighted: every set points to just two movements.

## @step:request — Over HTTP
Ana, Leo and Eva log a deadlift with `POST /api/sets` (it answers 201 with their line). `GET /api/sets/stats` says there are 3 sets and the catalog has built **1** movement. The scene shows Eva's set.

An unknown movement answers 404; reps out of range, 400; and if the demo log fills up (10,000 sets), 409.
@describe: POST /api/sets travels from the athlete to the controller and to SetLog, which asks the catalog for the deadlift; Eva's set points to the shared movement, highlighted along with SetLog.

## @step:spring-does-it — Java and Spring already do it for you
`Integer.valueOf(100)` always returns the same object: the JDK caches the integers from -128 to 127, the most used ones. With 1000, by default, it creates a new one (not guaranteed: the cache can be widened). That's why comparing `Integer` with `==` is a bad idea.

Spring does the same with MIME types: `MimeTypeUtils.parseMimeType("application/json")` keeps recently parsed types in a small LRU cache (`multipart` ones excluded) and returns the same instance. A web app asks for it thousands of times.

> [!spring]
> These are the "sharing" half of Flyweight: an immutable value handed out from a pool by key. With no extrinsic state to split off, it's plain caching or interning; Flyweight adds the split.
@describe: Integer.valueOf(100) and MimeTypeUtils.parseMimeType always get the same cached instance, highlighted.

## @step:recap — Recap
You started with a copy of the movement in every set and ended up with:

- **A flyweight**, `Movement`, immutable, with what every set shares.
- **A factory**, `MovementCatalog`, that creates each one once and hands it out.
- **Extrinsic state** in each `LoggedSet`: athlete, reps and kilos.

Its neighbours: a **Singleton** is one instance of a class; with Flyweight there's one per key (one per movement). In a **Composite**, repeated leaves can be flyweights, and **State** and **Strategy** objects often are. **Prototype** does the opposite: it copies an object so each one has its own. And `String.intern()` or the JVM's string deduplication are close relatives: they share equal values, but without splitting state.

When not to use it: with few objects, or little repeated state, the saving isn't worth it. And if the shared data has to change per set, it isn't intrinsic: the flyweight doesn't fit. Measure before you optimise.

> [!key-idea]
> What repeats, share once; what changes, let each one carry.
@describe: Final view: the athletes, the controller, SetLog, the three sets pointing to two movements and the catalog, all inside the Spring context.
