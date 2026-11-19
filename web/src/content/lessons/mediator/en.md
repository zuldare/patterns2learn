---
title: Mediator
summary: During class, the timer, the finish line, the music and the screen have to stay in step. Have them talk through a single piece that decides what each one does, instead of all of them knowing each other.
minutes: 10
level: intermediate
recap:
  intent: Put a go-between in the middle of a group of objects that need to coordinate, so each one only talks to it and the rules of how they work together live in one place.
  participants:
    - Mediator (FloorMediator), the interface with what the devices can report
    - ConcreteMediator (ClassFloor), which knows them all and decides what each does
    - Colleagues (WodTimer and FinishLine report to it; Music and Screen take its orders), which don't know each other. In GoF a colleague often does both; here each device plays only one side
  pros:
    - No device knows the others, so they can be changed or tested on their own
    - The class rules (when the music plays, what the screen shows) are together
    - Adding a new device touches the mediator, not all the others
  cons:
    - The mediator can grow until it knows everything about everyone
    - Following what happens when a button is pressed always means going through it
    - If coordination is minimal, it's one more class with little to do
  related:
    - Observer
    - Facade
    - Command
quiz:
  - q: What does WodTimer know about the music and the screen?
    options:
      - How to turn the volume up and what to show when it starts
      - Nothing, it just tells ClassFloor it has started or the cap has arrived
      - That they exist, because it gets them in its constructor
      - The same as FinishLine, because they share a base class
    answer: 1
    explain: WodTimer only knows the FloorMediator interface. What happens to the music and the screen at the start is ClassFloor's call.
  - q: The box adds lights that turn red when the cap arrives. What do you change?
    options:
      - WodTimer, so it turns the lights on when the cap arrives
      - FinishLine and WodTimer, because both have to tell the lights
      - Screen, so it tells the lights when it shows the results
      - A Lights device that ClassFloor turns on from capReached()
    answer: 3
    explain: The timer keeps reporting the same way. It's the mediator that decides that, at the cap, besides stopping the music and showing results, the lights go on.
  - q: How does Mediator differ from Observer?
    options:
      - In Mediator one object decides for all; in Observer each one reacts alone
      - In Observer one subject notifies many; in Mediator many notify one
      - In Mediator colleagues know each other's interface; in Observer they don't
      - Observer routes events by type; Mediator routes them by arrival order
    answer: 0
    explain: With Observer, whoever reports doesn't know who's listening or what they'll do. With Mediator there's a piece holding the coordination logic that gives each one specific orders.
  - q: What role does the DispatcherServlet play in Spring MVC?
    options:
      - It's the single entry point and also renders the views itself
      - It decides the HTTP status code of every response
      - It coordinates parts like HandlerMapping or HandlerAdapter, which don't know each other
      - It finds the controller and calls it directly via reflection
    answer: 2
    explain: The HandlerMapping knows nothing about the HandlerAdapter or the exception resolvers. The DispatcherServlet asks them in order and passes one's result on to the next.
---
## @step:problem — Devices that know each other
There are four devices in class: the **timer**, the **finish line** where each athlete records their time, the **music** and the **screen**. They have to stay in step: at the start the music goes up and the screen shows the clock; when someone finishes, their time shows up and the bell rings; at the cap, the music stops and the results show up.

In the first version, each device calls the others. `WiredFinishLine`, when recording a time, asks the timer whether it's running, writes on the screen and asks the music for the bell.

> [!problem]
> Each device knows the others and what they should do. The class rules are spread across all of them.
@describe: WiredFinishLine, highlighted in red, asks WiredTimer isRunning(), calls showFinish() on the screen and cue("bell") on the music.

## @step:smell — A web of dependencies
And the timer, at the cap, asks the finish line for the results to pass them to the screen: the two know each other. Between the four devices there are already six direct calls, and every new device (some lights, a team scoreboard) adds more with whichever ones it has to coordinate with.

To test the finish line you need a timer, a music system and a screen. And to change what happens when someone finishes, you have to find which device it's written in.

> [!warning]
> When each piece needs almost all the others, any change spreads across all of them.
@describe: WiredTimer and WiredFinishLine, highlighted in red, call each other, and each also calls the music and the screen.

## @step:mediator — One in the middle
Mediator puts a piece in the middle: `FloorMediator`. The devices just **report** what happened:

- `timerStarted()`, the timer has started;
- `athleteFinished(...)`, someone crossed the line;
- `capReached()`, time is up.

