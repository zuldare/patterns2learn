---
title: Observer
summary: A personal record has to notify the athlete, update the leaderboard and hand out a badge. Publish one event and let each part react on its own, without the service knowing who's listening.
minutes: 12
level: beginner
recap:
  intent: Define a one-to-many dependency so that when one object changes, everyone interested hears about it without that object knowing them.
  participants:
    - Subject (ResultService, or ManualPrSubject in the hand-written version), which detects the change and announces it
    - Observer (PrObserver, or any @EventListener method), the contract for whoever wants to hear about it
    - ConcreteObserver (NotificationListener, LeaderboardListener, BadgeListener), each reacting its own way
    - Event (PersonalRecordEvent), what travels from one to the others
  pros:
    - The service doesn't know who listens, so adding a reaction doesn't touch it
    - Each reaction lives in its own class and is tested on its own
    - With @Async, slow reactions don't hold up the publisher
  cons:
    - The flow is harder to follow, because the call no longer shows in the code
    - Everything is synchronous by default and a listener's exception reaches the publisher
    - Order between listeners isn't guaranteed unless you set it with @Order
  related:
    - Mediator
    - Chain of Responsibility
    - Command
quiz:
  - q: With @EventListener and nothing else, when does the listener run?
    options:
      - Later, on a separate thread
      - On the same thread, inside publishEvent(), before the publishing code carries on
      - When the Spring context shuts down
      - Only if the transaction commits
    answer: 1
    explain: Spring events are synchronous by default. publishEvent() calls each listener and only returns once they're done; if one throws, the exception reaches the publisher.
  - q: You want the "new PR" message not to slow down the response. What do you do?
    options:
      - Move the sending into ResultService
      - Call publishEvent() twice
      - Put @Order(1) on the listener
      - Annotate the listener with @Async and enable @EnableAsync
    answer: 3
    explain: With @Async, Spring hands the event to that listener on another thread, so publishEvent() no longer waits for it (synchronous listeners still run before it returns). Perfect for slow I/O work like sending notifications.
  - q: Tomorrow you also want to email the coach on every PR. What do you change?
    options:
      - Just a new class with an @EventListener method taking PersonalRecordEvent
      - ResultService, to add the email call
      - The controller, so it calls the email service after record()
      - A configuration that registers the new listener with the publisher
    answer: 0
    explain: Spring discovers the @EventListener methods of every bean and subscribes them on its own. The service publishes the same event as always and never learns someone else is listening.
  - q: What's the difference between classic Observer and Spring events?
    options:
      - Classic Observer doesn't work in Java
      - Spring events don't use the Observer pattern
      - In the classic one the subject keeps its list of observers and calls them; in Spring the context's event publisher does that
      - In Spring every listener must implement a Spring interface
    answer: 2
    explain: It's the same pattern with the plumbing done by the context. Spring keeps track of who listens to which event type and delivers it; your classes only publish or listen.
---
## @step:problem — One PR that sets everything off
Ana just back-squatted 105 kg, five more than her best. A personal record means three things:

- **Notify her** with a message.
- **Update the leaderboard** for that lift.
- **Give her the badge** "PR club".

In the coupled version, `CoupledResultService` does all three by calling each service directly, one after another.

> [!problem]
> The results service depends on every interested party and calls them one by one. Each new reaction is another dependency and another line in this method.
@describe: The athlete sends 105 kg to LiftController, which calls CoupledResultService, highlighted in red; it calls Notifier, Leaderboard and Badges directly.

## @step:smell — If the badge fails, the PR is lost
The badge service is down and `award()` throws. Since everything happens in the same method, the `best.put(...)` on the next line **never runs**: Ana's PR isn't stored.

The example test proves it. A side feature (a badge) has taken down the main one (recording the result).

> [!warning]
> The more a class knows about its neighbours, the more ways it has to break because of them.
@describe: The award() ✗ packet goes from CoupledResultService to Badges, highlighted: the call fails.

## @step:gof — Observer: announce, don't call
The Observer pattern flips the relationship:

- `PrObserver` is the contract: `onRecord(event)`.
- Each interested party implements it in its own way.
- `ManualPrSubject` keeps a **list of observers**, lets them sign up with `subscribe()` and, when there's a PR, walks the list and tells each one.

The subject no longer knows whether there's one, three or none, or what each one does.

> [!key-idea]
> Whoever changes announces *that* something happened; the interested parties decide *what* to do about it.
@describe: ManualPrSubject and the PrObserver interface appear, highlighted; two observers, the leaderboard one and the badges one, implement it and the subject sends onRecord() to the interface.

