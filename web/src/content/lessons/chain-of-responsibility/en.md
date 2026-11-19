---
title: Chain of Responsibility
summary: To get into class you need your membership paid, the waiver signed and a free spot. Turn every check into a link that decides or passes the turn, just like Spring Security's filters.
minutes: 12
level: intermediate
recap:
  intent: Pass a request along a chain of handlers; each one decides whether to handle it or let it through, without the sender knowing which one will answer.
  participants:
    - Handler (AccessRule, or AccessHandler in the hand-written version), the contract for every link
    - ConcreteHandler (MembershipRule, WaiverRule, CapacityRule, AuditRule), each with a single check
    - The chain (AccessChain), which carries the request from one link to the next
    - Client (AccessControl, called by the controller), which hands the request to the first link
  pros:
    - Each rule lives in its own class, small and easy to test
    - Adding or removing a rule doesn't touch the others (as long as it respects the order)
    - A link can act before and after the rest, like AuditRule
  cons:
    - Order matters and must be set on purpose
    - You have to decide what happens if nobody says no; here the door opens by default, while Spring Security denies by default
    - Following a request through the chain is harder than reading one method full of ifs
  related:
    - Decorator
    - Command
    - Composite
quiz:
  - q: Leo hasn't signed the waiver. Which rules run when he checks in?
    options:
      - All of them, and their results are combined at the end
      - AuditRule, MembershipRule and WaiverRule; CapacityRule never hears about it
      - Only WaiverRule, because it's the one that fails
      - None, the controller rejects him first
    answer: 1
    explain: Each rule decides whether to call chain.proceed(). WaiverRule answers "waiver not signed" and doesn't call the next one, so CapacityRule doesn't run and Leo doesn't use up a spot.
  - q: Why must CapacityRule be last?
    options:
      - Alphabetical order
      - Because Spring runs rules in declaration order
      - Because it's the slowest
      - Because it's the only one with an effect (taking a spot), and it mustn't take one for someone another rule is going to reject
    answer: 3
    explain: If it came before the waiver check, Leo would take a spot and then be turned away. Checks with no effects go first; the one that changes something, last.
  - q: AuditRule has @Order(0) and calls chain.proceed() before writing to its log. What does that achieve?
    options:
      - It sees the chain's final answer, whatever it is, because the rest runs "inside" its call
      - It rejects every athlete who isn't in the log
      - It stops the other rules from running
      - Nothing, order doesn't affect a log
    answer: 0
    explain: Like a servlet filter, a link can work before and after calling the next one. AuditRule goes first, lets the rest decide and writes down the result on the way back.
  - q: Where does Spring use this pattern most visibly?
    options:
      - In Spring Data repositories
      - In @Transactional
      - In the servlet filter chain, and in particular Spring Security's SecurityFilterChain
      - In the singleton scope
    answer: 2
    explain: Every Spring Security filter (authentication, CSRF, authorisation…) decides whether to cut the request short or call chain.doFilter(). It's the same idea as our door rules.
---
## @step:problem — The box door
It's 18:00 and Leo taps his card to get into class. Before opening, the door checks three things:

1. His **membership is paid**.
2. He has signed the **waiver**, the liability release form.
3. There's a **spot** left in the class, and if so, it books it for him.

The first version puts everything in `MonolithicCheckIn.checkIn()`: a row of `if`s that return "no" or, if you reach the end, "yes".

> [!problem]
> All the door rules live in the same method, tangled together, and their order depends on where each `if` happens to land.
@describe: The athlete sends Leo · 18:00 to CheckInController, which calls MonolithicCheckIn, highlighted in red.

## @step:smell — One more rule
Tomorrow another one arrives: minors need a guardian's consent. You have to open the method, find the right place among the other `if`s and hope you don't break anything. And at some point someone will put a check **after** booking the spot, and that spot will stay taken even though the athlete was rejected.

> [!warning]
> A method that grows with every new rule is hard to read, to test piece by piece and to reorder safely.
@describe: The diagram doesn't change: MonolithicCheckIn stays highlighted in red as the method you'd have to open for every new rule.

## @step:gof — Each rule, one link
Chain of Responsibility splits the method into **links**. Each handler checks **one thing only** and:

- if it has the answer (a "no"), it returns it and the chain stops;
- if not, it hands the check-in to the next one.

In the classic version, each `AccessHandler` keeps a reference to its `next` and the chain is assembled by hand: `membership.linkWith(waiver).linkWith(capacity)`. Leo is stopped by `WaiverHandler` and the capacity one never hears about it.

> [!key-idea]
> Whoever sends the check-in doesn't know which link will answer. It just hands it to the first one.

In classic GoF, a single handler takes care of the request and the chain ends there. In the Spring version coming next (the filter-chain one), each link can also act and carry on, as you'll see with `CapacityRule` and `AuditRule`.
@describe: Three handlers in a row, MembershipHandler, WaiverHandler and CapacityHandler, highlighted. Leo goes from the controller to the first and on to the second, which sends back denied.

