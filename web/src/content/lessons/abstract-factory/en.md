---
title: Abstract Factory
summary: Fran isn't the same for Rx, Scaled or Teens. The load, the pull-up variant and the board tag must always match. Ask a single factory per division for all three pieces and they'll never get mixed up.
minutes: 10
level: intermediate
recap:
  intent: Offer a way to create several pieces that belong together without saying which class each one is, so whoever uses them always gets a consistent family.
  participants:
    - AbstractFactory (DivisionKit), the interface with one method per piece of the family
    - ConcreteFactory (RxKit, ScaledKit, TeensKit), one per family
    - AbstractProduct (Scorecard), a piece with one implementation per family that scores differently; Barbell and PullVariant are data pieces
    - Client (FranPlanner), which puts the WOD together with whatever factory it's given
  pros:
    - Pieces from one family never get mixed with another's
    - The client knows no concrete division
    - A new family is one more class, without touching the client
  cons:
    - A new piece in the family means touching the interface and every factory
    - If only one piece varies, it's more structure than needed
    - There are more types to follow to understand where each thing comes from
  related:
    - Factory Method
    - Builder
    - Prototype
quiz:
  - q: What do you avoid by passing FranPlanner a whole DivisionKit instead of three separate parameters?
    options:
      - FranPlanner having to know each division's bean names
      - Having to validate the barbell loads in the controller
      - Pieces from different divisions reaching the planner
      - The planner not being testable without starting Spring
    answer: 2
    explain: All three pieces come from the same kit, so they're always from the same division. With three separate parameters, nothing would stop you passing an Rx bar with a Scaled card.
  - q: The box opens a Masters division. What do you add?
    options:
      - A MastersKit class with @Component("masters") implementing DivisionKit
      - One more if in FranPlanner for the Masters loads and tag
      - A mastersBarbell() method on the DivisionKit interface
      - A division parameter in every product's constructor
    answer: 0
    explain: WodService gets every DivisionKit in the context by bean name. A new factory shows up in the map by itself, and neither the planner nor the controller changes.
  - q: How does Abstract Factory differ from Factory Method?
    options:
      - Abstract Factory can only be written with interfaces and Factory Method only with classes
      - Factory Method creates whole families of pieces and Abstract Factory a single object
      - Factory Method always creates new objects and Abstract Factory reuses existing ones
      - Abstract Factory groups several creation methods; Factory Method is one, overridden
    answer: 3
    explain: An abstract factory is an object with several creation methods that belong together. Often each of those methods is, in turn, a factory method.
  - q: With Spring Boot and H2, what does connection.createStatement() return?
    options:
      - A generic Java Statement that works with any database
      - A Statement from the H2 driver, wrapped by the connection pool
      - Null, until the first query runs on that connection
      - A Spring object that translates the SQL to each database's dialect
    answer: 1
    explain: Each Connection makes statements from its own driver. The pool, HikariCP, puts them in a wrapper of its own, but underneath there's an H2 JdbcStatement, and isWrapperFor confirms it.
---
## @step:problem — Fran for each division
At the box, each athlete does Fran in their division. The board gives each one their own:

- **Rx**: thrusters at 43 kg, pull-ups, 10-minute cap.
- **Scaled**: 29 kg, jumping pull-ups, 12 minutes.
- **Teens**: 20 kg, ring rows, 12 minutes.

The first version, `IfElseFranPlanner`, decides each piece on its own: one `if` for the load, another for the pull-up and another for the tag.

> [!problem]
> The three pieces have to match, but each one decides the division separately.
@describe: The coach asks for Fran for rx; WodService calls IfElseFranPlanner, highlighted in red, with plan("rx").

## @step:smell — A mixed card
The load's `if` compares ignoring case and the tag's doesn't. All it takes is someone sending `"RX"`: the card comes out with **Rx loads and a Scaled tag**, and someone who did the full WOD shows up as scaled on the leaderboard. The `IfElseFranPlannerTest` test proves it.

And every new division (Masters, adaptive) is four more `if`s, in four places.

This particular bug could be fixed by normalising the text once, or with a `Division` enum. What Abstract Factory adds goes further: each family can bring **pieces with different behaviour**, and a new family doesn't touch the planner.

> [!warning]
> When several pieces must belong to the same family, deciding the family in each piece separately is asking for them to get mixed one day.
@describe: The diagram doesn't change: IfElseFranPlanner stays highlighted in red; with plan("RX") the card comes out with pieces from two divisions.

## @step:abstract-factory — One factory per family
Abstract Factory brings the creation of all the pieces into a single object. `DivisionKit` has one method per piece:

- `barbell()`, the bar's load;
- `pull()`, the pull-up variant;
- `scorecard()`, the tag and the time cap.

Whoever has a `DivisionKit` can ask it for the three pieces, and all three will be from the same division.

> [!key-idea]
> The division is decided **once**, when the factory is picked. After that there's nothing left to decide.
@describe: The DivisionKit interface appears, highlighted, with three factories implementing it: RxKit, ScaledKit and TeensKit.

