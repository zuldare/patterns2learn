---
title: Interpreter
summary: Coaches write WODs in their own notation, like "3 x (10 burpees + 15 air-squats)". Turn each rule of that notation into a class and let the tree interpret itself.
minutes: 12
level: advanced
recap:
  intent: For a small language, represent each rule of its grammar with a class; a sentence becomes a tree of those objects, and each one knows how to evaluate itself.
  participants:
    - AbstractExpression (WodExpression), the interpret() operation every rule shares
    - TerminalExpression (Movement), a rule that contains no others, like "10 burpees"
    - NonterminalExpression (Sequence, Repeat), rules that contain other expressions, like "a + b" or "3 x ( … )"
    - Context (Tally), where the expressions leave the result
    - Client (WodController, with WodParser), builds the tree and asks it to interpret itself
  pros:
    - Each rule is a small class, easy to read and test
    - Adding a new rule is adding a class (and a case in the parser)
    - It works the same at any depth, because the tree walks itself
  cons:
    - With big grammars, that's a lot of classes; there a parser generator like ANTLR pays off
    - A new operation (like validating or printing) means touching every class
    - Walking a tree of objects is slower than an optimised interpreter
  related:
    - Composite
    - Visitor
    - Iterator
quiz:
  - q: In "2 x (5 pull-ups + 10 burpees)", what is a terminal expression?
    options:
      - The "2 x ( … )" that repeats the rounds
      - The "+" that joins both movements
      - The "10 burpees", which contains nothing else
      - The parenthesis that closes the round
    answer: 2
    explain: A terminal contains no other expressions. Repeat and Sequence do contain them, so they're nonterminals.
  - q: Coaches want to write "21-15-9 thrusters". What do you change?
    options:
      - One more if in Movement's interpret()
      - A new expression and its rule in the parser
      - The Tally, so it can count ladders
      - Nothing, the parser already understands it
    answer: 1
    explain: Each grammar rule is a class. A rep ladder is a new rule, with its expression and its method in the parser; the other classes don't change.
  - q: Why does Repeat pass factor × times to its body instead of adding itself?
    options:
      - Because Repeat has no access to the Tally
      - Because that way it runs in parallel
      - Because the parser won't let it touch the Tally
      - So nested rounds multiply on their own
    answer: 3
    explain: Each level multiplies the factor it gets. "2 x (3 x (5 pull-ups))" reaches Movement with factor 6, without anyone counting levels.
  - q: What makes a Spring SpEL expression an Interpreter?
    options:
      - It's parsed into a tree of nodes that evaluate themselves
      - It's compiled to bytecode before every call
      - It's translated to SQL and run in the database
      - It's kept as text and evaluated with regular expressions
    answer: 0
    explain: parseExpression() builds a tree (OpPlus, OpMultiply, property references…), and each node works out its value by asking its children.
---
## @step:problem — Tricks with the text
Coaches write WODs in their own notation: "3 x (10 burpees + 15 air-squats)". The app has to know how many reps of each movement that adds up to.

The first version, `SplitCounter`, uses a regular expression to strip one "N x ( … )" and splits the rest on the "+". With one round it works: 30 burpees and 45 air-squats.

> [!problem]
> The text has structure (rounds inside rounds), but the code treats it as a flat string.
@describe: SplitCounter, highlighted in red, gets "3 x (10 burpees + …)" from the controller and chops it up with regular expressions.

## @step:smell — Nesting gets lost
"2 x (3 x (5 pull-ups) + 10 burpees)". The regular expression strips the outer round, splits on "+" and finds "3 x (5 pull-ups)", which doesn't match "N movement". It skips it **without a word**: 20 burpees and no pull-ups. The `SplitCounterTest` test proves it.

Fixing it with more regular expressions never ends: every level of nesting is another case.

> [!warning]
> A notation with nesting is a grammar. Handling it by chopping text fails exactly where the grammar is recursive.
@describe: The nested round "3 x (5 pull-ups)", highlighted in red, doesn't match the pattern and gets lost; only the burpees are left.

## @step:expression — One class per rule
Interpreter turns each rule of the notation into a class. They all share the `WodExpression` interface, with a single method: `interpret(tally, factor)`.

The interface is `sealed`: the rules are exactly three, `Movement`, `Sequence` and `Repeat`.

