---
title: Composite
summary: A WOD can have rounds inside rounds. Make a single movement and a whole block answer the same questions, and the tree works itself out, however deep it goes.
minutes: 10
level: intermediate
recap:
  intent: Treat a single piece and a group of pieces the same way, so you can build trees as deep as needed and walk them without asking what each node is.
  participants:
    - Component (WorkoutPart), what every node can do, leaf or group
    - Leaf (Movement, Run), a node with no children that answers for itself
    - Composite (Block), a node with children that answers by asking them
    - Client (WodController, WodSummary), which treats any node the same, a single movement or a whole WOD
  pros:
    - The client doesn't tell a piece from a group
    - Trees can be any depth without special code for each level
    - A new kind of leaf is one more class; blocks don't change
  cons:
    - A shared interface can end up too thin or too general if leaves and groups have little in common
    - It's easy to forget limits (depth, size) when the tree comes from outside
    - If the structure is always flat, it's more code than you need
  related:
    - Decorator
    - Iterator
    - Visitor
quiz:
  - q: What does Block.reps() do?
    options:
      - It walks every movement in the WOD with two nested loops
      - It only asks the leaves, because blocks have no reps of their own
      - It multiplies its rounds by the sum of what each child returns
      - It reads the total reps that were stored when the WOD was created
    answer: 2
    explain: Block doesn't know whether each child is a movement, a run or another block. It asks each one for reps() and each answers its own way, so the recursion goes down the tree by itself.
  - q: You want to add a new kind of leaf, Rest. What do you change?
    options:
      - A Rest class implementing WorkoutPart, and its name in @JsonSubTypes for the JSON
      - Block, so it knows how to add rests to the total time
      - Movement and Run, so they know what to do when they follow a rest
      - WodSummary, so it counts rest time separately
    answer: 0
    explain: Block only knows WorkoutPart. A new leaf that answers reps(), seconds() and lines() fits into any block without touching it.
  - q: Murph is a run, 20 rounds of 5, 10 and 15 reps, and another run. What does murph.reps() return?
    options:
      - 30, the reps in a single round of the inner block
      - 20, the number of rounds the inner block has
      - 50, the 20 rounds plus the 30 reps in each one
      - 600, the inner block gives 20 × 30 and the runs, 0
    answer: 3
    explain: Murph asks its three children. The runs say 0 and the 20-round block says 20 × 30 = 600. Murph has a single round, so the total is 600.
  - q: What makes Spring's CompositePropertySource a Composite?
    options:
      - It merges several property files and saves them into a new one
      - It's a PropertySource made of PropertySources, used just like any of them
      - It arranges properties into a folder tree by their prefixes
      - It lets you change properties while the application is running
    answer: 1
    explain: Whoever asks it for a property doesn't know whether they're talking to one source or a group. The group asks its sources in order and answers with the first one that has it; and a group can hold other groups.
---
## @step:problem — The flat WOD
The box's board shows each WOD with its total reps and a time estimate. The first version, `FlatWod`, understands WODs as "N rounds of these movements":

- `reps()` adds up one round's movements and multiplies by the rounds;
- `seconds()` does the same with time.

For Murph (run a mile, 20 rounds of 5 pull-ups, 10 push-ups and 15 air squats, and another mile) someone added two fields: `runBeforeMeters` and `runAfterMeters`.

> [!problem]
> The model has a single level. Every WOD that doesn't fit gets solved with another special field.
@describe: The coach asks WodController for reps(), which calls FlatWod, highlighted in red.

## @step:smell — Helen doesn't fit
Helen is 3 rounds of: run 400 m, 21 kettlebell swings and 12 pull-ups. The run goes **inside** each round, and `FlatWod` has no way to say so: it can only run before or after everything.

You could add another field, `runInsideEachRoundMeters`. And then another one for an EMOM inside an AMRAP. Every new field is another case in `reps()`, in `seconds()` and in any other calculation you add.

> [!warning]
> If your model needs a special field every time something contains something else, what you have is a tree in disguise.
@describe: The diagram doesn't change: FlatWod stays highlighted in red; Helen doesn't fit its single level of rounds.

## @step:component — What everyone can do
Composite starts with the question you'd ask any piece of training, a single movement or a whole WOD. That's `WorkoutPart`:

