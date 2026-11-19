---
title: Singleton
summary: One WOD catalog for the whole app. See where the textbook Singleton falls short and how Spring gives you one without writing a line of the pattern.
minutes: 10
level: beginner
recap:
  intent: Make sure a class has exactly one instance, and that everyone who needs it uses that same one through a well-known access point.
  participants:
    - Singleton (WodCatalog), the class that should only exist once
    - Access point, getInstance() in the GoF version and bean injection in Spring
    - Clients (WodController, BookingService), which use the shared instance without creating it
  pros:
    - One source of truth, because everybody sees the same data
    - The expensive work (loading the catalog) happens once
    - With Spring you write none of the pattern, and you can still swap the bean in tests
  cons:
    - Shared state is used by many threads at once, so it has to be safe
    - In its classic form it's a global in disguise, coupling code and polluting tests
    - Easy to abuse by putting per-request state in a singleton
  related:
    - Factory Method
    - Facade
    - Flyweight
quiz:
  - q: With no scope annotation, how many WodCatalog instances does Spring create?
    options:
      - One per class that injects it
      - One for the whole container, shared by everyone
      - One per HTTP request
      - None until someone calls getInstance()
    answer: 1
    explain: A bean's default scope is singleton, meaning one instance per container. Everyone who injects it gets that same object.
  - q: What is the main problem with the classic getInstance() Singleton?
    options:
      - It doesn't work with multiple threads
      - It's slower than creating objects with new
      - Java doesn't allow private constructors
      - It's hidden global state, hard to replace in tests and carrying changes from one test to the next
    answer: 3
    explain: Any class can call getInstance() without declaring it in its constructor. The dependency is hidden, you can't pass a test double, and whatever state one test leaves behind, the next one sees.
  - q: Two coaches add WODs to the same WodCatalog at the same time. What makes that safe?
    options:
      - A ConcurrentHashMap with putIfAbsent, which checks and inserts in one atomic step
      - Spring creating one WodCatalog per thread
      - Annotating the class with @Component
      - Nothing, singleton beans are never used from several threads
    answer: 0
    explain: Spring doesn't make your bean safe, it only shares it. Since every request uses the same instance, mutable state must be protected; here the concurrent map does it.
  - q: When would you use @Scope("prototype") instead of the default singleton?
    options:
      - Whenever the bean has a field
      - To make the bean start faster
      - When each use needs its own state, like each class's stopwatch
      - Never, prototype is deprecated
    answer: 2
    explain: With prototype, Spring creates a new object every time you ask for one. It suits short-lived objects with their own state, like one WodTimer per class. Shared things, like the catalog, stay singleton.
---
## @step:problem — Everyone gets their own catalog
The box app has a catalog of WODs: Fran, Cindy and whatever the coach adds. Two parts of the app use it. `WodController` lists them and lets the coach add new ones, and `BookingService` checks a WOD exists before booking a spot.

The naive version: each of them does `new NaiveWodCatalog()` in its own field.

> [!problem]
> There are **two** catalogs. Every `new` loads the data again (picture a big file or a database query) and each copy lives its own life.
@describe: The coach talks to WodController and the athlete to BookingService. Each has its own copy of WodCatalog next to it, both highlighted.

## @step:smell — Where did Murph go?
The coach adds **Murph** for Memorial Day. `WodController` stores it in *its* catalog and the list shows it.

An athlete tries to book Murph and `BookingService` says it doesn't exist. That makes sense, because it's looking at the other copy.

> [!warning]
> Two copies of something that should be unique drift apart. The example test proves it: Murph is in the list, but `canBook("Murph")` returns `false`.
@describe: A packet labelled Murph travels from the coach to WodController and on to catalog copy number 1. Copy number 2, next to BookingService, is highlighted because it never hears about it.

## @step:classic — The textbook Singleton
The classic GoF recipe: make the class itself prevent a second instance.

- A **private** constructor, so nobody can call `new`.
- A **static** instance kept in the class. Here it lives in a nested `Holder` class, which the JVM initialises on first use, safely across threads.
- A `getInstance()` method that always returns that instance.

Now the controller and the service both call `ClassicWodCatalog.getInstance()` and see the same thing. Murph can be booked.

