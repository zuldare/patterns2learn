---
title: Prototype
summary: The coach doesn't program each week from scratch, but copies a template and changes one day. Make each object know how to copy itself completely, so editing the copy never touches the original.
minutes: 9
level: beginner
recap:
  intent: Create new objects by copying an existing one that serves as a model, and let the object itself know how to be copied.
  participants:
    - Prototype (WeekProgram, DayPlan), which declare copy() and know how to copy themselves
    - Prototype registry (ProgramLibrary), which keeps named templates and only hands out copies
    - Client (WeekService), which asks for a copy and customises it
  pros:
    - Creating a week like another is copying and changing what differs
    - Each class knows how to copy itself; nobody outside needs to know its fields
    - Templates don't get spoiled, because only copies go out
  cons:
    - Deep copying needs every mutable piece to know how to copy itself, and it's easy to miss one
    - With cross-references or cycles, copying properly gets complicated
    - Java's clone() is shallow and clumsy; a copy() of your own is almost always better
  related:
    - Abstract Factory
    - Memento
    - Composite
quiz:
  - q: With ShallowCopyService, why did editing Week 47's Wednesday also change the previous week?
    options:
      - Because WeekProgram kept the days in a static field
      - Because Spring injected the same week in both places
      - Because the list was new, but the days inside it were the same objects
      - Because rename() also modified the original week
    answer: 2
    explain: new ArrayList<>(lastWeek.days()) copies the list, not the DayPlans it holds. Both weeks pointed at the same Wednesday.
  - q: Who knows how a DayPlan is copied?
    options:
      - The DayPlan itself, with its copy() method
      - ProgramLibrary, which knows each day's fields
      - The controller, which receives the JSON with the movements
      - WeekService, which is the one storing the weeks
    answer: 0
    explain: Each class copies itself. WeekProgram.copy() asks each day for its copy, so if DayPlan gains a field, only DayPlan changes.
  - q: What does Spring's prototype scope do every time you ask for the bean?
    options:
      - It clones the last instance it handed out
      - It always returns the same instance, like a singleton
      - It copies the original object with Object.clone()
      - It creates a new object from the bean's definition
    answer: 3
    explain: Despite the name, it doesn't copy any object. It builds a new one each time, with its constructor and dependencies, from the definition.
  - q: If WeekProgram and DayPlan were immutable, what would happen to copy()?
    options:
      - It would have to be even deeper
      - It would no longer be needed, because sharing what never changes is safe
      - You'd have to implement Cloneable no matter what
      - You'd have to declare both classes with prototype scope
    answer: 1
    explain: The problem with a shallow copy is someone changing something shared. If nothing can change, sharing is free and safe; "changing" would mean creating a new object.
---
## @step:problem — Copying last week
Every week, the coach starts from a template ("Strength block") or from the previous week and changes some day. The first version, `ShallowCopyService`, copies the week from outside: it creates a new week with a **new list of days**.

But the days in that list are **the same objects**. When the coach changes Week 47's Wednesday to front squats, the previous week's Wednesday changes too. The `ShallowCopyServiceTest` test proves it.

> [!problem]
> A shallow copy creates a new container with the same pieces inside. Editing a piece affects both copies.
@describe: ShallowCopyService, highlighted in red, creates Week 47 with a new list but the same days; editing Wednesday from Week 47 edits the template's, also highlighted.

## @step:smell — Copying from outside
On top of that, whoever copies has to know what the week looks like inside: which fields it has and which ones must be copied deeply. If tomorrow `DayPlan` gains a mutable field (the coach's notes, say), every place that copies weeks has to be remembered and touched.

> [!warning]
> If copying an object means knowing its insides, copying should be the object's own job.
@describe: The diagram doesn't change: ShallowCopyService stays highlighted in red, copying from outside.

## @step:prototype — Each object knows how to copy itself
Prototype puts the copy inside the object: `WeekProgram.copy()` creates a new week and, for each day, asks it for **its** copy.

Whoever needs a week like another just does `template.copy()` and changes what's needed. They don't know what fields a week has or what must be copied deeply.

> [!key-idea]
> The object that serves as a model is the one that knows how to make copies of itself.
@describe: The Strength block template and Week 47, highlighted: copy() creates the new week from the template.

## @step:day-copy — The copy goes all the way down
`DayPlan.copy()` creates a new day with **its own list** of movements (the constructor copies it). So the copy is deep at every level: a new week, new days, new lists.

Java has `Object.clone()`, but it's shallow by default, forces you to implement `Cloneable` and has odd rules. A `copy()` method (or a copy constructor) is clearer.
@describe: Week 47's Wednesday, highlighted, has its own list of movements.

## @step:registry — Named templates
`ProgramLibrary` keeps the **prototypes** by name: "strength-block" and "deload-week". To create a week, it copies the template and renames it: `prototype(template).copy().rename(name)`.

Templates never leave the library: even to show one, it hands out a copy. That way nobody can spoil them by accident.
@describe: ProgramLibrary, highlighted, looks up "strength-block" and creates Week 47 with copy().rename("Week 47").

## @step:deep — Edit the copy, without fear
The test does what used to fail: it creates Week 47 from "strength-block", changes its Wednesday and checks that the template still has back squats and Helen. Other tests check that changing a copy of the template doesn't touch the original either.
@describe: The template's Wednesday and Week 47's, highlighted, are now different objects: editing one doesn't change the other.

## @step:request — Through the API
1. `POST /api/weeks` with `template: "strength-block"` and `name: "Week 47"`: 201 and the new week.
2. `PUT /api/weeks/{id}/days/Wed` with the new movements.
3. `GET /api/templates/strength-block`: the template is unchanged.

Templates or weeks that don't exist give 404; an empty name or a day with no movements, 400.
@describe: POST /api/weeks travels from the coach to the controller, create() to WeekService and newWeek() to ProgramLibrary, which copies the template into Week 47; WeekService and Week 47 are highlighted.

## @step:spring-does-it — Spring already does it for you
Careful with the name: Spring's **`prototype`** scope doesn't copy any object. Every time you ask for the bean, it creates a **new** one from its definition, with its constructor and dependencies.

Where Spring does use the Prototype idea is in the **bean definitions** themselves: `cloneBeanDefinition()` returns a copy of a definition that you can change (its scope, say) without touching the original. And when combining a child definition with its parent's, Spring starts from a copy of the parent's and applies the child's changes.

> [!spring]
> The example test does both: it clones a definition and changes its scope leaving the original intact, and it checks that a `prototype` bean is built anew each time instead of being copied.
@describe: Inside the Spring context, a singleton BeanDefinition is cloned with cloneBeanDefinition() into a copy with prototype scope, highlighted.

## @step:recap — Recap
You started with a shallow copy that shared the days and ended up with:

- **Objects that know how to copy themselves**, `WeekProgram` and `DayPlan`, deeply.
- **A prototype registry**, `ProgramLibrary`, that only hands out copies.
- **A client** that copies and customises without knowing a week's insides.

Don't mix it up with its neighbours: **Abstract Factory** creates families of objects with classes; Prototype creates objects by copying a model, and sometimes a factory keeps prototypes and copies them. **Memento** also copies state, but to be able to go back, not to create new objects.

And when you don't need it: if the objects are immutable, sharing them is safe and there's nothing to copy; and if building one from scratch is just as easy, a constructor or a builder is enough.

> [!key-idea]
> When creating an object like another is easier by copying than by building, let the original know how to copy itself, completely.
@describe: Final view: the coach, the controller, WeekService, ProgramLibrary, the template and Week 47 with their Wednesdays, all inside the Spring context.
