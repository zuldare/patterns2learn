---
title: Template Method
summary: Importing results from a CSV or from a partner's app is the same process with one different step. Fix the skeleton once and let each format fill in only its own part.
minutes: 11
level: beginner
recap:
  intent: Define the skeleton of an algorithm in one method and let subclasses redefine only some steps, without changing the order or the rest.
  participants:
    - AbstractClass (ResultImporter), with the template method importAll() and the shared steps
    - Abstract steps (parse), which every subclass must implement
    - Hooks (afterImport), optional steps that do nothing by default
    - ConcreteClass (CsvResultImporter, JsonResultImporter), which only fill in what varies
  pros:
    - Shared rules (validate, save, report) are written once
    - A new format is a subclass with a single required method
    - The order of the steps is guaranteed, because the template method is final
  cons:
    - It relies on inheritance, so the subclass is tied to the base class
    - With many hooks it's hard to follow what runs and when
    - If the variation grows a lot, a strategy or a callback usually fits better
  related:
    - Strategy
    - Factory Method
quiz:
  - q: Why is importAll() marked final?
    options:
      - Because Java doesn't allow overriding public methods
      - To make it faster
      - Because Spring can't create beans from classes with overridable methods
      - So no subclass can skip validation or change the order of the steps
    answer: 3
    explain: The whole point of the pattern is that the skeleton doesn't change. With final, a subclass can only touch the steps the base class offers (parse and the hook), never the algorithm itself.
  - q: When you call JdbcTemplate.query(), which part do you write?
    options:
      - The connection, the statement and closing resources
      - The SQL query and how to turn one row into an object (the RowMapper)
      - Translating SQLException into Spring exceptions
      - The loop over the ResultSet
    answer: 1
    explain: JdbcTemplate fixes all the repetitive work (open, execute, iterate, close, translate errors) and only asks you for the variable part. It's the Template Method idea, but the variable step comes in as a callback instead of through inheritance.
  - q: What is a hook in Template Method?
    options:
      - A step with a default (often empty) implementation that subclasses may override if they need to
      - An abstract step every subclass must implement
      - A Spring event listener
      - The final method that defines the order
    answer: 0
    explain: A hook is optional. Here afterImport() does nothing by default; JsonResultImporter overrides it to keep the partner's last report, and CsvResultImporter never notices.
  - q: How does Template Method differ from Strategy?
    options:
      - Template Method is only for importing files
      - Strategy needs abstract classes and Template Method needs interfaces
      - Template Method varies steps of one algorithm through inheritance; Strategy swaps the whole algorithm through composition
      - They don't differ
    answer: 2
    explain: In Template Method the base class owns the flow and the subclass fills in the gaps. In Strategy the object delegates the whole algorithm to another object you can swap at runtime.
---
## @step:problem — Two importers, the same code
The box gets results from two places. Coaches upload a CSV after each class, and a partner's app sends them as JSON.

Each format has its own importer, written start to finish: read, turn every row into a `Result`, validate, save and count. Notice that **only the first step** depends on the format; the rest is identical.

> [!problem]
> The same process is copied into two classes. Every change to the rules has to be made twice.
@describe: The coach sends results.csv to ResultImportController. Next to it are CopyPasteCsvImporter and CopyPasteJsonImporter, both highlighted, and both save into ResultRepository.

## @step:smell — The fix that reached only one copy
Someone added a rule: a score must be greater than 0. They put it in the CSV importer… and forgot the JSON one.

The partner sends a result with `score: 0`. The JSON importer doesn't check it, and only the database's `CHECK` constraint stops it, with an ugly error instead of a clean rejection.

> [!warning]
> Duplicated code isn't just longer, it drifts apart. Sooner or later one copy has a fix the other doesn't.
@describe: The partner app sends score: 0 to the controller, which passes it to CopyPasteJsonImporter, highlighted; the INSERT into ResultRepository fails.

## @step:template — A skeleton nobody touches
Template Method moves the process into a base class, `ResultImporter`, whose `importAll()` method fixes the steps and their order:

1. `parse(payload)`, the part that **varies** with the format.
2. Validate every result, with the rule written **only once**.
3. Save the valid ones and note the rejected ones.
4. `afterImport(report)`, an optional step.

`importAll()` is `final`: no subclass can skip validation or change the order. And the save loop runs inside a `TransactionTemplate`: either every valid row is saved, or none is.

> [!key-idea]
> The base class decides *what* happens and *in which order*; subclasses only decide *how* to do their own step.