## @step:spring-chain — Rules are beans
In Spring, each rule is a bean implementing `AccessRule`, with an `@Order` that sets its place. `AccessControl` gets the sorted list and, for every check-in, starts an `AccessChain` that walks it:

- If there are no rules left, the athlete gets in.
- If there are, it calls the next one passing **the rest of the chain**, and it's the rule that decides whether to call `proceed()` to carry on. It may do so once at most; a second call is an error.

It's the same shape as the servlet `FilterChain`.

> [!spring]
> A new rule? A `@Component` with its `@Order`. Neither `AccessControl` nor the other rules change.
@describe: The Spring context appears. AccessControl, highlighted together with the context, is wired to the row of rules: AuditRule, MembershipRule, WaiverRule and CapacityRule, all implementing AccessRule.

## @step:request — Ana gets in
Ana's membership is paid, her waiver is signed and there's a spot left:

1. `POST /api/check-ins?athlete=Ana&session=1` reaches `AccessControl`.
2. Each rule checks its own thing and calls `chain.proceed()`.
3. `CapacityRule` books her a spot and, with no rules left, the chain answers **granted**: 200. If no rule says no, the door opens.

Look at `MembershipRule`: it either returns a "no" and cuts things short, or passes the turn. It doesn't know what comes next.
@describe: Ana · 18:00 travels from the athlete to the controller, decide() to AccessControl, and proceed() walks the whole row of rules, highlighted, all the way to CapacityRule; finally granted · 200 travels back from AccessControl to the controller.

## @step:denied — Leo stays outside
Leo's membership is paid, but he has **not** signed the waiver:

1. `MembershipRule` lets him through.
2. `WaiverRule` answers `denied("waiver not signed")` and does **not** call `proceed()`.
3. The answer travels back through the chain: 403 with the reason.

`CapacityRule` never runs, so Leo doesn't use up a spot: there are still 2 left. The example test checks it.

> [!key-idea]
> Cutting the chain short is as simple as returning an answer instead of calling the next link.
@describe: Leo gets past MembershipRule; WaiverRule, highlighted, sends waiver not signed back and the chain stops before CapacityRule.

## @step:order — Order is part of the rule
`CapacityRule` is the only rule with an **effect**: it takes a spot, and as written it takes it **before** calling `proceed()`. That's why it goes last (`@Order(30)`). If it came before the waiver check, Leo would take a spot and then be turned away. Another option would be to call `proceed()` first and book only if the answer is *granted*; then its position wouldn't matter.

> [!warning]
> First the checks that change nothing; last, the one that does. And keep the order written in one place, with `@Order`, not in whatever order the classes happen to be declared.
@describe: CapacityRule appears highlighted at the end of the row: it's the one that books the spot.

## @step:audit — Before and after
`AuditRule` goes **first** (`@Order(0)`) and does something curious: it calls `chain.proceed()` **before** doing anything. The whole rest of the chain runs "inside" that call, and when it returns, `AuditRule` sees the final answer and writes it to the log: "Ana → session 1: granted", "Leo → session 1: denied (waiver not signed)".

> [!spring]
> That's exactly what many servlet filters do: time the request, add headers to the response or record the outcome, wrapping everyone that comes after them.
@describe: AccessControl sends proceed() to AuditRule, highlighted, and the granted answer comes back along the same link at the end.

## @step:spring-does-it — Spring already does it for you
In a Spring MVC (servlet) app, every HTTP request goes through a **servlet filter chain** before reaching the `DispatcherServlet`. Spring Security joins that chain as a single filter (`DelegatingFilterProxy`, which delegates to `FilterChainProxy`), which in turn runs the filters of its `SecurityFilterChain`: authentication, CSRF, session, authorisation… Each one decides whether to cut the request short or call `chain.doFilter()`.

The example test sets up a `WaiverHeaderFilter`. Without the `X-Waiver-Signed` header it answers 403 and the app never knows; with it, it calls `chain.doFilter()` and the request carries on.

> [!spring]
> That's why the order of security filters matters so much, and why a misplaced filter can let something through or block everything.
@describe: Inside the Spring context, the GET /api/wods request reaches WaiverHeaderFilter, highlighted, which passes it on with doFilter() to DispatcherServlet.

## @step:recap — Recap
You started with a method full of `if`s and ended up with:

- **One rule per class**, with a single check.
- **`@Order`** to set each one's place.
- **Cut or carry on**: return an answer or call `chain.proceed()`.
- **Links that wrap**, like `AuditRule`, acting before and after the rest.

> [!key-idea]
> When several checks can each say "no" on their own, chain them instead of nesting them.
@describe: Final view: the athlete, the controller, AccessControl and the row of rules implementing AccessRule, all inside the Spring context.
