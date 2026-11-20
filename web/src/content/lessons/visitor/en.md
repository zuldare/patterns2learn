---
title: Visitor
summary: A WOD mixes lifts, gymnastics and cardio, and every so often a new question about it shows up (equipment, calories, scaling…). Put each operation in its own object, without touching the element classes.
minutes: 11
level: advanced
recap:
  intent: Move the operations on a stable group of classes into separate objects, so new operations can be added without touching those classes.
  participants:
    - Visitor (WorkoutVisitor), with one visit method per element type
    - ConcreteVisitor (EquipmentVisitor, CalorieVisitor), one operation each
    - Element (WorkoutElement), which accepts visitors with accept()
    - ConcreteElement (Lift, Gymnastics, Cardio), which call the visit for their type
    - Object structure (Workout), which walks its elements for any visitor
  pros:
    - A new operation is a new class; the elements don't change
    - All of an operation's code is together, not spread across the elements
    - The visitor can build up a result as it walks
  cons:
    - A new element type means touching the interface and every visitor
    - accept() and the double call take some reading the first time
    - The elements have to expose what the visitors need
    - A visitor accumulates, so each walk needs a new one
  related:
    - Composite
    - Iterator
    - Strategy
quiz:
  - q: You want to add a new operation, scaling each element. What do you change?
    options:
      - A scaling() method in Lift, Gymnastics and Cardio
      - One more instanceof in every existing analysis
      - A ScalingVisitor class; the elements don't change
      - A scale() method in Workout that walks the elements
    answer: 2
    explain: Each operation is a visitor. ScalingVisitor implements the three visits and neither Lift, Gymnastics nor Cardio notices.
  - q: And if what you add is a new element type, Rest?
    options:
      - Add visitRest to the interface and to every visitor
      - Only create the Rest class with its accept()
      - Only add Rest to permits and @JsonSubTypes
      - Create a RestVisitor that handles the rests
    answer: 0
    explain: That's the pattern's price. Adding operations is easy; adding element types means touching every visitor. That's why it fits when the types rarely change.
  - q: What is accept() for on each element?
    options:
      - To validate the element's data before it's used
      - So the element stores the operation's result
      - To register the element with the visitor before walking
      - To call the visit for its type, without instanceof
    answer: 3
    explain: Lift.accept(v) calls v.visitLift(this). The element picks which method gets called (visitLift) and the visitor's real class picks which implementation runs; that double call replaces the instanceof.
  - q: With a sealed interface and a switch with no default, what happens if you add Rest?
    options:
      - It works the same, and Rest adds zero calories
      - The switch stops compiling until you add the Rest case
      - An exception is thrown the first time a Rest arrives
      - You have to restart the application for it to notice
    answer: 1
    explain: The compiler knows every type of a sealed interface and checks that the switch covers them. It's a net similar to Visitor's, even stricter (though a stale class that wasn't recompiled would throw MatchException when a Rest arrives).
---
## @step:problem — Questions about a WOD
A WOD has elements of three types: **lifts** (deadlift, 100 kg × 15), **gymnastics** (30 burpees) and **cardio** (1000 m row). And the box keeps asking more questions about it: what equipment to set out, how many calories it burns, how to scale it…

The first version, `InstanceofAnalyzer`, answers each question with its own chain of `instanceof`: "is it a lift? is it gymnastics?…".

> [!problem]
> Every operation asks each element again what it is, and does it its own way.
@describe: InstanceofAnalyzer, highlighted in red, asks each element whether it's a Lift or Gymnastics.

## @step:smell — Cardio got left out
Cardio came later. It was added to the equipment list, but in the calories chain **nobody remembered** to add it: a 1000 m row counts as 0 kcal, with no error or warning. The `InstanceofAnalyzerTest` test makes it plain.

Every new operation is one more chain to keep up to date, and the compiler doesn't warn when a case is missing.

> [!warning]
> When several operations repeat the same `instanceof` over the same family of classes, forgetting a case is only a matter of time.
@describe: InstanceofAnalyzer, in red, and Cardio, highlighted: cardio's calories come out as 0 because its case doesn't exist.

## @step:visitor — One method per type
Visitor defines an interface with **one method per element type**: `visitLift`, `visitGymnastics`, `visitCardio`, and `result()` to collect the result.

Each operation is a class that implements it. And since all three methods must be implemented, the compiler no longer lets you forget one.

> [!key-idea]
> Each operation becomes an object, with a method for each element type.
@describe: The WorkoutVisitor interface appears, highlighted, with EquipmentVisitor and CalorieVisitor implementing it, next to the three element types.

## @step:accept — Each element calls its method
How does the visitor know what type of element it has without asking? It doesn't: the element tells it. Each one implements `accept(visitor)` by calling its own method: `Lift` calls `visitLift(this)`.

It's a **double call**: the element's real class decides which method gets called (`visitLift`), and the visitor's real class decides which implementation runs. Together they replace the `instanceof`.
@describe: Lift, highlighted together with EquipmentVisitor, calls it with visitLift(this).

## @step:equipment — One operation, one class
`EquipmentVisitor` gathers everything there is to know about equipment: barbell and plates for lifts, a pull-up bar if there are pull-ups or toes-to-bar, rower, bike or ski by machine.

`Workout` walks its elements and calls `accept` with the visitor; at the end it asks for `result()`.
@describe: Workout calls accept(v) on each element; Lift answers EquipmentVisitor, highlighted, which notes barbell and plates.

## @step:new-operation — Another operation, nothing touched
`CalorieVisitor` is another class with its three methods. Adding it didn't touch `Lift`, `Gymnastics`, `Cardio` or `Workout`. And the row can't be left out any more: without `visitCardio`, it doesn't compile.

> [!key-idea]
> With Visitor, adding operations is cheap. Adding element types is expensive: every visitor needs its new method.
@describe: CalorieVisitor, highlighted, gets visitGymnastics and visitCardio from the elements.

## @step:sealed — In modern Java
Since Java 21, a `sealed` interface and a `switch` with patterns give a similar safety net with less ceremony: the compiler knows every possible type and, if the `switch` has no `default`, it won't compile until you cover them all.

`PatternMatchingCalories` works out the same as `CalorieVisitor`, and a test checks it. In fact, in this code a `switch` over the `sealed` interface would have been enough not to forget cardio.

When does Visitor still pay off? When the hierarchy isn't `sealed` (or you can't use Java 21), when you want the operation to be an object you inject, pass around or swap, and when the structure drives the walk (a tree, a Composite) and the visitor receives each node.
@describe: The three element types, highlighted: a switch over the sealed interface covers them all.

