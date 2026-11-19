---
title: Facade
summary: Signing up a member touches six parts of the system, in a set order, undoing what was done if the payment fails. Put it all behind one operation any client can use.
minutes: 10
level: beginner
recap:
  intent: Offer one simple door to a set of parts that together do something complicated, so whoever uses it doesn't have to know them or coordinate them.
  participants:
    - Facade (OnboardingFacade), which exposes the join() operation and knows which parts to call and in what order
    - Subsystems (MemberRegistry, AccessCards, Billing, Waivers, IntroClasses, Mailer), which do the work and don't know there's a facade
    - Clients (MemberController, KioskController), which only know the facade
  pros:
    - Clients make one call instead of coordinating six
    - The order of the steps and how to undo them live in one place
    - Subsystems can change inside without touching the clients
  cons:
    - If you keep adding to it, the facade ends up as a huge class that knows too much
    - It's one more layer between the client and the real work
    - Anyone who needs something the facade doesn't offer has to go to the subsystem directly
  related:
    - Adapter
    - Mediator
    - Singleton
quiz:
  - q: With FrontDeskController, what happens if Leo's payment is declined?
    options:
      - Nothing, because charging is the first thing the controller does
      - Leo stays registered and keeps an access card, even though he never paid
      - Spring automatically undoes everything that had been done
      - The controller retries the charge until the bank accepts it
    answer: 1
    explain: The controller registers Leo and hands him a card before charging, and undoes nothing if the charge fails. The FrontDeskControllerTest test checks it.
  - q: What does OnboardingFacade NOT do?
    options:
      - Decide in what order the sign-up steps happen
      - Undo what was already done if the charge fails
      - Offer the same operation to several different clients
      - Stop other parts of the code from using Billing directly
    answer: 3
    explain: A facade simplifies, but it doesn't hide. Billing is still just another bean, and a billing dashboard can use it without going through sign-up.
  - q: The front desk and the kiosk at the entrance both sign up members. What do they gain from the facade?
    options:
      - The sequence and how to undo it are written once, in join()
      - Each client can pick its own order of steps without affecting the other
      - The subsystems no longer need their own unit tests
      - Each one can skip the waiver when it doesn't need it
    answer: 0
    explain: Without a facade, each client would copy the sequence and, sooner or later, one would forget the waiver or returning the card.
  - q: In what sense is ApplicationContext a facade?
    options:
      - Because it builds every bean through one shared proxy that adds behaviour
      - Because it registers beans for every class annotated with @Component
      - Because it puts beans, messages, events and resources behind one interface
      - Because it replaces the BeanFactory, which Spring no longer uses inside
    answer: 2
    explain: AbstractApplicationContext passes getBean to its BeanFactory, getMessage to the MessageSource, publishEvent to the ApplicationEventMulticaster and getResources to a ResourcePatternResolver.
---
## @step:problem — Becoming a member
Ana wants to join the box. At the front desk, signing her up means:

1. registering her as a member;
2. giving her an access card;
3. charging the first month;
4. sending her the waiver to sign;
5. booking her intro class;
6. sending the welcome email.

Those are six different parts of the system. The first version, `FrontDeskController`, calls them one by one.

> [!problem]
> The controller knows six subsystems and the exact order in which to use them.
@describe: The front desk sends Ana · unlimited to FrontDeskController, highlighted in red, which calls all six subsystems itself: register(), subscribe(), welcome() and the rest.

## @step:smell — Leo, halfway
Leo tries to join, but his bank card is declined. By then, the controller **has already registered him and already handed him an access card**, and it undoes nothing: Leo can walk into the box without having paid. The `FrontDeskControllerTest` test proves it.

And then the kiosk at the entrance arrives, which also signs up members. Do you copy the six steps? And the next time the order changes?

> [!warning]
> When a sequence of calls is repeated across several clients, every copy is a chance to forget a step or an "undo".
@describe: The charge with tok_declined fails; MemberRegistry, AccessCards and Billing are highlighted: the member and their card stay even though nothing was paid.

## @step:facade — One door
`OnboardingFacade` offers a single operation: `join(JoinRequest)`. Inside, it coordinates the six parts:

- it registers, hands over the card and charges;
- then it sends the waiver, books the class and sends the welcome;
- it returns a `Welcome` with everything the member needs to know.