> [!key-idea]
> The grammar stops hiding in text-chopping code: each rule is a type.
@describe: The WodExpression interface appears, highlighted, with two of the rules implementing it: Repeat and Movement.

## @step:terminal — The smallest rule
`Movement` is a **terminal expression**: "10 burpees" contains no other expressions. When interpreted, it adds its reps, multiplied by the factor, to the `Tally`.

The `Tally` is the pattern's **context**: the place where the expressions leave the result.
@describe: The tree's two leaves, Movement 10 burpees and Movement 15 air-squats, highlighted; the first adds its reps to the Tally.

## @step:repeat — Rules that contain others
`Repeat` ("3 x ( … )") and `Sequence` ("a + b") are **nonterminal expressions**: they contain others. `Sequence` interprets its parts one after another. `Repeat` interprets its body with the factor multiplied by its rounds.

So in "2 x (3 x (5 pull-ups))" the movement gets factor 6 without anyone counting levels.
@describe: Repeat 3 x, highlighted, passes Sequence the factor multiplied by 3.

## @step:tree — A sentence is a tree
"3 x (10 burpees + 15 air-squats)" is this tree: a `Repeat` of 3 with a `Sequence` inside, and two `Movement`s as leaves. The test builds it by hand and interprets it: 75 reps.

The shape is a **Composite**'s: leaves and nodes that contain nodes, all with the same operation.
@describe: The whole tree highlighted: Repeat calls Sequence with factor 3 and Sequence calls its two movements.

## @step:parser — From text to tree
Nobody writes trees by hand: `WodParser` turns the text into the tree. It has one method per grammar rule (`sequence` and `term`), and each one calls itself where the grammar is recursive.

If the text is wrong, it says where: "expected ')' at position 15". And it sets limits: 200 characters, 5 levels of rounds and 100,000 reps.

With the tree, the case that broke the earlier version works: "2 x (3 x (5 pull-ups) + 10 burpees)" gives 30 pull-ups and 20 burpees, and no class knows how deep it is.

> [!key-idea]
> The original pattern doesn't include the parser: it describes the tree and how it's interpreted. Building it is another problem, solved here with a few lines of recursive descent.
@describe: WodParser, highlighted, turns "3 x (…)" into the expression tree.

## @step:request — Over HTTP
`POST /api/wods/totals` with the nested WOD answers the totals per movement and the 50 reps. A badly written notation answers 400 with the error's position.
@describe: POST /api/wods/totals travels from the coach to the controller, which hands the text to WodParser and interprets the tree with a new Tally; WodParser and Tally are highlighted.

## @step:spring-does-it — Spring already does it for you
SpEL, Spring's expression language (the one in `@Value("#{...}")`, `@PreAuthorize` or `@Cacheable(condition = ...)`), is an Interpreter. `parseExpression("reps * rounds + 10")` builds a tree of nodes: an `OpPlus` with an `OpMultiply` and a literal inside. When evaluating, each node works out its value by asking its children.

The test evaluates the expression with `SimpleEvaluationContext`, which only allows reading properties. Never evaluate SpEL coming from outside with the full context: it can call any class.

> [!spring]
> Every time you write `#{...}` in an annotation, Spring parses the text into an expression tree and interprets it. It's the same pattern, with a much bigger grammar.
@describe: The SpEL tree for "reps * rounds + 10": SpelExpressionParser creates OpPlus, highlighted, which holds OpMultiply, also highlighted, with reps and rounds, and the literal 10.

## @step:recap — Recap
You started chopping text with regular expressions and ended up with:

- **An abstract expression**, `WodExpression`, with `interpret()`.
- **A terminal**, `Movement`, and **two nonterminals**, `Sequence` and `Repeat`.
- **A context**, `Tally`, where the result builds up, and a parser that builds the tree.

Its neighbours: the structure is a **Composite**; if you need many different operations over the tree (counting, validating, printing), a **Visitor** takes them out of the classes. And an **Iterator** can walk the tree without interpreting it.

When not to use it: if the grammar is big or changes a lot, a parser generator (ANTLR) or an existing language (SpEL, JSON with a schema) saves you writing dozens of classes. And if there's no nesting, there's no grammar to model: splitting the text is enough.

> [!key-idea]
> When a text has rules that nest, turn it into a tree and let each node know how to evaluate itself.
@describe: Final view: the coach, the controller, WodParser, the tree of Repeat, Sequence and both movements, and the Tally, all inside the Spring context.