## @step:spring-events — The context already is a publisher
You don't need to write the subscriber list: the **Spring context** already has one. `ResultService` gets an `ApplicationEventPublisher` and, when it detects a PR, does:

`events.publishEvent(new PersonalRecordEvent(...))`

And that's it. No fields for notifications, leaderboard or badges.

> [!spring]
> Any object can be an event: here, a plain `record`, with no need to extend `ApplicationEvent` (years ago you had to). Spring delivers it to every method that expects it.
@describe: The Spring context appears with ResultService and ApplicationEventPublisher, highlighted together with the context, wired to the three listeners.

## @step:listeners — Listening is an annotation
Every interested party is a bean with an `@EventListener` method that takes the event type it cares about:

- `LeaderboardListener` updates the leaderboard.
- `BadgeListener` hands out the "PR club" badge.
- `NotificationListener` prepares the "new PR" message.

Spring finds them at startup and subscribes them on its own, with no interfaces and no manual registration.

> [!key-idea]
> A new reaction, like an email to the coach? A new class with an `@EventListener`. `ResultService` never notices.
@describe: The three listeners, NotificationListener, LeaderboardListener and BadgeListener, appear highlighted.

## @step:request — A PR start to finish
Ana logs her 105 kg:

1. `POST /api/lifts` reaches the controller, which calls `record()`.
2. `ResultService` stores the new mark and sees it beats the previous 100 kg.
3. It publishes a `PersonalRecordEvent`.
4. The leaderboard shows Ana at 105 kg, she gets the badge, and the message "new PR in Back squat, 105 kg (+5)" goes out.

> [!key-idea]
> The example test checks all three reactions from a single call to `record()`.
@describe: 105 kg travels from the athlete to the controller, record() to ResultService, highlighted, PR event to the publisher and from there to LeaderboardListener and BadgeListener.

## @step:sync — Careful: it's synchronous
A detail that surprises people: by default `publishEvent()` calls each listener **on the same thread**, one after another, and doesn't return until they're done.

So if a listener throws, the publisher gets the exception. The example test uses a broken badge printer and `record()` fails along with it.

Careful, because step 2's problem **isn't completely gone**. The mark is already stored (the event is published afterwards), but the `POST` answers 500, the listeners after the broken one don't run and, if the athlete retries, it no longer counts as a PR.

> [!warning]
> Three remedies, depending on the case. Catch errors inside the listener if its failure shouldn't affect anyone. Make it asynchronous (next step) if it's also slow. And if you work with a database, `@TransactionalEventListener` runs it only once the transaction commits; with no active transaction it doesn't run at all, unless you set `fallbackExecution = true`.
@describe: The event goes from the service to the publisher and an exception comes back from BadgeListener, highlighted, to the publisher.

## @step:async — The slow stuff, on another thread
Sending a notification is slow: there's a network and an external service involved. With `@Async` on the listener (and `@EnableAsync` on the application), Spring hands it the event on **another thread**, and `record()` answers without waiting for it.

> [!spring]
> The leaderboard and the badge stay synchronous because they're fast and in memory. Choose per listener: synchronous if it must happen before responding, `@Async` if it can happen afterwards.

> [!warning]
> An exception in an `@Async` listener no longer reaches anyone: it goes to the `AsyncUncaughtExceptionHandler`, which by default only logs it. If the message matters, retry inside the listener or store it to send again later.
@describe: The event travels from the publisher to NotificationListener, highlighted, which handles it on another thread.

## @step:spring-does-it — Spring already does it for you
Spring talks to itself this way. The `ApplicationContext` publishes `ContextRefreshedEvent` at startup and `ContextClosedEvent` on shutdown, and Spring Boot adds `ApplicationReadyEvent`, `WebServerInitializedEvent`… Your code hooks in with the same `@EventListener`.

> [!spring]
> The example test listens to the context starting and closing: "context ready" when it opens and "save today's leaderboard" when it closes, without anyone calling those methods.
@describe: Inside the Spring context, ApplicationContext, highlighted, sends ContextRefreshedEvent to the event publisher, also highlighted.

## @step:recap — Recap
You started with a service that called everyone and ended up with:

- **One event**, `PersonalRecordEvent`, published in one line.
- **Independent listeners**, each with its own `@EventListener`.
- **Synchronous by default**, with `@Async` or `@TransactionalEventListener` when you need them, knowing where errors go in each case.
- **Zero coupling**: adding a reaction doesn't touch the service.

> [!key-idea]
> When "when X happens, do Y, Z and W" starts to grow, publish X and let Y, Z and W subscribe.
@describe: Final view: the athlete, the controller, ResultService and the event publisher handing the PR to the three listeners, all inside the Spring context.
