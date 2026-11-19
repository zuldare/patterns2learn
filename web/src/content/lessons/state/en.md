---
title: State
summary: A box membership can be on trial, active, frozen or expired, and "come in" or "freeze" mean different things in each case. Let each state decide what to do and which one comes next.
minutes: 11
level: intermediate
recap:
  intent: Let an object change its behaviour when its situation changes, by putting each situation in its own object instead of spreading conditions across every method.
  participants:
    - Context (Membership), what the rest of the app uses; it hands every action to its current state
    - State (MembershipState), what every state can do, with a default behaviour
    - ConcreteState (TRIAL, ACTIVE, FROZEN, EXPIRED), each situation with its rules and its transitions
  pros:
    - Each state's rules live together, in one place
    - Transitions can be read in the code, since each state says which one comes next
    - A new state is one more constant, without touching the others' methods
  cons:
    - With two states and one rule, an if is clearer
    - Transitions end up spread across the states; to see the whole map you have to read them all
    - If you store the state by name, renaming a constant means migrating the data
  related:
    - Strategy
    - Singleton
    - Flyweight
quiz:
  - q: Who decides which state an active membership moves to when it's frozen?
    options:
      - Membership, with a switch on the state it has right now
      - MembershipService, just before saving to the database
      - The controller, depending on the action in the URL
      - ACTIVE itself, which returns FROZEN from its freeze()
    answer: 3
    explain: Membership just hands the action to its state and keeps whatever it returns. Each state knows its own transitions.
  - q: The box adds an INJURED state, left with resume(). What do you change?
    options:
      - A new case in every method of Membership and the service
      - An INJURED constant with its behaviour, and the action that leads to it
      - An if in MembershipService that checks whether the member is injured
      - The table, to store an injured boolean next to the state
    answer: 1
    explain: INJURED decides what happens on check-in or on resume. You also need an action, say injure() on ACTIVE, that returns INJURED. The other states don't change.
  - q: Why can every frozen membership share the same FROZEN object?
    options:
      - Because the state holds no member data; that data lives in Membership
      - Because Spring registers each enum constant as a singleton bean
      - Because the database only stores one row per state
      - Because Java doesn't allow more than one object per class
    answer: 0
    explain: FROZEN only has behaviour. What changes from one member to another (their trial visits, say) is in Membership, which is passed in as a parameter.
  - q: What does MembershipRepository store in the status column?
    options:
      - The state object serialised, with all its behaviour
      - A number with the state's position in the enum
      - The name, like "FROZEN", which valueOf turns back into the constant
      - A copy of each state's rules in text form
    answer: 2
    explain: The behaviour is in the code; in the database the name is enough. Storing the position (the ordinal) would be fragile, because it changes if you reorder the constants.
---
## @step:problem — The door asks the membership
When the card is tapped, the box's door asks the athlete's membership whether they can come in. The answer depends on its situation:

- **trial**: they can come in, up to 3 visits;
- **active**: they can come in, freeze or expire;
- **frozen**: they can't come in until it's resumed;
- **expired**: they can't come in until it's renewed.

The first version, `SwitchingMembership`, keeps the state in a `String` and every method runs a `switch` on it.

> [!problem]
> Each state's rules are spread across every method: to know what a frozen membership can do, you have to read them all.
@describe: The athlete asks MembershipController to come in, which asks SwitchingMembership, highlighted in red, with a switch on the state.

## @step:smell — One more state, every switch
Look at the `default` lines: every method repeats "unknown status", because a `String` accepts anything and a typo like `"activ"` only shows up in production.

And if the box adds a new state, say "injured", you have to open **every** `switch` and decide what it does in each one. Forget one and the compiler won't tell you.

> [!warning]
> A `switch` on the same state repeated across several methods is usually asking for one object per state.
@describe: The diagram doesn't change: SwitchingMembership stays highlighted in red, with a default case repeated in every method.

## @step:states — One object per state
State puts each situation in its own object. In Java, the most natural way is an `enum` where each constant overrides the methods that concern it:

- `TRIAL` lets you in while visits remain, and `renew()` moves it to `ACTIVE`;
- `ACTIVE` lets you in, and `freeze()` returns `FROZEN`;
- `FROZEN` doesn't let you in, and `resume()` goes back to `ACTIVE`;
- `EXPIRED` doesn't let you in, and `renew()` goes back to `ACTIVE`.