> [!key-idea]
> The two-copies problem is gone because only one instance exists and everyone reaches it through the same access point.
@describe: The two copies disappear. ClassicWodCatalog stands in the middle, highlighted, and both WodController and BookingService call it.

## @step:classic-cons — The price of a global
It works, but you've created a global variable under another name:

- **Hidden dependency.** `BookingService`'s constructor doesn't say it needs the catalog; you only find out by reading the code.
- **Tests that leak into each other.** State survives between tests. If one adds "Grace", the next one finds it there.
- **Impossible to replace.** You can't hand a fake catalog to a test without reflection tricks.

> [!warning]
> The classic Singleton mixes two jobs: what the class does (managing WODs) and how many instances of it exist. The second one shouldn't be its business.
@describe: The diagram doesn't change. ClassicWodCatalog stays highlighted, styled as problem code, while both clients depend on it.

## @step:spring-bean — Let the container handle it
In Spring, the **container** decides how many instances exist, not the class. `WodCatalog` is a plain class with a public constructor and a `@Component` annotation.

Spring creates it **once** at startup and passes it through the constructor to whoever asks: `WodController(WodCatalog catalog)` and `BookingService(WodCatalog catalog)`.

> [!spring]
> A bean's default scope is `singleton`: one instance per container. You get the pattern's guarantee with no private constructor, no `getInstance()` and no static state.
@describe: The Spring context platform appears. WodCatalog sits in the middle, highlighted together with the context, and WodController and BookingService are connected to it with injection links.

## @step:shared — One source of truth
Let's replay the Murph story:

1. The coach sends `POST /api/wods` with Murph and `WodController` adds it to the catalog.
2. An athlete sends `POST /api/bookings?wod=Murph` and `BookingService` looks it up in the **same** catalog.
3. The booking is created with a 201.

The testing problem is fixed too. Because the dependency comes in through the constructor, a unit test just does `new BookingService(testCatalog)`.

> [!key-idea]
> Shared doesn't mean global: there's one catalog, but every class states explicitly that it needs it.
@describe: The coach sends POST Murph to WodController, which adds it to the catalog; BookingService sends find Murph to the same WodCatalog, highlighted in the middle.

## @step:threads — Careful: shared across threads
A singleton bean is used by **every** request at once, each on its own thread. While a coach adds Murph, a hundred athletes may be looking up Fran.

That's why the catalog keeps WODs in a `ConcurrentHashMap` and uses `putIfAbsent`, which checks whether the name exists and inserts it in one atomic step. If the WOD already exists, the API answers 409 and the old one is left untouched.

> [!warning]
> Spring shares your bean, but it doesn't make it safe. Rule of thumb: a singleton should be stateless, or hold immutable or protected state. Never keep "the current request's athlete" in a field.
@describe: Two packets reach WodCatalog at the same time, add Murph from WodController and find Fran from BookingService. The catalog is highlighted.

## @step:spring-does-it — Spring already does it for you
You've been using singletons since your first `@Service`. All your controllers, services and repositories are singleton beans, which is why a context with hundreds of beans starts once and never recreates them on each request.

When you need the opposite, you ask for it: `@Scope("prototype")` creates a **new** object every time. The example's `WodTimer` works like that, because each class needs its own stopwatch.

> [!spring]
> The example test checks it: two `getBean(WodCatalog.class)` calls return the same object and two `getBean(WodTimer.class)` calls return different ones. There are more scopes (`request`, `session`), but the one you'll use 95% of the time is the default singleton.
@describe: Inside the Spring context there is the single WodCatalog and two different WodTimers, highlighted, one for each class.

## @step:recap — Recap
You started with two out-of-sync catalogs, tried the textbook Singleton and ended up letting Spring manage the instance:

- **One instance**, created by the container and shared through injection.
- **Visible dependencies** in the constructor, easy to replace in tests.
- **Thread-safe state**, because shared means concurrent.
- **`prototype`** when each use needs its own copy.

> [!key-idea]
> In Spring you almost never write a Singleton: you declare a bean and the container makes sure it's unique.
@describe: Final view: the coach and the athlete, WodController and BookingService inside the Spring context, both injecting the same WodCatalog.
