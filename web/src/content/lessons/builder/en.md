---
title: Builder
summary: A box class has a name, a time, a length, spots, a coach and a few options. Build it step by step with clear names and get, at the end, an immutable object that is always valid.
minutes: 10
level: beginner
recap:
  intent: Separate the construction of a complex object from its representation, so it can be put together step by step and the same process can produce different results.
  participants:
    - Builder (ClassSession.Builder), which collects the pieces step by step
    - Product (ClassSession), the finished object, immutable and valid
    - Director (SessionTemplates), which knows the usual recipes and calls the steps in order
    - Client (ScheduleService), which asks for the object without knowing how it's put together
  pros:
    - Every option has a name, so the call reads on its own
    - Defaults live in one place and you only change what you need
    - The object doesn't exist until build(), and build() validates all of it at once
  cons:
    - More code, one extra class per product
    - If the object has two or three fields, a constructor is enough
    - A forgotten required field only shows up when you call build(), not at compile time (unless you ask for it when creating the builder)
  related:
    - Abstract Factory
    - Composite
    - Factory Method
quiz:
  - q: What's the real problem with new TelescopingSession("Hyrox prep", LocalTime.of(18, 0), 60, 12, "Ana", true, false)?
    options:
      - It's slower than a builder
      - You can swap true and false (or 60 and 12) and it still compiles, but you've created a different class
      - Records don't allow constructors with that many parameters
      - Spring can't inject objects created with new
    answer: 1
    explain: Consecutive parameters of the same type don't say what they mean. The compiler doesn't complain if you swap them, and nobody notices until the class is full of beginners.
  - q: Where do rules like "capacity between 1 and 30" or "a beginner class needs a coach" live?
    options:
      - In each builder method, separately
      - In the controller, before calling the service
      - In the record's compact constructor, which build() calls, so nobody can skip them
      - In SessionTemplates
    answer: 2
    explain: build() calls the record's constructor, and that constructor validates. The rules sit in one place and also apply if someone creates a ClassSession without the builder.
  - q: You inject RestClient.Builder into two services and one sets a baseUrl. Does it affect the other?
    options:
      - No. Spring Boot declares it with prototype scope, so each injection point gets its own builder, already configured
      - Yes, because every bean is a singleton
      - Only if the bean is marked @Primary
      - Spring Boot doesn't provide a RestClient.Builder, you have to create it with new
    answer: 0
    explain: It's a ready-made builder (message converters, customizers), fresh for each one. You finish it your way and call build() without stepping on anyone.
  - q: What role does SessionTemplates play in the example?
    options:
      - It's the product
      - It's the builder
      - It's the client that receives the HTTP request
      - It's the director, which knows recipes like "beginner" or "open-gym" and calls the builder's steps in order
    answer: 3
    explain: The director doesn't know how each field is stored, only which steps each kind of class needs. If the box changes a recipe, the director changes and the builder stays the same.
---
## @step:problem — Seven arguments in a row
The coach schedules a new class: Hyrox prep at 18:00, 60 minutes, 12 spots, with Ana, beginner-friendly and no waitlist.

The first version uses a **telescoping constructor**: one with two parameters, which calls one with three, which calls one with four… up to the one that has them all. And the call ends up like this: `new TelescopingSession("Hyrox prep", LocalTime.of(18, 0), 60, 12, "Ana", true, false)`.

> [!problem]
> Which is `60` and which is `12`? Which `true` means "beginners" and which "waitlist"? Swap them and it still compiles.
@describe: The coach sends the class to SessionController, which calls new TelescopingSession with seven arguments, highlighted in red.

## @step:smell — The setters alternative
The other usual option is an empty object you fill in: `new MutableSession()` and then `setName(...)`, `setStartsAt(...)`, `setCoach(...)`…

It reads better, but the object **exists before it's finished**. Between one line and the next it has no start time, and if you forget a line, nobody notices. And `setCapacity(0)` is accepted without a word, and anyone can change it later.

> [!warning]
> An object that can be half-built or in an impossible state forces every place that uses it to check.
@describe: SessionController calls MutableSession and feeds it setName, setCoach and the rest, highlighted in red.

## @step:builder — An object that builds the object
Builder puts someone in between: `ClassSession.Builder`.

- You create it with the **essentials**: `ClassSession.builder("Hyrox prep", LocalTime.of(18, 0))`.
- The rest are named methods (`minutes()`, `capacity()`, `coach()`…) that store the value and return the builder itself so you can keep chaining.
- The defaults (60 minutes, 12 spots) live in the builder.
- `build()` hands over the finished `ClassSession`, an **immutable** record.

