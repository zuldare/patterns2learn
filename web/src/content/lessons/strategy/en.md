---
title: Strategy
summary: Swap a pricing switch for one strategy per plan and let Spring inject them all into a Map.
minutes: 12
level: beginner
recap:
  intent: Move each variant of the same calculation into its own class, all behind a shared contract, so you can pick one (or add new ones) without touching the code that uses them.
  participants:
    - Context (PricingService), which receives the strategies and delegates to the right one
    - Strategy (PricingStrategy), the shared contract
    - ConcreteStrategy (MonthlyPricing, TenPackPricing, DropInPricing, StudentPricing), one class per plan
  pros:
    - Open/Closed, a new plan is a new class and working code stays untouched
    - No more conditionals, the switch is gone
    - Each strategy is tested on its own, with small tests and no dependencies
  cons:
    - More classes, even if each one is tiny
    - The client has to know the keys (monthly, ten-pack…) to ask for the right strategy
  related:
    - State
    - Template Method
    - Factory Method
quiz:
  - q: What does Spring inject into a constructor that takes a Map<String, PricingStrategy>?
    options:
      - Only the bean marked @Primary, wrapped in a single-entry map
      - Every bean implementing PricingStrategy, keyed by its bean name
      - An empty map you have to fill yourself in a @PostConstruct method
      - Every bean implementing PricingStrategy, keyed by its class name
    answer: 1
    explain: Spring collects every bean of that type in the context and puts them in the map under their bean names. That is why @Component("ten-pack") makes the key exactly ten-pack.
  - q: You want to add the student plan. What do you have to change?
    options:
      - PricingService, to add one more branch
      - PricingController and PricingService
      - Only the new StudentPricing class
      - A configuration class that registers the strategy by hand
    answer: 2
    explain: A new class annotated with @Component("student") is enough. Spring picks it up at startup and adds it to the map; the service and the controller never notice.
  - q: How is Strategy different from State?
    options:
      - It isn't, they are the same pattern under two names
      - In Strategy someone outside picks the variant (here, the plan in the request); in State the object itself changes behaviour as its state changes
      - State uses interfaces and Strategy uses inheritance
      - Strategy is only for calculations and State is only for database state machines
    answer: 1
    explain: The structure looks very similar, but the intent differs. With Strategy the client decides which algorithm to use; with State the object manages its own transitions and the client doesn't even know which state it is in.
  - q: How does DelegatingPasswordEncoder know which algorithm to use when checking a password?
    options:
      - It tries every algorithm until one matches
      - It reads the {id} prefix of the stored hash, such as {bcrypt}, and delegates to the encoder with that id
      - It always uses bcrypt; the prefix is just decoration
      - It decides based on the length of the hash
    answer: 1
    explain: Every hash stores the algorithm id in braces up front. The encoder reads it, looks up the strategy with that id in its map and hands the work over. Same trick as our pricing Map.
---
## @step:problem — A switch that keeps growing
Your box has a small Spring Boot API that works out what each athlete pays. Today someone asks about the ten-pack with 12 sessions: `GET /api/pricing/quote?plan=ten-pack&sessions=12`.

Today there are three plans:

- **monthly**: 79.00 €, however much you train.
- **ten-pack**: 120.00 € for every started block of 10 sessions.
- **drop-in**: 15.00 € per session, for visitors.

All the pricing lives in `LegacyPricingService`, inside a `switch` on the plan name.

> [!problem]
> Every plan is a branch of the same method. It works, sure, but the logic for every plan is tangled up in a single class.
@describe: On the left, the athlete sends a packet labelled plan=ten-pack to PricingController, which calls LegacyPricingService, highlighted in red.

## @step:smell — Then the student discount shows up
The coach wants a student rate. Where does it go? Into the same `switch`, of course: one more `case`, one more `return`, and fingers crossed you don't break the ten-pack along the way.

Every new plan means opening, changing and retesting the whole class. If two people work on prices at the same time, you get to resolve conflicts in the same method.

> [!warning]
> This breaks the Open/Closed principle: to **add** behaviour you have to **modify** code that was already tested and running in production.
@describe: The diagram does not change: LegacyPricingService stays highlighted in red as the place you must edit for every new plan.

## @step:interface — One contract for every plan
First, give a name to what all plans have in common: given a `PricingRequest` (plan and sessions), they return a `Money`.

That's the `PricingStrategy` interface. One method, nothing else. Whoever computes prices no longer needs to know *how* each plan is priced, only that something fulfils this contract.