## @step:families — Each factory, its family
`RxKit` makes the 43 kg bar, the pull-ups and the 10-minute "Rx" card. `ScaledKit` and `TeensKit` do the same with their values.

There isn't a single `if`: each class **is** a division and gathers all its pieces in one place.
@describe: RxKit, highlighted, makes its three pieces: Barbell 43 kg with barbell(), pull-ups with pull() and Rx · 10' with scorecard().

## @step:client — The planner doesn't know which division it is
`FranPlanner` is the **client**: it gets a `DivisionKit` and asks it for the three pieces. With them it writes the card.

It doesn't know whether it's writing Fran for Rx or for Teens, and it doesn't need to. Since the three pieces come from the same kit, the card is always consistent.

> [!key-idea]
> The client depends on the factory's interface and the pieces it hands out, never on a concrete family.
@describe: FranPlanner, highlighted, asks DivisionKit for barbell(), pull() and scorecard().

## @step:scoring — Each family scores its own way
The pieces aren't just data. `Scorecard` is an interface, and each family brings its own way of scoring:

- Rx and Scaled use `TimedScorecard`: if you finish, your score is your time ("3:05 Rx"); if you hit the cap, your reps ("CAP + 72 reps Rx").
- Teens uses `TeensScorecard`: it always counts reps inside the cap, so nobody rushes the barbell.

`FranPlanner` calls `kit.scorecard().score(...)` without knowing which one it got.

> [!key-idea]
> Abstract Factory pays off when families bring different classes or behaviour. If only a few numbers changed, an enum would do.
@describe: The scorecard, highlighted together with TeensKit, is used with scorecard().score(…): each family scores its own way.

## @step:spring-kits — The factories are beans
In Spring, each kit is a named `@Component`: `"rx"`, `"scaled"`, `"teens"`. `WodService` gets a `Map<String, DivisionKit>` with all of them, keyed by that name.

When a request comes in, it normalises the division (Rx if none is given), looks up its kit in the map and hands it to the planner. If it doesn't exist, it answers 400.

> [!spring]
> Injecting a `Map<String, Interface>` is the most direct way to pick a factory by key in Spring. To pick a single family for the whole application (by environment, say), `@Profile` or `@ConditionalOnProperty` work too.
@describe: The Spring context appears. WodService, highlighted together with the context, has every factory at hand; FranPlanner, DivisionKit and the three kits are inside.

## @step:request — Fran Scaled
`GET /api/wods/fran?division=scaled`:

1. `WodService` looks up the `"scaled"` kit.
2. `FranPlanner` asks it for the three pieces.
3. The card says "Fran · Scaled", "thrusters 29 kg" and "jumping pull-ups", with a 12-minute cap.

Without `division`, Rx is used. With a division that doesn't exist, the answer is 400 "unknown division".
@describe: GET /api/wods/fran?division=scaled travels from the coach to the controller, fran("scaled") to the service and plan(scaledKit) to FranPlanner, which asks DivisionKit for its pieces; FranPlanner and ScaledKit are highlighted.

## @step:spring-does-it — Spring already does it for you
In JDBC, `Connection` works as an abstract factory. Spring Boot gives you a `DataSource`, and every `Connection` that comes out of it makes the pieces of **its** database: `createStatement()`, `prepareStatement(...)` and `prepareCall(...)` return statements from the H2 driver.

Your code only sees the `java.sql` interfaces. Change the driver and the URL, and the whole family changes at once: you'll never get a PostgreSQL `Connection` with H2 statements. The connection pool (HikariCP) puts them in a wrapper of its own, but `isWrapperFor` confirms there are H2 statements underneath.

> [!spring]
> `JdbcTemplate` builds on this factory: it asks the `DataSource` for the connection and uses it to create the statements it needs.
@describe: DataSource, a bean in the Spring context, hands out an H2 Connection, highlighted, which makes its Statement, its PreparedStatement and its CallableStatement.

## @step:recap — Recap
You started with three `if`s that could disagree and ended up with:

- **An abstract factory**, `DivisionKit`, with one method per piece.
- **One concrete factory per family**, as a named bean.
- **A client**, `FranPlanner`, that puts the card together without knowing the division.
- **Families that don't mix**, because they're picked only once.

Don't mix it up with its neighbours: **Factory Method** creates *one* piece with a method a subclass overrides; **Abstract Factory** is an object that creates *several* that belong together. **Builder** puts *one* complex object together step by step, and **Prototype** creates pieces by copying a model.

And when you don't need it: if only one piece varies, a Strategy or a Factory Method is enough; and if the families only differ in data (a few numbers, a few names), an `enum` with those values is simpler.

> [!key-idea]
> When several pieces must always match, have the same object make them.
@describe: Final view: the coach, the controller, WodService, FranPlanner and DivisionKit with its three kits, all inside the Spring context.
