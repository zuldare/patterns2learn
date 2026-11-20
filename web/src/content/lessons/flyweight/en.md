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
    - Prototype
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
      - Because Java records can't have methods
      - Because thousands of sets share it and a change would reach all of them
      - Because ConcurrentHashMap only accepts immutable values
      - Because Spring doesn't inject objects that can be modified
    answer: 1
    explain: A flyweight is the same object for everyone using it. If one set could change its standard, it would change it for all the others.
  - q: What makes two squat sets share the same object?
    options:
      - MovementCatalog creates it once and then always hands back that one
      - Java detects equal objects and merges them on its own
      - LoggedSet copies the movement from the previous set
      - The Movement record overrides equals() and hashCode()
    answer: 0
    explain: computeIfAbsent creates the movement the first time and then returns the same instance. Equal equals() isn't enough; someone has to hand out the same object.
  - q: Why is Integer.valueOf(100) == Integer.valueOf(100) true but not with 1000?
    options:
      - Because 100 fits in a byte and Java keeps it on the stack
      - Because the compiler replaces 100 with a constant
      - Because Integer caches the values from -128 to 127
      - Because == compares the value when the number is small
    answer: 2
    explain: valueOf returns shared objects for small values, the most used ones. It's a flyweight in the JDK itself; with 1000 it creates a new object (unless the cache is widened with -XX:AutoBoxCacheMax).
---
## @step:problem — One copy per set
The box logs every set: who, which movement, how many reps and how many kilos. In a month that's thousands, and nearly all of them are squats, deadlifts or thrusters.

In the first version, each set carries the whole movement: name, category, the standard for how it's done (a long text) and the equipment. It's what happens when every row of a query becomes brand-new objects. With 3,000 sets there are 3,000 copies of two texts; the `CopiedMovementLogTest` test counts them.

> [!problem]
> What's the same in every set is repeated in each one, and every copy takes up its own memory.
@describe: Three sets, each with its own copy of the movement, highlighted in red: two copies of the squat and one of the deadlift.

## @step:flyweight — What's shared
Flyweight splits the data in two. What's the same for every set of a movement (name, category, standard, equipment) goes in `Movement`: it's the **intrinsic state**, and the object is shared.

`Movement` is a `record` and its equipment list is copied with `List.copyOf`: it's **immutable**. It has to be, because thousands of sets use it at once.

> [!key-idea]
> A flyweight is small in number, not in size: there's one per movement, however many sets use it.
@describe: The two shared movements appear, the squat and the deadlift, highlighted.

## @step:extrinsic — What belongs to each set
What changes in each set (the athlete, the reps, the kilos) is the **extrinsic state**. It doesn't go inside the movement: `LoggedSet` keeps it and passes it to `line()` when needed.

Ana and Leo squat and share **the same** `Movement` object; each has their own line: "Ana · 5 × back squat @ 100 kg", "Leo · 3 × back squat @ 120 kg".
@describe: Ana's and Leo's sets point to the same squat, highlighted, and pass it their reps and kilos with line().

## @step:factory — One per name
`MovementCatalog` is the **flyweight factory**. `get("Back Squat")` normalises the name and uses `computeIfAbsent`: the first time it loads the movement and keeps it; after that it returns the same object. It's thread-safe because it's a `ConcurrentHashMap`.

A movement that doesn't exist answers 404 "unknown movement".

> [!key-idea]
> Two objects being `equals` saves nothing. The saving comes from someone always handing out the same instance.
@describe: MovementCatalog, highlighted, creates the squat and the deadlift just once with computeIfAbsent.

## @step:client — The client asks, it doesn't create
`SetLog` doesn't do `new Movement(...)`: it asks the catalog for the movement and creates a `LoggedSet` with the shared part and its own. That way no set can end up with its own copy.
@describe: SetLog, highlighted, asks the catalog for get("deadlift") and creates Eva's set with the shared movement.

## @step:share — 3,000 sets, 2 movements
The test logs 3,000 sets alternating squat and deadlift. At the end, the catalog has created **two** `Movement` objects. All 3,000 sets point to those two.

How much you save depends on how big the shared state is and how often it repeats: here, a standard of about 100 characters per set.
@describe: The squat, the deadlift and the catalog, highlighted: every set points to just two movements.

## @step:request — Over HTTP
Ana, Leo and Eva log a deadlift with `POST /api/sets` (it answers 201 with their line). `GET /api/sets/stats` says there are 3 sets and **1** movement object.

An unknown movement answers 404; reps out of range, 400.
@describe: POST /api/sets travels from the athlete to the controller and to SetLog, which asks the catalog for the deadlift; the set points to the shared movement, highlighted along with SetLog.

## @step:spring-does-it — Java and Spring already do it for you
`Integer.valueOf(100)` always returns the same object: the JDK caches the integers from -128 to 127, the most used ones. With 1000 it creates a new one. It's a textbook flyweight (and the reason comparing `Integer` with `==` is a bad idea).

Spring does the same with MIME types: `MimeTypeUtils.parseMimeType("application/json")` parses the text once, keeps it in a cache and then returns the same instance. A web app asks for it thousands of times.

> [!spring]
> When an immutable object is requested many times with the same data, caching it by its key is a flyweight. Spring does it with MIME types; you can do it with your catalogs.
@describe: Integer.valueOf(100) and MimeTypeUtils.parseMimeType always get the same cached instance, highlighted.

## @step:recap — Recap
You started with a copy of the movement in every set and ended up with:

- **A flyweight**, `Movement`, immutable, with what every set shares.
- **A factory**, `MovementCatalog`, that creates each one once and hands it out.
- **Extrinsic state** in each `LoggedSet`: athlete, reps and kilos.

Its neighbours: a **Singleton** is one instance of a class; with Flyweight there's one per key (one per movement). In a **Composite**, repeated leaves can be flyweights. And **Prototype** does the opposite: it copies an object so each one has its own.

When not to use it: with few objects, or little repeated state, the saving isn't worth it. And if the shared data has to change per set, it isn't intrinsic: the flyweight doesn't fit. Measure before you optimise.

> [!key-idea]
> What repeats, share once; what changes, let each one carry.
@describe: Final view: the athletes, the controller, SetLog, the three sets pointing to two movements and the catalog, all inside the Spring context.
