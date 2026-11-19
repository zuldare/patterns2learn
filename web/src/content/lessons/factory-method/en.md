---
title: Factory Method
summary: AMRAP, EMOM and For Time are described and scored differently. Let each planner decide which kind of WOD to build, and keep the rest of the code unaware of which class comes out.
minutes: 11
level: intermediate
recap:
  intent: Define a method for creating an object, but let subclasses decide which concrete class to instantiate.
  participants:
    - Product (Workout), the interface of what gets created
    - ConcreteProduct (Amrap, Emom, ForTime), each WOD format
    - Creator (WodPlanner), with the template method plan() that uses the factory method createWorkout()
    - ConcreteCreator (AmrapPlanner, EmomPlanner, ForTimePlanner), which decide which product to build
  pros:
    - The code that uses the product doesn't know the concrete classes
    - A new format is a new product and a new creator; nothing else changes
    - The knowledge of how to build each type lives with whoever owns it
  cons:
    - A creator hierarchy parallel to the product one, which can feel like a lot for simple cases
    - If creating is trivial, a constructor or a static method is enough
    - It relies on inheritance, so the concrete creator is tied to the base class
  related:
    - Abstract Factory
    - Template Method
    - Strategy
quiz:
  - q: In WodPlanner, which one exactly is the "factory method"?
    options:
      - plan(), because it's public
      - WodPlanner's constructor
      - createWorkout(), the abstract method each subclass implements to decide which Workout to build
      - format(), because it returns the type's name
    answer: 2
    explain: plan() is the shared algorithm and calls createWorkout() without knowing which class will come out. Each concrete creator implements it with its new Amrap(...), new Emom(...) or new ForTime(...).
  - q: You want to add the Tabata format. What do you change?
    options:
      - A Tabata product and a TabataPlanner with @Component; WodService and the controller don't change
      - Both switches in SwitchingWodService
      - WodPlanner, to add one more case
      - The controller, so it knows about the new format
    answer: 0
    explain: WodService gets every WodPlanner in the context and indexes them by format. A new creator with its product is all it takes.
  - q: With a FactoryBean registered as "dailyWod", what does context.getBean("dailyWod") return?
    options:
      - The FactoryBean itself
      - An exception, because FactoryBeans can't be requested by name
      - Always null until you call getObject() yourself
      - The object it makes (what getObject() returns); for the FactoryBean itself you ask for "&dailyWod"
    answer: 3
    explain: Spring treats FactoryBeans specially. The bean name gives you the product, and the & prefix gives you the factory. Many integrations that build complex objects work this way.
  - q: How are Factory Method and Template Method related in this example?
    options:
      - Not at all, they're incompatible patterns
      - plan() is a Template Method and one of its steps, createWorkout(), is the Factory Method
      - Factory Method is an older version of Template Method
      - Template Method creates objects and Factory Method uses them
    answer: 1
    explain: It's a very common combination. The base class fixes the algorithm (Template Method) and one of its steps is precisely "create the right object" (Factory Method).
---
## @step:problem — A service that knows every format
The coach programs the week's WODs in the app. There are three formats, each described and scored differently:

- **AMRAP**: as many rounds as possible in a set time; scored in rounds and reps.
- **EMOM**: every minute you start again; scored in completed minutes.
- **For Time**: finish the work as fast as you can, within a time cap; scored in seconds, and lower is better (if you hit the cap, your completed reps count instead).

`SwitchingWodService` handles it with a `switch` on the format to build the description.

> [!problem]
> The service knows every format and what each one looks like inside.
@describe: The coach sends AMRAP 20' to WodController, which calls SwitchingWodService, highlighted in red: a single service that builds each format's text by hand.

## @step:smell — The same switch, twice
Look further down: there's **another** `switch` on the format for the scoring unit, and a stray `format.equals("for-time")` check to know whether lower is better.

Adding Tabata means touching both `switch`es and that check, and remembering all of them. Each format is scattered across the service instead of living in one place.

> [!warning]
> A `switch` on a type that shows up in several places is usually begging for one object per type.
@describe: The diagram doesn't change: SwitchingWodService stays highlighted in red, with one switch for everything that depends on the format.

## @step:factory-method — The creator doesn't know what it creates
Factory Method separates **using** an object from **deciding which class** it is:

- `Workout` is the product: it describes the WOD and says how it's scored.
- `WodPlanner` is the creator. Its `plan()` method builds the whiteboard plan, but to get the `Workout` it calls `createWorkout()`, an **abstract** method.