The subsystems don't change and don't know there's a facade. There's just one new place that knows how to use them together.

> [!key-idea]
> The facade doesn't do the work: it knows **whom** to ask and **in what order**.
@describe: OnboardingFacade appears, highlighted, wired to the six subsystems.

## @step:undo — Order matters, and so does undoing
The facade orders the steps on purpose:

- it checks the plan before anything else;
- what can be undone goes first (registering, handing over the card) and **charging goes last** in that block;
- if the charge fails, it takes the card back, deletes the registration and rethrows the error;
- what can't be undone, like emails, is only sent once the charge has gone through.

Once the charge goes through, the member is in: if the waiver, the booking or the email fails afterwards, the facade logs it to be retried by hand, but doesn't undo the sign-up. The `onceItIsPaidAFailingFollowUpDoesNotUndoTheMembership` test checks it.

> [!spring]
> With a database, `@Transactional` on `join()` would make the database steps atomic. But a charge or an email isn't undone by a rollback: the order and the compensation are still the facade's job.
@describe: Billing, highlighted with the facade, answers payment declined; the facade calls revoke() on AccessCards and remove() on MemberRegistry.

## @step:clients — Two clients, one call
In Spring, the facade is just another `@Service`. `MemberController` (the front desk app, with JSON) and `KioskController` (the tablet's form) get it injected and make **one** call: `join(...)`.

Neither of them knows the cards, the billing or the waiver exist. If the order changes tomorrow, the facade changes and the clients never notice.
@describe: The Spring context appears. MemberController and KioskController, highlighted, send join() to OnboardingFacade, wired to the six subsystems.

## @step:request — Ana, in
`POST /api/members` with Ana, the `unlimited` plan and a valid payment:

1. `MemberController` calls `join(...)`.
2. The facade registers Ana, gives her card `CARD-0001` and charges 89.00 €.
3. It sends the waiver, books her Saturday 10:00 class and sends the welcome.
4. It answers 201 with all of that.

If the payment is declined, the answer is 402 and there's no trace of Ana left in the system.
@describe: POST /api/members travels from the front desk to MemberController and join() to the facade, highlighted, which calls register(), issue(), subscribe() and welcome().

## @step:spring-does-it — Spring already does it for you
The `ApplicationContext` acts as a facade. Behind a single interface there are several parts, and `AbstractApplicationContext` delegates each call to its own:

- `getBean(...)`, to its `BeanFactory`;
- `getMessage(...)`, to the `MessageSource` (Spring Boot sets it up on its own if there's a `messages.properties`);
- `publishEvent(...)`, to the `ApplicationEventMulticaster`;
- `getResources(...)`, to a `ResourcePatternResolver`.

The example test uses all four on the same object. And its "big" operation, `refresh()`, is like our `join()`: it sets up the bean factory, the post-processors, the `MessageSource`, events and the singletons in a fixed order.

> [!spring]
> `JdbcTemplate` and `RestClient` also act as facades over more complicated APIs (JDBC, HTTP clients). `JdbcTemplate` also applies Template Method.
@describe: Inside the Spring context, ApplicationContext, highlighted, sends getBean() to BeanFactory, getMessage() to MessageSource, publishEvent() to ApplicationEventMulticaster and getResources() to ResourcePatternResolver.

## @step:recap — Recap
You started with a controller coordinating six parts and ended up with:

- **A facade** with one business operation, `join()`.
- **The order and the compensation** in one place.
- **Several clients** making a single call.
- **Subsystems** that are still there for anyone who needs them directly.

Don't mix it up with its neighbours: **Adapter** turns one interface into another that already exists; **Facade** creates a new, simpler one over several parts; with **Mediator**, the parts know the mediator and talk through it, while the subsystems behind a facade don't even know it exists. And a facade usually has a single instance: in Spring, a singleton bean.

And when you don't need it: if there's only one client and two calls, the facade is one class too many. And if it starts piling up unrelated operations, split it by use case before it knows everything.

> [!key-idea]
> When doing something means coordinating several parts, put that coordination behind an operation with a business name.
@describe: Final view: the front desk and the visitor, both controllers, OnboardingFacade and the six subsystems, all inside the Spring context.
