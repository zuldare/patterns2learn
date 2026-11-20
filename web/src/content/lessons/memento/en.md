---
title: Memento
summary: The coach drafts the whiteboard WOD and sometimes wipes what she shouldn't. Save snapshots of the draft without opening its fields to anyone, and undo by going back to the last one.
minutes: 9
level: intermediate
recap:
  intent: Save an object's state in an opaque snapshot so you can go back to it later, without whoever keeps it having to know or touch the inner details.
  participants:
    - Originator (WhiteboardDraft), creates the snapshot and knows how to restore itself from it
    - Memento (WhiteboardDraft.Snapshot), the frozen copy; only the originator reads what's inside
    - Caretaker (DraftHistory), keeps snapshots and hands them back without looking inside
  pros:
    - The draft keeps its fields private; nobody else needs getters or setters
    - A new field goes into the snapshot in one place, without touching the history
    - Undo any change, even those with no inverse operation (wiping the board)
  cons:
    - Every snapshot is a copy; with big states or many steps, it costs memory
    - You have to bound the history and decide when to save
    - If the object points to other mutable objects, the copy has to be deep or share only immutable things
  related:
    - Command
    - Prototype
    - Iterator
quiz:
  - q: Who can read a Snapshot's fields?
    options:
      - Only WhiteboardDraft
      - DraftHistory, to choose which one to hand back
      - Any class in the same package
      - The controller, to show it in the API
    answer: 0
    explain: Snapshot's fields and constructor are private, and Java lets the enclosing class (WhiteboardDraft) read them. The history only keeps it and hands it back.
  - q: You add a "scaling" field to the draft. What do you touch so undo brings it back?
    options:
      - DraftHistory, so it saves the scaling too
      - The controller, so it copies the scaling before editing
      - Snapshot, snapshot() and restore(), inside WhiteboardDraft
      - Nothing; Java copies new fields on its own
    answer: 2
    explain: The snapshot is the originator's business. In the earlier version the editor had to remember every field, and it forgot the time cap.
  - q: Why does DraftService take the snapshot before editing but save it after?
    options:
      - Because the history doesn't accept snapshots before the edit
      - So a refused edit doesn't leave a step that undoes nothing
      - Because snapshot() only works on an already validated draft
      - So the snapshot already includes the edit's changes
    answer: 1
    explain: If edit() throws an InvalidDraftException, save() is never reached and the history doesn't change. Undoing later doesn't "undo" something that never happened.
  - q: How is a transaction savepoint like a Memento?
    options:
      - It saves a copy of the transaction's connection
      - It lets you read the rows that were there at that moment
      - It copies the whole table to memory before changing it
      - It's an opaque marker that's only good for going back to it
    answer: 3
    explain: createSavepoint() returns something typed as Object, so your code isn't meant to look inside; you just hand it back to rollbackToSavepoint(). The one that knows what it means is the database.
---
## @step:problem — Undo from outside
The coach drafts the day's WOD: title, movements and time cap. If she makes a mistake and wipes the board, she wants to undo.

The first version opens every field of the draft with getters and setters, and it's `ExposedDraftEditor` that, before wiping, copies into its own variables what it thinks is needed.

> [!problem]
> To save the state from outside, the draft has to show its guts, and whoever saves it has to know them all.
@describe: ExposedDraftEditor reads getTitle() and getMovements() from ExposedDraft, which exposes all its fields; both are highlighted.

## @step:smell — The field nobody copied
The editor copied the title and the movements… but not the time cap. Wiping leaves a blank board with the default cap, 20 minutes, and on undo "Fran" and its movements come back… with 20 minutes instead of 10. The `ExposedDraftEditorTest` test proves it.

And every new field of the draft is one more place to remember, outside the class that owns it.

> [!warning]
> When an object's state is copied by others, every new field is a chance to forget one.
@describe: ExposedDraftEditor, highlighted: it saves the title and movements, but the time cap is left uncopied.

## @step:memento — The snapshot, sealed
With Memento, the one copying the state is the draft itself. `snapshot()` creates a `Snapshot` with every field, and `restore()` puts them back.

`Snapshot` is a nested class with **private** fields and constructor: nobody outside `WhiteboardDraft` can create or read it. The list is copied with `List.copyOf`, so the snapshot doesn't change even if the draft keeps changing.