> [!key-idea]
> The product doesn't exist until `build()`. Until then, what's half-done is the builder, not the class.
@describe: ClassSession.Builder appears, highlighted, and hands over a ClassSession with build().

## @step:fluent — The call reads on its own
Compare it with the start: `ClassSession.builder("Hyrox prep", LocalTime.of(18, 0))`, then `.coach("Ana")`, `.beginnerFriendly()` and, to finish, `.build()`.

Every option says what it is, you don't write the defaults, and the order of the calls doesn't matter. `beginnerFriendly()` doesn't take a `true` you could mix up with another one: calling it is the decision.

> [!key-idea]
> Java has no named arguments. A builder is the usual way to get them.
@describe: ScheduleService sends coach Ana and beginnerFriendly to the builder, and the builder hands over the ClassSession with build(); both are highlighted.

## @step:validate — Valid or it doesn't exist
What if someone asks for `capacity(0)` or a beginner class with no coach? `build()` calls the record's constructor, and that constructor **checks every rule at once**: 15 to 120 minutes in steps of 15, between 1 and 30 spots, a coach required for beginners.

If something fails, it throws an exception with the reason and nothing gets created. Since the rules live in the constructor and not in the builder, they also apply to anyone who calls `new ClassSession(...)` directly.

> [!warning]
> Validate in `build()` (or in the constructor it calls), not in every builder method. Some rules cross fields, like "beginners need a coach", and can only be checked with the whole set.
@describe: The builder tries to hand over a ClassSession with capacity 0, and ClassSession, highlighted, rejects it.

## @step:director — House recipes
The box always repeats the same classes. `SessionTemplates` is the pattern's **director**: it knows the recipes and calls the builder's steps in order.

- `"beginner"`: 75 minutes, 8 spots, a coach, beginner-friendly and with a waitlist.
- `"open-gym"`: 120 minutes, 20 spots and no coach.

In classic GoF, the director works against a builder **interface** and can drive several concrete builders with the same recipe: one that assembles the class and another that produces, say, the whiteboard poster. In Java, the most common form is what you see here, a fluent builder inside the class (the *Effective Java* style), with or without a director.
@describe: SessionTemplates, highlighted, sends "beginner" to the builder, which hands over the ClassSession with build().

## @step:request — Hyrox prep in the app
The coach sends `POST /api/sessions` with a name, a time, a coach and "beginner-friendly", but no length or spots.

1. `SessionController` passes the request to `ScheduleService`.
2. The service creates the builder with the essentials and only calls the methods for the fields present in the request.
3. `build()` validates, and the service saves the class with 60 minutes and 12 spots, the defaults.

> [!spring]
> With optional fields in a request, the builder fits naturally: what doesn't arrive isn't touched and keeps its default, with no chain of `if`s to decide which constructor to call.
@describe: Hyrox prep · 18:00 travels from the coach to the controller, schedule() to ScheduleService and on to the builder, both highlighted, which hands over the ClassSession with build().

## @step:spring-does-it — Spring already does it for you
Spring is full of builders. The most useful one day to day is `RestClient.Builder`: Spring Boot **injects it already configured** (message converters, customizers) and with prototype scope, so every injection point gets a new one. You add your `baseUrl` and headers, call `build()` and you have your client.

There are more in the example itself: the controller builds the `Location` header with `ServletUriComponentsBuilder` and answers with `ResponseEntity.created(location).body(...)`, which is a builder too. And in the tests, `MockMvcRequestBuilders`.

> [!spring]
> If you use Lombok, `@Builder` generates this same code. Writing it by hand once helps you know what it does, and where to put the validation.
@describe: Inside the Spring context, RestClient.Builder, highlighted, takes baseUrl and defaultHeader and hands over a RestClient with build().

## @step:recap — Recap
You started with seven arguments in a row and ended up with:

- **A builder** created with the essentials, holding the defaults.
- **Named methods** for every option, chainable.
- **`build()`**, which hands over an immutable object validated all at once.
- **An optional director** for the recipes you repeat.

> [!key-idea]
> When an object has many options, let it be built step by step with names, and let it exist only once it's complete.
@describe: Final view: the coach, the controller, ScheduleService, SessionTemplates, the builder and the ClassSession, all inside the Spring context.