- `reps()`, the reps;
- `seconds()`, the estimated time;
- `lines()`, how it reads on the board.

It's the pattern's **Component**. The Jackson annotations are only there to receive the tree as JSON, with a `type` field on each node.

> [!key-idea]
> If every node answers the same questions, whoever asks doesn't need to know what kind of node they have in front of them.
@describe: The WorkoutPart interface appears, highlighted, with three classes implementing it: Movement, Run and Block.

## @step:leaf — The leaves
The **leaves** answer for themselves:

- `Movement` (12 pull-ups): 12 reps, 3 seconds each in the estimate.
- `Run` (400 m): 0 reps, at 5 minutes per km.

They have no children and don't know they might be inside a block.
@describe: Movement and Run, highlighted, implement WorkoutPart.

## @step:composite — The block
`Block` is the **Composite**: some rounds of other parts, which may be blocks themselves. To answer, it asks its children:

- `reps()` is its rounds times the sum of each child's reps;
- `lines()` writes its header and, below it, each child's lines indented by two more spaces.

It doesn't ask whether a child is a movement, a run or another block. It's enough that it's a `WorkoutPart`.

> [!key-idea]
> The group answers by asking its children. The recursion comes for free: each level does the same with the next one.
@describe: Block, highlighted, implements WorkoutPart and also holds a list of WorkoutPart: its parts.

## @step:tree — Murph as a tree
Murph no longer needs special fields:

- a "Murph" block of one round,
- with a run, a **20-round** block and another run,
- and inside the 20-round block, the three movements.

Helen is another tree: a 3-round block with the run inside. The same code fits both, and any combination the coach comes up with.
@describe: Murph's tree: Murph, highlighted, contains Run 1600 m, the 20 rounds block, also highlighted, and another Run 1600 m; the 20-round block contains 5 pull-ups, 10 push-ups and 15 air squats.

## @step:request — The question goes down the tree
`GET /api/wods/murph`:

1. `WodController` looks Murph up in the library and asks it for `reps()`, `seconds()` and `lines()`.
2. Murph asks its three children; the 20-round block asks its three movements.
3. The answers come back up: 20 × (5 + 10 + 15) = **600 reps**, about **46 minutes**.

`POST /api/wods/estimate` accepts any tree as JSON. Since it comes from outside, `Block` sets limits when it's built: 1 to 50 rounds, 1 to 10 parts, at most 4 levels and no more than 10,000 reps or 6 hours.

> [!warning]
> A tree coming from the client can be huge or have a great many levels. Validate size and depth when you build it, not when you walk it.
@describe: GET /api/wods/murph travels from the coach to the controller; reps() goes down from WodController to Murph, from Murph to the 20-round block and from there to each movement. The whole tree is highlighted.

## @step:spring-does-it — Spring already does it for you
A `CompositePropertySource` is a `PropertySource`… made of `PropertySource`s. When you ask it for a property, it asks its sources in order and returns the first one that has it. In the example, `downtown` answers the capacity (20) and the minutes fall through to `box-defaults` (60). And since it's just another `PropertySource`, it can go inside another one.

There's more in Spring: `HandlerMethodArgumentResolverComposite` is an argument resolver made of resolvers, `CompositeCacheManager` brings several cache managers together, and in Actuator, `/actuator/health` is a tree of health indicators.

> [!spring]
> When you see `Composite` in a Spring class name, it's almost always this: an object that implements the same interface as the ones it holds.
@describe: Inside the Spring context, CompositePropertySource, highlighted, asks downtown for the capacity (20) and box-defaults for the minutes (60).

## @step:recap — Recap
You started with a flat WOD full of special fields and ended up with:

- **A Component**, `WorkoutPart`, with the questions you'd ask any part.
- **Leaves**, `Movement` and `Run`, that answer for themselves.
- **A Composite**, `Block`, that answers by asking its children.
- **Limits** when building trees that come from outside.

Here the parts are given when the block is created and can't be added later. Other versions of the pattern put `add()` and `remove()` on the group, or even on the shared interface; it's a trade-off between convenience and safety.

And when you don't need it: if the structure always has the same shape and the same depth, a class with its fields is clearer.

> [!key-idea]
> When something can contain things of its own kind, make the group and the piece answer the same way.
@describe: Final view: the coach, the controller and Murph's tree, all inside the Spring context.