`plan()` works the same for any format. The question "which kind of Workout?" is left to the subclasses.

> [!key-idea]
> The factory method is a gap in the algorithm that says "an object goes here, let the subclass decide which one".
@describe: The abstract WodPlanner appears, highlighted, with three planners implementing it.

## @step:creators — One creator per format
Each format has its creator:

- `AmrapPlanner` returns a `new Amrap(...)`.
- `EmomPlanner` returns a `new Emom(...)`.
- `ForTimePlanner` returns a `new ForTime(...)`.

And each product knows how to describe and score itself. There's no `switch` left: the decision is spread over small classes, each knowing its own part.

> [!key-idea]
> Adding Tabata means a new product and a new creator. `WodPlanner` isn't touched.
@describe: The three planners, highlighted, each build their product: new Amrap(), new Emom() and new ForTime().

## @step:spring-planners — Creators are beans
Each planner is a `@Component`. `WodService` gets **every** `WodPlanner` in the context and keeps them in a map by format (`amrap`, `emom`, `for-time`).

When a request comes in, it looks up that format's planner and asks it for the plan. If the format doesn't exist, it answers 400.

> [!spring]
> This mixes two patterns you already know: picking the creator by key is a Strategy (as in that lesson), and each creator applies Factory Method to build its product.
@describe: The Spring context appears. WodService, highlighted together with the context, is wired to the three planners, which implement WodPlanner and build their products.

## @step:request — Cindy, a 20-minute AMRAP
The coach programs Cindy: `POST /api/wods/plan` with format `amrap`, 20 minutes and three movements.

1. `WodService` looks up the `amrap` planner.
2. `AmrapPlanner.plan()` calls its `createWorkout()`, which builds an `Amrap`.
3. The whiteboard gets "AMRAP 20': 5 pull-ups, 10 push-ups, 15 air squats", scored in rounds and reps.

The example test makes that same request by calling `WodService` directly.

> [!key-idea]
> Neither the service nor the controller ever wrote `new Amrap(...)`. Only its creator knows.
@describe: Cindy · AMRAP 20' travels from the coach to the controller, plan() to WodService and on to AmrapPlanner, highlighted, which builds an Amrap, also highlighted.

## @step:for-time — Each creator knows its own part
In For Time, the request's minutes aren't the duration but the **time cap**: Fran with an 8-minute cap. Only `ForTimePlanner` knows to read it that way, and it creates a `ForTime` where less time is better.

That knowledge lives in the format's creator, not in `if`s scattered across the service.

> [!warning]
> If creating an object is just a `new` with no decisions, Factory Method is overkill. Use it when the concrete class or its setup depends on something only one part of the code knows.
@describe: WodService sends plan() to ForTimePlanner, highlighted, which builds a ForTime, also highlighted.

## @step:spring-does-it — Spring already does it for you
In a broad sense, Spring is full of "methods that create": `BeanFactory.getBean(...)` hands you objects without a `new`, and Spring's documentation calls every `@Bean` method a *factory method*. But they aren't the GoF pattern, because there's no subclass deciding which class to create.

The closest match to the pattern is `FactoryBean`: a bean whose job is to **make another object**. Spring registers the `FactoryBean` and, when someone asks for that bean, calls its `getObject()`; since `isSingleton()` is `true` by default, the result is cached and reused. In the example, `DailyWodFactoryBean` decides the WOD of the day: ask for `"dailyWod"` and you get an `Amrap`; ask for `"&dailyWod"` and you get the factory.

> [!spring]
> Many integrations work like this under the hood: they build a complex object (a client, a session, a proxy) behind a bean with a simple name.
@describe: Inside the Spring context, DailyWodFactoryBean, highlighted, sends getObject() and hands over an Amrap.

## @step:recap — Recap
You started with a service that had a `switch` per format and ended up with:

- **One product**, `Workout`, with one class per format.
- **One creator**, `WodPlanner`, whose `plan()` uses an abstract factory method.
- **One concrete creator per format**, as a bean, deciding what to build.
- **`FactoryBean`**, when you want the container itself to call your factory.

> [!key-idea]
> When "which class to create" depends on the case, move that decision into a method subclasses can redefine.
@describe: Final view: the coach, the controller, WodService, the three planners implementing WodPlanner and their products, all inside the Spring context.
