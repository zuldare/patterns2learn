---
title: Command
summary: At the front desk, "book me", "cancel me" or "move me to the seven o'clock" are actions that sometimes need undoing. Turn each one into an object that can be run, undone and written into a history.
minutes: 11
level: intermediate
recap:
  intent: Put an action and its data inside an object, so whoever triggers it doesn't need to know how it's done and it can be stored, queued, logged or undone.
  participants:
    - Command (Command), the interface with execute(), undo() and describe()
    - ConcreteCommand (BookCommand, CancelCommand, MoveCommand), each action with its data and its own way to undo itself
    - Receiver (ClassRoster), which knows how to do the real work
    - Invoker (FrontDesk), which runs the commands, keeps the history and undoes
    - Client (DeskController with DeskCommands), which creates each command with its receiver and its data
  pros:
    - Undo, logging and queuing all live in one place, the invoker
    - Whoever runs them knows no concrete action, so adding one doesn't touch it
    - Each action and how to undo it live together, in a small class
  cons:
    - One class per action, which can be a lot for simple things
    - Undoing properly means saving what's needed (the spot, the original class…) and it's easy to forget something
    - If others change the state outside the history, undoing may stop making sense
  related:
    - Memento
    - Strategy
    - Composite
quiz:
  - q: Why does CancelCommand keep the spot the athlete had?
    options:
      - So the log shows which position they were booked in
      - So undo() puts them back in exactly the same place in the list
      - Because ClassRoster doesn't allow cancelling without a position
      - So FrontDesk can sort the history by position
    answer: 1
    explain: Undoing a cancellation isn't just booking again. If Leo was second, he has to be second again. The command saves in execute() what undo() is going to need.
  - q: What does FrontDesk know about each command it runs?
    options:
      - Which ClassRoster method to call for each type
      - How to undo a booking and how to undo a cancellation
      - Which class each athlete is booked into right now
      - Only that it can be executed, undone and described
    answer: 3
    explain: The invoker works against the Command interface. That's why a new command, like "move to the waitlist", doesn't change a single line of FrontDesk.
  - q: A command fails when it runs because the class is full. What happens to the history?
    options:
      - It doesn't change, because run() only stores it if execute() succeeds
      - It's stored anyway, so it can be undone later
      - It's emptied completely, because the state can't be trusted any more
      - It's stored marked as failed and undo() skips it
    answer: 0
    explain: If it were stored, the next undo() would try to undo something that never happened. That's why run() calls execute() first and only then pushes it.
  - q: How is a Runnable you hand to a TaskExecutor like a Command?
    options:
      - Both receive the receiver as a constructor parameter
      - Both run on the same thread that created them
      - It's an action inside an object that someone else runs later
      - Spring keeps a history of every one it has already run
    answer: 2
    explain: Runnable has no undo(), but it's the same basic idea. Whoever creates it doesn't run it; they hand it over, and the executor decides when and on which thread.
---
## @step:problem — "It was Lea, not Leo"
At the front desk, people get booked, cancelled and moved between classes all the time. And sometimes someone gets it wrong: they book Leo into the 18:00 class when it was Lea.

The first version, `FrontDeskService`, has one method per action (`book`, `cancel`, `move`). To be able to undo, each method **writes down by hand** what it just did: `lastAction`, `lastSession`, `lastAthlete`, `lastSpot`… And `undoLast()` runs a `switch` on `lastAction` to know how to revert it.

> [!problem]
> How to undo each action lives far from the action, in a `switch` that has to be kept in step.
@describe: The front desk asks DeskController to undo, which calls undoLast() on FrontDeskService, highlighted in red; it cancels Leo in ClassRoster.

## @step:smell — Only once, and not everything
Look at `undoLast()`'s limits:

- It only remembers **the last** action. If you make two mistakes in a row, the first can no longer be undone.
- Moving between classes would also need the original class saved: one more field. Meanwhile, `move` falls into the `default` and can't be undone.
- And if tomorrow you can move someone to the waitlist, there's another case to add to the `switch`.

> [!warning]
> When undoing means remembering "what was last and with what data", what you want to keep is the whole action.
@describe: The diagram doesn't change: FrontDeskService stays highlighted in red and undoLast() fails on an action it doesn't know how to undo.

## @step:command — Each action, an object
Command turns each action into an **object** with three methods:

- `execute()`, do it;
- `undo()`, undo it;
- `describe()`, tell it in one line for the log.

An object can be stored in a list, handed to someone else, run later or undone. A method can't.

> [!key-idea]
> What used to be a call is now a thing: it can be stored, told and undone.
@describe: The Command interface appears, highlighted, with three commands implementing it: BookCommand, CancelCommand and MoveCommand.

## @step:concrete — Each command knows how to undo itself
`BookCommand` keeps its data (class and athlete) and knows how to do and undo:

- `execute()` books the athlete in `ClassRoster`;
- `undo()` removes them;
- `describe()` says "book Leo into 18:00 WOD".

`ClassRoster` is the **receiver**: it knows how to book and remove, but nothing about histories or undoing.
@describe: BookCommand, highlighted, calls book() or cancel() on ClassRoster.

## @step:memory — What it takes to go back
Undoing a cancellation isn't just booking again. If Leo was second on the list, he should be second again. That's why `CancelCommand` **saves the spot** when it runs, and `undo()` uses it to put him back in the same place.

`MoveCommand` does the same across two classes: it books into the new one, removes from the old one saving the spot, and undoing reverses it.

> [!warning]
> An undoable command has to save in `execute()` everything `undo()` is going to need. If something is missing, you'll find out when you undo.
@describe: CancelCommand, highlighted, removes Leo in ClassRoster and keeps his spot, the second one.

## @step:invoker — Whoever runs it doesn't know what it runs
`FrontDesk` is the **invoker**:

- `run(command)` executes it and, if it succeeds, pushes it onto the history and writes it into the log;
- `undo()` takes the last one from the history and asks it to undo itself; it only removes it if that works.

It doesn't know whether the command books, cancels or moves. That's why it can undo any number of steps back, and a new command doesn't change a single line of it. The history keeps the last 50.

> [!key-idea]
> If a command fails when it runs, it never reaches the history. That way `undo()` never tries to undo something that didn't happen.
@describe: FrontDesk, highlighted together with the history, sends execute() to the command and push() to the history.

## @step:client — The controller only creates commands
In Spring, `DeskController` is the **client**: with `DeskCommands` it creates the right command, already validated and wired to `ClassRoster`, and hands it to `FrontDesk`.

`POST /api/desk/bookings` creates a `BookCommand`; `DELETE`, a `CancelCommand`; `/moves`, a `MoveCommand`. And `POST /api/desk/undo` creates nothing: it asks the desk to undo the last thing.
@describe: The Spring context appears. DeskController, highlighted, sends run(commands.book(…)) to FrontDesk, which works with the commands, the history and ClassRoster.

## @step:request — Leo out, Lea in
1. `POST /api/desk/bookings` with Leo in class 1: 201 and "done: book Leo into 18:00 WOD" in the log.
2. `POST /api/desk/undo`: `FrontDesk` pops the `BookCommand` off the history and undoes it; `ClassRoster` removes Leo.
3. The answer says what was undone: "book Leo into 18:00 WOD".

If there's nothing left to undo, the answer is 409 "nothing to undo".
@describe: POST /api/desk/undo travels from the front desk to the controller, undo() to FrontDesk, which pops the history; BookCommand, highlighted with FrontDesk, cancels Leo in ClassRoster.

## @step:spring-does-it — Spring already does it for you
`Runnable` is the minimal version of a command: an action put inside an object, with no `undo()`. Spring Boot sets up a `TaskExecutor`, and when you hand it a `Runnable` it decides when and on which thread to run it. Whoever created it has nothing more to do with running it.

In the example, the `Runnable` in turn runs a desk command, so that late booking also lands in the history and can be undone.

The same idea shows up elsewhere: with `@EnableAsync`, `@Async` turns the call to your method into a task for that same executor (unless you define another one), and `TransactionTemplate.execute(...)` takes your action to run inside a transaction. But not every callback is a command: a `RowMapper`, for example, is closer to a Strategy.

> [!spring]
> When a Spring API asks you for a `Runnable` or a `Callable` to run later, it's asking you for a command: "tell me what needs doing and I'll run it when the time comes".
@describe: Inside the Spring context, TaskExecutor, highlighted, runs the Runnable lateBooking, also highlighted, with run(); from another thread it asks FrontDesk to run Eva's booking.

## @step:recap — Recap
You started with a `switch` that remembered only the last action and ended up with:

- **Commands**, each action in an object that knows how to run, undo and describe itself.
- **A receiver**, `ClassRoster`, that does the work and knows nothing about histories.
- **An invoker**, `FrontDesk`, with a history, a log and multi-step undo.
- **A client**, the controller, that only creates commands.

Don't mix it up with its neighbours: **Strategy** also puts behaviour inside an object, but it's *how* to do something and it gets swapped; a **Command** is *what* to do, with its data, to run now, later or backwards. **Memento** undoes another way: it saves a snapshot of the state instead of the opposite operation. And with **Composite** you can bundle several commands into one (a macro) that runs and undoes in one go; `MoveCommand` is one step away from that.

And when you don't need it: if you'll never undo, queue or log the actions, a method call is simpler; and if you only need to hand an action to someone else, a lambda (`Runnable`) is usually enough.

> [!key-idea]
> When an action needs to outlive the call (to undo it, repeat it or run it later), turn it into an object.
@describe: Final view: the front desk, the controller, FrontDesk with its history, the three commands and ClassRoster, all inside the Spring context.