What each one has to do next is the mediator's decision.

> [!key-idea]
> The devices tell what happened; the mediator decides what gets done.
@describe: ClassFloor appears, highlighted, in the middle of the four devices.

## @step:colleagues — The devices just report
`WodTimer` no longer knows the music or the screen. `start()` does a single thing: tell the mediator. `FinishLine` too: it validates the time and reports with `athleteFinished(...)`.

`Music` and `Screen` do what they're told (play, show) and don't know a timer exists. The timer and the finish line are tested with a fake mediator (`DevicesTest` does it), and the music and the screen with no mediator at all.
@describe: WodTimer and FinishLine, highlighted, report to ClassFloor with timerStarted() and athleteFinished().

## @step:floor — The rules, together
`ClassFloor` is the concrete mediator. Every class rule is in one place:

- at the start: music at 8 and the clock on the screen;
- when someone finishes: it checks the WOD is running and that person hadn't finished already, shows their time and rings the bell;
- at the cap: it stops the music and shows the sorted results.

If a rule changes tomorrow, you know where it is.
@describe: ClassFloor, highlighted, tells the music to play, cue or stop, and the screen to show the clock, each time or the results.

## @step:flow — A whole class
The test runs a whole class: the timer starts, Ana finishes in 3:05, Leo in 2:52 and the cap arrives. At the end, the music has played, rung two bells and stopped, and the screen shows "1. Leo 2:52" and "2. Ana 3:05".

Neither the timer nor the finish line knows any of that. They just reported.
@describe: FinishLine reports Ana 185 s to ClassFloor, highlighted together with the screen; ClassFloor shows Ana 3:05 on the screen and asks the music for the bell.

## @step:request — From the coach's tablet
Each button on the tablet talks to one device: `POST /api/floor/start` to the timer, `POST /api/floor/finish` to the finish line and `POST /api/floor/cap` to the timer again. `GET /api/floor/screen` reads the screen.

In Spring, `ClassFloor` is a bean that gets the music and the screen, and the timer and the finish line get `FloorMediator`. Reports only go one way, towards the mediator, so there are no circular dependencies. If a device had to both report and take orders, you'd have to break the cycle, for example by registering it with the mediator after it's created.

If someone records a time before the start, the answer is 409 with the reason the mediator gives.
@describe: POST /api/floor/finish travels from the coach to the controller, finish("Ana", 185) to FinishLine, athleteFinished() to ClassFloor, highlighted, and Ana 3:05 to the screen.

## @step:spring-does-it — Spring already does it for you
To the outside, the `DispatcherServlet` is a *front controller*: the single way in for requests. On the inside, it acts as the mediator between Spring MVC's parts, which don't know each other:

- a `HandlerMapping` says which handler serves the URL;
- a `HandlerAdapter` knows how to call it;
- if it fails, a `HandlerExceptionResolver` decides the answer (here, `ExceptionHandlerExceptionResolver`, which calls our `@RestControllerAdvice`).

The `DispatcherServlet` asks them in order and passes one's result on to the next. The test checks each step: which handler was picked, which method was called, which exception the resolver got and the final answer, a 400.

> [!spring]
> That's why you can add your own `HandlerMapping` or exception resolver without touching the others: only the `DispatcherServlet` knows how they fit together.
@describe: Inside the Spring context, DispatcherServlet, highlighted, asks the HandlerMapping which handler it is, asks the HandlerAdapter to call finish() and, when it fails, the HandlerExceptionResolver answers 400.

## @step:recap — Recap
You started with devices calling each other and ended up with:

- **A mediator**, `ClassFloor`, holding every class rule.
- **Devices that only report** (timer, finish line) or only obey (music, screen).
- **No dependencies between devices**: each one is tested on its own.

Don't mix it up with its neighbours: with **Observer**, whoever reports doesn't know who's listening or what they'll do, and nobody coordinates; here the mediator holds that logic. A **Facade** simplifies access to several parts from outside, but those parts don't use it to talk to each other.

And when you don't need it: if only two pieces talk, letting them know each other is simpler; if the devices only announce "something happened" and there are no rules crossing between them, Observer or Spring events are enough; and watch that the mediator doesn't end up knowing how to do everyone's job.

> [!key-idea]
> When several pieces have to coordinate, have them talk to a single one that knows the rules, not to each other.
@describe: Final view: the coach, the controller, the timer, the finish line, ClassFloor, the music and the screen, all inside the Spring context.
