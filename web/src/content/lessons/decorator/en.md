---
title: Decorator
summary: Physio, nutrition, open gym, a student discount… If every combination of extras is a class, the code explodes. Wrap the base plan in layers that add up and let Spring order them.
minutes: 11
level: intermediate
recap:
  intent: Add responsibilities to an object by wrapping it in others with the same interface, instead of creating a subclass for every combination.
  participants:
    - Component (Membership), the interface shared by plans and extras
    - ConcreteComponent (BasicMembership), the base plan everybody wraps
    - Decorator (MembershipDecorator), which keeps the wrapped object and delegates to it
    - ConcreteDecorator (PhysioAddOn, NutritionAddOn, OpenGymAddOn, StudentDiscount), which add their part
  pros:
    - Combinations are assembled at runtime, with no class per combination
    - Each extra lives in a small class and is tested on its own
    - The client still sees a Membership, whether it has zero layers or five
  cons:
    - If a decorator isn't purely additive, the order of the layers changes the result
    - Many small layers are harder to debug than one class
    - Anyone asking for the concrete type (instanceof) sees the outer decorator, not the base plan
  related:
    - Proxy
    - Composite
    - Chain of Responsibility
quiz:
  - q: With 4 extras that can be freely combined, how many classes do you need with one subclass per combination? And with decorators?
    options:
      - 4 and 4
      - 16 and 5 (the base plan plus one decorator per extra)
      - 8 and 8
      - 16 and 16
    answer: 1
    explain: Each extra is either in or out, so there are 2⁴ = 16 combinations, each a subclass. With decorators you need the base plan and one class per extra, and combinations are assembled on the fly.
  - q: StudentDiscount takes 20% off whatever it wraps. Why must it be the outer layer?
    options:
      - Because Java doesn't allow any other order
      - Because it runs faster that way
      - No reason, the result is the same in any order
      - Because inside, the discount only applies to the base plan and the extras wrapping it are charged in full
    answer: 3
    explain: Extras add and the discount multiplies, so order matters. (59 + 25) × 0.8 = €67.20, but 59 × 0.8 + 25 = €72.20. That's why the discount bean carries @Order(LOWEST_PRECEDENCE).
  - q: What makes MembershipQuoter receive the AddOns in a specific order?
    options:
      - Each bean's @Order annotation; Spring sorts injected lists by it
      - The alphabetical order of the bean names
      - The order in which the client asks for them in the URL
      - Nothing, an injected List has no guaranteed order
    answer: 0
    explain: When you inject a List of beans, Spring sorts it by @Order (or the Ordered interface). So the quoter always applies the extras first and the discount last, whatever the client asks for.
  - q: How does a Decorator differ from a Proxy?
    options:
      - A Decorator can't call the wrapped object
      - Only the Proxy implements the same interface
      - A Decorator adds behaviour the client sees and composes it on purpose; a Proxy controls access and is usually transparent
      - They're the same pattern with a different name
    answer: 2
    explain: The shape is the same, wrapping an object with its own interface. The intent differs. Here each layer changes the price and the description in plain sight; a @Transactional proxy doesn't change what you return, it only protects it.
---
## @step:problem — One class per combination
The box's basic plan costs €59 a month. On top of it, each athlete can add extras: **physio** (+€25), **nutrition** (+€15) and **open gym** (+€10).

The first version creates a subclass for every combination: `BasicWithPhysio`, `BasicWithNutrition`, `BasicWithPhysioAndNutrition`… An athlete asks for physio and nutrition, and the controller has to find the exact class for that combination.

> [!problem]
> Each extra's price is copied by hand into every class that includes it: 59 + 25 + 15, written down as 99.00.
@describe: The athlete sends physio + nutrition to the controller, which is wired to three plan classes; BasicWithPhysioAndNutrition is highlighted in red.

## @step:smell — Then open gym arrives
With 2 extras you already have 4 classes. Add open gym and it's 8. Add the student discount and it's 16. Every new extra **doubles** the classes.

And if physio gets more expensive, you have to find and change every class that includes it. Miss one and you charge the wrong price.

> [!warning]
> Inheritance is for "is a kind of". For "also comes with", combine objects.
@describe: The three combination classes are highlighted: every new extra would double their number.

## @step:decorator — An extra that wraps
The Decorator pattern swaps inheritance for **wrappers**:

- `Membership` is the interface: `description()` and `monthlyFee()`.
- `BasicMembership` is the base plan.
- `PhysioAddOn` is a `Membership` too, but it keeps **another** `Membership` inside (`inner`). Ask it for the price and it asks `inner`, then adds €25.