(One nuance: in Java privacy is per class, not per object, so any `WhiteboardDraft` could read another one's snapshot. Here there's a single draft; with several, the snapshot could store who created it and check it.)

> [!key-idea]
> The object saves itself in a sealed box. Others can carry the box around, but not open it.
@describe: WhiteboardDraft and a Snapshot, highlighted: the draft calls snapshot() and gets its frozen copy.

## @step:caretaker — The history doesn't look inside
`DraftHistory` is the **caretaker**: it keeps snapshots on a stack and hands back the last one on undo. It never looks at what's inside, and it couldn't.

It has a maximum size (20 by default): when it's full, the oldest falls off. With no history, undo answers "nothing to undo". There's no redo here: that would take a second stack with the undone snapshots.
@describe: DraftHistory, highlighted, stacks snapshots with push() and hands back the last one with pop().

## @step:service — When it saves
`DraftService` joins the two pieces. To edit, it first takes the snapshot, then edits, and only then saves it: if the edit isn't valid, the history doesn't change.

To undo, it asks the history for the last snapshot and hands it back to the draft with `restore()`. The service is `synchronized` because the draft and the history are state shared between requests. (An edit that changes nothing still saves a step; comparing first would avoid it, but here we keep it simple.)
@describe: DraftService, highlighted, calls snapshot() and edit() on the draft and save() on the history.

## @step:undo — Everything comes back, the forgotten too
The test does the same as the earlier version: save, wipe the board and undo. This time the title, the movements **and** the 10-minute time cap come back. `snapshot()` could forget a field too, of course; what changes is that the slip would now sit next to the fields, in the same class, not scattered outside.

If tomorrow the draft gets a new field, it goes into `Snapshot`, `snapshot()` and `restore()`, all three inside the same class. The history never notices.
@describe: WhiteboardDraft and the Snapshot, highlighted: restore() brings the draft back to the saved state.

## @step:request — Undo over HTTP
`DELETE /api/draft` wipes the board, leaving it blank with 20 minutes (and saves the snapshot first). `POST /api/draft/undo` brings it back: "Fran" returns with its 10 minutes.

An edit with a 0 time cap answers 400 and saves nothing; undo with no history answers 409 "nothing to undo".
@describe: POST /api/draft/undo travels from the coach to the controller, then undo() to the service, which asks the history for the snapshot and restores it in the draft; DraftService and DraftHistory are highlighted.

## @step:spring-does-it — Spring already does it for you
Inside a transaction, `TransactionStatus.createSavepoint()` creates a **savepoint**: a marker of what your transaction had done up to that point (it doesn't undo what others commit). It's typed as `Object`, so your code isn't meant to look inside; you just hand it back to `rollbackToSavepoint()`.

In the test, Ana logs 70 kg, the savepoint is created, someone types 700 by mistake and it goes back to the savepoint: one row is left, and the transaction is still alive. With a JDBC transaction manager, it's what `Propagation.NESTED` uses underneath.

> [!spring]
> The savepoint is a memento: the caretaker (your code) keeps it and hands it back, and only the originator (the database, through the transaction manager) knows what it means.
@describe: TransactionStatus, highlighted, creates a savepoint, also highlighted, and then goes back to it after a wrong insert into the pr table.

## @step:recap — Recap
You started with an editor copying fields from outside and ended up with:

- **An originator**, `WhiteboardDraft`, that takes and restores its own snapshots.
- **A memento**, `Snapshot`, sealed: nobody else reads it.
- **A caretaker**, `DraftHistory`, that keeps and hands back without looking.

Its neighbours: a **Command** undoes with an inverse operation (giving back the spot you booked); Memento fits when that inverse doesn't exist or is tricky, and a command often keeps a memento to be able to undo itself. **Prototype** copies an object too, but to create another one, not to go back. And an **Iterator** can use a memento to remember where it was.

When not to use it: if the state is huge and changes little, saving only the changes (or the inverse operation) is cheaper than copying it whole. And if the object is already immutable, you don't need Memento: keeping the reference is keeping the snapshot.

> [!key-idea]
> Let each object save itself. The others just carry the box.
@describe: Final view: the coach, the controller, DraftService, the draft and the history with its two snapshots, all inside the Spring context.