Each method **returns the next state**: the transitions are written in the state itself.

> [!key-idea]
> The rules for "frozen" are all in `FROZEN`. To know what it can do, you read a single place.
@describe: The four states appear, highlighted, as a diagram: renew() goes from TRIAL to ACTIVE, freeze() from ACTIVE to FROZEN, resume() back to ACTIVE and expire() to EXPIRED.

## @step:context — The membership delegates
`Membership` is the **context**: it's what the rest of the app uses. It has not a single `if` on its state. Every action does the same thing: it hands it to its current state and keeps the state that comes back.

`state = state.freeze(this)`: if the membership is active, it becomes frozen; if it's on trial, the state refuses with an error. `Membership` doesn't need to know which of the two will happen.
@describe: Membership appears, highlighted, handing the action to its current state, ACTIVE, with state.freeze(this).

## @step:defaults — What isn't allowed, by default
Every action has a default behaviour: refuse it with a clear message ("can't freeze a trial membership"). That way each state only writes what it **does** allow.

`checkIn` is the exception: it's `abstract`, so every state is forced to decide whether it lets you in. If tomorrow you add a constant and forget, it won't compile.

> [!key-idea]
> A sensible default keeps each state short. What must not be missing is declared `abstract` and the compiler keeps watch.
@describe: TRIAL and EXPIRED are highlighted: they only override what they allow, and the default behaviour refuses the rest.

## @step:walkthrough — Ana freezes her membership
Ana goes on holiday:

1. `ana.freeze()`: `ACTIVE` returns `FROZEN`.
2. She tries to come in: `FROZEN` answers "membership is frozen: resume it first".
3. She's back: `ana.resume()`, and `FROZEN` returns `ACTIVE`.
4. She can come in again.

The example test does exactly this, and another one checks that a refused action doesn't change the state.
@describe: freeze() takes Ana from ACTIVE to FROZEN and resume() brings her back to ACTIVE; both states are highlighted.

## @step:request — Through the API
`POST /api/memberships/1/freeze`:

1. `MembershipService` loads Ana's membership from the database, inside a transaction.
2. It calls `freeze()`, and the `ACTIVE` state returns `FROZEN`.
3. It saves the membership and answers 200 with the new state.

If she then tries to come in, `POST /api/memberships/1/check-in` answers 409 with the reason `FROZEN` gives.
@describe: POST /api/memberships/1/freeze travels from the athlete to the controller, apply() to the service and freeze() to Membership, highlighted; ACTIVE moves to FROZEN, also highlighted, and the service calls save() on the repository.

## @step:persist — And Spring?
Spring's core doesn't ship a general State. What the app does need is to **keep the state between requests**, and that's where the enum helps:

- the database only stores the name (`"FROZEN"`);
- when reading, `MembershipState.valueOf(...)` returns the constant, always the same object;
- since a state holds no member data, every frozen membership shares the same `FROZEN`.

When transitions get complicated (events, guards, actions on entering or leaving a state, history), there's **Spring Statemachine**, a separate project that defines the state machine declaratively.

> [!warning]
> If you store the state by name, renaming a constant leaves rows that can no longer be read. Treat it as a schema change and migrate the data.
@describe: Inside the Spring context, MembershipRepository, highlighted, stores "FROZEN" in the membership table, also highlighted.

## @step:recap — Recap
You started with a `switch` on a `String` in every method and ended up with:

- **One state per situation**, each with its rules and its transitions.
- **A context**, `Membership`, that delegates without a single `if`.
- **A default behaviour** that refuses what isn't allowed, and `abstract` for what must not be missing.
- **The state's name** in the database.

Don't mix it up with **Strategy**: both put behaviour into interchangeable objects, but a strategy is picked by whoever uses it, whereas here it's the state itself that decides when to change to the next one.

And when you don't need it: with two states and one rule, an `if` reads better; and if there are many transitions that change often, a transition table or Spring Statemachine makes them more visible.

> [!key-idea]
> When the same object behaves differently depending on its situation, put each situation in its own object and let it decide the next one.
@describe: Final view: the athlete, the controller, the service, Membership with its four states, the repository and the table, all inside the Spring context.