Physio doesn't know or care what's inside: a basic plan, another extra or ten of them.

> [!key-idea]
> A decorator has the same face as what it wraps, so it can wrap anything, even another decorator.
@describe: The Membership interface, PhysioAddOn, highlighted, and BasicMembership appear; PhysioAddOn sends monthlyFee() to the basic plan it wraps.

## @step:stacking — Layers that add up
For physio and nutrition you don't need a new class: you stack the layers.

`new NutritionAddOn(new PhysioAddOn(new BasicMembership()))`

When asked for the price, each layer asks the one inside and adds its own: basic gives €59.00, physio brings it to €84.00 and nutrition to **€99.00**. The description is built the same way: "Basic + Physio + Nutrition".

> [!key-idea]
> 4 extras are no longer 16 classes, but the base plan and 4 decorators you combine however you like.
@describe: Nutrition asks Physio for the price, Physio asks the basic plan, and the answers come back: 59.00 from Basic to Physio and 84.00 from Physio to Nutrition. Both decorators are highlighted.

## @step:spring-addons — Every extra, a bean
In Spring, each option is an `AddOn` bean: a name (`physio`, `nutrition`, `open-gym`, `student`) and how to wrap a plan. `MembershipQuoter` gets **all of them** in a `List<AddOn>`.

Look at each bean's `@Order`: Spring sorts the injected list by it. The extras go first and the student discount, with `Ordered.LOWEST_PRECEDENCE`, always last.

> [!spring]
> A new option, say a locker? One more `@Bean` with its `@Order`. Neither the quoter nor the controller changes.
@describe: The Spring context appears. MembershipQuoter, highlighted together with the context, is wired to the decorator chain and to StudentDiscount.

## @step:request — A quote start to finish
An athlete asks for `GET /api/memberships/quote?addOns=physio,nutrition`:

1. The quoter checks that both exist and aren't repeated. If not, the API answers 400.
2. It starts from the basic plan and walks the `AddOn` list in order: wrap with physio, then with nutrition.
3. The API returns `{"description": "Basic + Physio + Nutrition", "monthlyFee": "99.00"}`.

> [!key-idea]
> The quoter doesn't know how to add up prices: it only stacks layers. Each layer knows its own part.
@describe: physio + nutrition travels from the athlete to the controller, quote() to the quoter, and monthlyFee() goes down the chain: NutritionAddOn, PhysioAddOn, highlighted, and BasicMembership.

## @step:order — When order matters
Extras add up, so the stacking order doesn't matter. The **student discount** multiplies by 0.8, and there order does change the price:

- Discount outside: (59 + 25) × 0.8 = **€67.20**.
- Discount inside: 59 × 0.8 + 25 = **€72.20**, and physio is charged without the discount.

Thanks to `@Order`, the quoter always puts the discount as the outer layer, whether the client asks for `student,physio` or `physio,student`.

> [!warning]
> As soon as a decorator isn't purely additive, the order of the layers is part of the business logic. Pin it down in a single place and test it.
@describe: The quoter asks StudentDiscount, highlighted, for the price; it wraps everything else and asks NutritionAddOn.

## @step:spring-does-it — Spring already does it for you
Spring has a hook for wrapping beans: a `BeanPostProcessor` sees every freshly created bean go by and can return **another object** instead. Return a decorator and that's what gets injected everywhere.

In the example, `AuditEveryMembership` wraps any `Membership` in an `AuditedMembership` that notes every time someone asks for the price.

> [!spring]
> You'll see the same idea under its own name. `TaskDecorator` wraps every `@Async` task (for example to copy the logging context), and `ContentCachingRequestWrapper` wraps the HTTP request so you can read its body twice.
@describe: Inside the Spring context, BeanPostProcessor, highlighted, wraps the plan in AuditedMembership, also highlighted, which asks BasicMembership for the price.

## @step:recap — Recap
You started with one class per combination of extras and ended up with:

- **One base plan** and **one decorator per extra**, all with the same interface.
- **Combinations on the fly**, stacking layers that add their part.
- **`AddOn` beans with `@Order`**, so the layers always come in the same order.
- **The discount outside**, because it multiplies.

> [!key-idea]
> When you have "X, optionally with A, B or C", don't subclass: wrap.
@describe: Final view: the athlete, the controller, the quoter and the decorator chain, with StudentDiscount in front, all inside the Spring context.