> [!warning]
> Why not `@Transactional` on `importAll()`? Because it's `final`, and as you saw in the Proxy lesson, Spring's proxy can't intercept a `final` method. The call would run on the proxy itself, whose fields are empty, and end in a `NullPointerException`. `TransactionTemplate` does the same job from the inside, with no proxy.
@describe: The abstract ResultImporter appears, highlighted, saving into ResultRepository. The copied importers are gone.

## @step:steps — Each format fills its gap
Now every format is a subclass with **a single required method**:

- `CsvResultImporter.parse()` checks the header, skips it and splits each line on commas.
- `JsonResultImporter.parse()` lets Jackson turn the JSON into a list of `Result`.

Neither of them validates or saves anything: the base class already does. The `score > 0` rule now covers both formats, and the next one too.

> [!key-idea]
> Adding a new format, say Excel, means writing a subclass with its own `parse()`. That's it.
@describe: CsvResultImporter and JsonResultImporter appear highlighted, both with inheritance arrows pointing to ResultImporter.

## @step:spring-wiring — Two beans, one endpoint
Both subclasses are ordinary beans (`@Component`). The controller gets them through its constructor and has one method per format; Spring MVC picks which one to call from the request's `Content-Type` (the `consumes` attribute):

- `text/csv` goes to `csv.importAll(...)`.
- `application/json` goes to `json.importAll(...)`.

Both calls hit the **same** template method; the only difference is which subclass fills in the `parse` step.

> [!spring]
> If a CSV line is malformed, `parse()` throws an `IllegalArgumentException` with the line number and a `@RestControllerAdvice` turns it into a 400. A `Content-Type` that's neither CSV nor JSON gets a 415.
@describe: The Spring context appears under the whole diagram; the controller is highlighted together with the context, connected to both importers.

## @step:request — A CSV start to finish
The coach uploads the CSV for the 18:00 class with three rows: Ana with 185, Leo with 0 and Mia with 21.

1. The controller calls `importAll()` on `CsvResultImporter`.
2. `parse()` turns the lines into three `Result`s.
3. The shared validation step rejects Leo: `score must be > 0`.
4. Ana and Mia are saved, and the API returns `{imported: 2, rejected: ["Leo/Fran: score must be > 0"]}`.

> [!key-idea]
> The rejection is identical whether it comes from CSV or JSON, because the rule lives in one place.
@describe: results.csv travels from the coach to the controller, importAll() from the controller to CsvResultImporter, and save ×2 from ResultImporter, highlighted, to ResultRepository.

## @step:hook — An optional step
Only the partner integration needs something extra: keeping the last report so its app can poll it with `GET /api/results/import/partner/last`. That's what the `afterImport()` **hook** is for. In the base class it does nothing, and `JsonResultImporter` overrides it.

> [!warning]
> Template Method is built on inheritance, so every subclass is tied to the base class. If you start piling up hooks or overriding half the behaviour, a strategy or a callback is probably a better fit. That's exactly what Spring does in the next step.
@describe: The partner app sends JSON to the controller, which calls importAll() on JsonResultImporter, highlighted.

## @step:spring-does-it — Spring already does it for you
`JdbcTemplate` is one big Template Method. It fixes the usual part: get a connection, prepare the statement, run it, loop over the `ResultSet`, close everything and translate SQL errors into Spring exceptions.

You only supply what varies: the SQL and a `RowMapper` that says how to turn **one** row into a `Result`. But you don't extend anything: the variable step arrives as a lambda. It's the "callback" version of the same pattern.

> [!spring]
> The same idea shows up in `TransactionTemplate` (the one our `importAll()` uses), `JmsTemplate` or `RestClient`, which fixes how the request is sent and lets you plug in lambdas for what to do with errors or with the response. And `AbstractController` or `OncePerRequestFilter` show it in its classic form: you extend a class and fill in one method.
@describe: Inside the Spring context there are ResultRepository and JdbcTemplate, highlighted; the repository sends it query(sql, rowMapper).

## @step:recap — Recap
You started with two copied importers that no longer matched and ended up with:

- **One skeleton**, `importAll()`, `final` and written once.
- **One abstract step**, `parse()`, that each format implements.
- **One hook**, `afterImport()`, for whoever needs something extra.
- **The shared rules**, in one place, for every format.

> [!key-idea]
> When several classes do "the same thing except one step", move the process into a template and let each one fill in only its step.
@describe: Final view: the coach and the partner, the controller, both importers extending ResultImporter and the repository, all inside the Spring context.