> [!key-idea]
> Depend on the contract, not on the concrete class. Everything else follows from here.
@describe: To the right of LegacyPricingService, the PricingStrategy interface appears, highlighted.

## @step:strategies — One class per plan
Each branch of the `switch` becomes a class implementing `PricingStrategy`: `MonthlyPricing`, `TenPackPricing` and `DropInPricing`.

Look at `@Component("ten-pack")`: the bean name is **exactly** the key that comes in the URL. That's no accident, and you'll put it to work in the next step.

The ten-pack logic is isolated and easy to read: with 12 sessions, `(12 + 9) / 10` gives 2 blocks, so 2 × 120.00 €.

> [!key-idea]
> Each strategy is small, independent of the others and covered by a three-line unit test.
@describe: Around the interface, three blocks appear, monthly, ten-pack and drop-in, highlighted and joined to PricingStrategy with implementation arrows.

## @step:injection — Spring hands you every strategy
Now the Spring context comes in. `PricingService` replaces the old service and asks for a `Map<String, PricingStrategy>` in its constructor.

Nothing to register by hand: Spring finds every bean implementing the interface and gives them to you in that map, keyed by bean name. With a single constructor you don't even need `@Autowired`.

> [!spring]
> Injecting a `Map<String, T>` (or a `List<T>`) comes out of the box in Spring: you get every bean of type `T` in the context. The map ends up as `monthly → MonthlyPricing`, `ten-pack → TenPackPricing`, `drop-in → DropInPricing`.
@describe: The Spring context platform appears under all the blocks. LegacyPricingService disappears and PricingService takes its place, highlighted along with the context and joined to the interface by an injection link.

## @step:request — One request, end to end
Same request as before: plan `ten-pack`, 12 sessions.

1. The controller reads the parameters and builds a `PricingRequest`.
2. `PricingService` calls `strategies.get("ten-pack")` and gets `TenPackPricing`.
3. The strategy computes 2 blocks × 120.00 € and returns **240.00 €**.

The service no longer decides anything: it looks up and delegates. If someone asks for a plan that doesn't exist, the map returns `null`, the service throws `UnknownPlanException` and the API answers 400.
@describe: The plan=ten-pack packet travels from the athlete to the controller and from the controller to PricingService; the ten-pack block is highlighted and a 240.00 € packet travels back from PricingService to the controller.

## @step:extend — Adding student without touching anything
Back to the coach's request. This time the fix is a new class, full stop: `StudentPricing`, registered as `@Component("student")`, which takes 20 % off the monthly fee: 79.00 € becomes **63.20 €**.

Neither the service nor the controller changes. At startup Spring finds the new bean and adds it to the map under the key `student`.

> [!warning]
> The price of this flexibility: the client must know the keys. Type `@Component("studen")` and the app starts without complaint, while requests with `plan=student` end in a 400. One test per key saves you the scare.
@describe: To the left of ten-pack, near the controller, the student block appears, highlighted and joined to PricingStrategy with an implementation arrow. The rest of the diagram is unchanged.

## @step:spring-does-it — Spring already does it for you
Chances are you already use this pattern without noticing. Spring Security's `DelegatingPasswordEncoder` stores each hash with a prefix naming the algorithm: `{bcrypt}…`, `{noop}…`, `{pbkdf2}…`.

When checking a password, it reads that `{id}`, looks up the matching encoder in its internal map and hands the work over. It is exactly our `Map<String, PricingStrategy>`, only with hashing algorithms.

> [!spring]
> This is what lets you switch algorithms without forcing anyone to reset their password: new hashes are created with bcrypt and old ones are still checked through their prefix. The example test proves it with the password `wod-2026`.
@describe: Only the DelegatingPasswordEncoder block remains inside the Spring context, highlighted; the athlete sends it a packet labelled {bcrypt}….

## @step:recap — Recap
You went from a `switch` that grew with every plan to this:

- **Context**: `PricingService`, which receives the strategies and delegates.
- **Strategy**: `PricingStrategy`, the contract.
- **ConcreteStrategy**: one class per plan, registered with its key as the bean name.

And the most Spring part of all: you didn't write a single line to pick the strategy. The container builds the map for you.

> [!key-idea]
> If you have two branches that will never change, an `if` is fine. When variants grow or change independently, pull them out into strategies.
@describe: The full diagram: the athlete, the controller and PricingService inside the Spring context, joined to the PricingStrategy interface, which monthly, ten-pack, drop-in and student implement.