## @step:request — The analysis through the API
`POST /api/wods/analysis` with the WOD as JSON (a `type` field per element):

1. Jackson creates `Lift`, `Cardio` and `Gymnastics`, which validate their data.
2. The controller runs a new `EquipmentVisitor` and a new `CalorieVisitor` over the `Workout` (new because a visitor accumulates: reusing one would add everything twice).
3. The answer brings the equipment (barbell and plates, rower) and an estimated 102 kcal.

An element that breaks the rules, like a machine that doesn't exist, returns 400 with the reason.
@describe: POST /api/wods/analysis travels from the coach to the controller, which runs two visitors over Workout; Cardio accepts and CalorieVisitor adds 60 kcal. Workout and both visitors are highlighted.

## @step:spring-does-it — Spring already does it for you
A bean definition has many parts: the class name, the properties, the constructor arguments, nested beans and collections… `BeanDefinitionVisitor` walks all of them and runs every text value through a resolver.

That's what Spring uses to replace the `${...}` in bean definitions (`PropertySourcesPlaceholderConfigurer` does it, through `PlaceholderConfigurerSupport`). In the test, `${coach}` becomes "Ana" and `${city}`, "Madrid". `@Value("${...}")` on fields, on the other hand, is resolved at injection time, not by this visitor.

It's a "loose" Visitor: the definition has no `accept()` and there's no double call, and there's a single walker; the operation you plug in is the resolver.

> [!spring]
> The operation (resolving placeholders) lives outside the definition. Walking the structure is the visitor's job, and what to do with each value is the resolver's you hand it.
@describe: Inside the Spring context, BeanDefinitionVisitor, highlighted, walks the definition: ${coach} becomes Ana and ${city} Madrid.

## @step:recap — Recap
You started with `instanceof` chains that forgot cardio and ended up with:

- **One visitor per operation**, with a method for each element type.
- **`accept()` on each element**, calling its method without asking.
- **New operations without touching the elements**, and forgotten cases that don't compile.
- **The modern alternative**: `sealed` and `switch` with patterns.

Don't mix it up with its neighbours: **Iterator** walks the elements; Visitor says what to do with each type. **Composite** arranges elements in a tree, and a visitor can walk all of it. A **Strategy** changes *how* an operation is done; a visitor is a new operation over every type.

And when you don't need it: if element types change often, every new type means touching every visitor; and if there are few, simple operations, a method on each element or a `switch` over a `sealed` interface is more direct.

> [!key-idea]
> When the types are stable and the operations keep growing, put each operation in its own object.
@describe: Final view: the coach, the controller, Workout, the three elements, both visitors and WorkoutVisitor, all inside the Spring context.
