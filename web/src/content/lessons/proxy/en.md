---
title: Proxy
summary: Booking a spot in a class is two writes that succeed or fail together. See how a proxy adds the transaction without touching your service, and why @Transactional is exactly that.
minutes: 12
level: intermediate
recap:
  intent: Put a stand-in with the same interface in front of an object to control access to it and add work before and after every call, without the client noticing.
  participants:
    - Subject (BookingOperations in the hand-written version; in Spring, the BookingService class itself), the contract the real object and its proxy share
    - RealSubject (PlainBookingService or BookingService), which does the actual work
    - Proxy (TxBookingProxy or the one Spring generates), which opens the transaction, delegates and commits or rolls back
    - Client (BookingController), which talks to the proxy believing it's the service
  pros:
    - The service only holds business logic; the transaction lives elsewhere
    - The client doesn't change, because the proxy honours the same contract
    - With Spring, one annotation replaces a proxy class per service
  cons:
    - The magic is invisible and hard to debug if you don't know there's a proxy
    - Internal calls (this.method()) bypass the proxy
    - Private or final methods can't be intercepted
  related:
    - Decorator
    - Adapter
    - Facade
quiz:
  - q: Spring injects a BookingService with a @Transactional method. What does the controller actually get?
    options:
      - The BookingService instance, and the JDBC driver manages the transaction
      - A fresh copy of BookingService per request
      - A proxy that opens the transaction, calls the real BookingService and commits or rolls back
      - A BookingService with the transaction code copied in at compile time
    answer: 2
    explain: At startup Spring sees @Transactional and registers a proxy in the context instead of the real object. The controller calls the proxy, which wraps the call in BEGIN/COMMIT or ROLLBACK.
  - q: bookPair() has no @Transactional and calls this.book(), which does, twice. What happens?
    options:
      - Both book() calls run without a transaction, because this is the real object, not the proxy
      - Each book() opens its own transaction, as usual
      - Spring detects the internal call and opens one transaction for both
      - It doesn't compile, you can't call a @Transactional method from the same class
    answer: 0
    explain: The proxy only intercepts calls that come from outside. Inside the real object, this.book() is a plain Java call and the annotation does nothing. The example test shows it with a booking that never gets rolled back.
  - q: What sets a Proxy apart from a Decorator, if both wrap another object with the same interface?
    options:
      - Proxy only works with interfaces and Decorator only with classes
      - A Decorator can't call the wrapped object
      - Nothing, they're the same pattern
      - Intent; a Proxy controls access to the object (transactions, permissions, lazy loading) and a Decorator adds visible functionality
    answer: 3
    explain: The structure is almost identical. A Proxy is usually imposed from outside and the client doesn't know it's there; a Decorator is composed on purpose to enrich behaviour.
  - q: You wrap an object that implements an interface with ProxyFactory. What kind of proxy does Spring create?
    options:
      - A CGLIB proxy, since that's the only kind
      - A JDK dynamic proxy that implements the same interface
      - None, ProxyFactory only works for classes without interfaces
      - A subclass generated at compile time
    answer: 1
    explain: When the object implements an interface, ProxyFactory creates a JDK dynamic proxy by default. Careful, in a Spring Boot app @Transactional proxies use CGLIB by default even when there is an interface, so you can inject the concrete class. Both intercept public calls coming from outside in the same way.
---
## @step:problem — One booking, two writes
Booking a spot in the 18:00 class is **two** changes in the database: insert the booking and take one free spot.

They have to go together. If the class is already full, the booking can't be left half-done, so you need a **transaction**. The manual version opens, commits and rolls it back by hand inside the service itself.

> [!problem]
> The business logic (two lines) is buried between `getTransaction`, `commit`, `rollback` and a `try/catch`.
@describe: The athlete sends POST booking to BookingController, which calls ManualTxBookingService, highlighted in red, which talks to the database.

## @step:smell — And again, in every method
Cancelling a booking is two writes as well: delete the booking and give the spot back. So `cancel()` repeats **the same ceremony**: open, try, commit, catch, roll back.

Every new method copies it again, and forgetting one `rollback` in one `catch` is enough to leave the database inconsistent.

> [!warning]
> Mixing *what* the method does with *how* it's protected makes both harder to read, to test and to change.
@describe: The diagram doesn't change. ManualTxBookingService stays highlighted in red as the place where the transaction code is repeated.

## @step:gof-proxy — A stand-in with the same face
The Proxy pattern pulls the two apart:

- `BookingOperations` is the contract: `book(sessionId, athlete)`.
- `PlainBookingService` implements it with business logic only, not a single transaction line.
- `TxBookingProxy` implements it **too**: it opens the transaction, delegates to the real service and commits or rolls back.

If the controller depends on `BookingOperations`, you hand it the proxy instead of the service and it can't tell the difference.

> [!key-idea]
> The proxy stands in front of the real object, with the same interface, and decides what happens before and after each call.
@describe: TxBookingProxy and PlainBookingService appear, both implementing BookingOperations, highlighted together with the proxy. The controller calls the proxy and the proxy calls the real service.

## @step:gof-cons — One proxy per service
It works, and the service is finally clean. But look at the cost:

- You need **one proxy class per interface**, with a wrapper method for every method.
- The transaction code is still repeated; it just lives in the proxies now.
- If tomorrow you also want to time calls or check permissions, that's another layer of proxies.

> [!warning]
> The pattern is good; hand-writing it for every service isn't. Ideally these proxies would be generated for you.
@describe: The diagram doesn't change. TxBookingProxy stays highlighted, now as the code you'd have to repeat for every service.

## @step:spring-tx — @Transactional, and Spring writes the proxy
That's exactly what Spring does. You write the service with its business logic and one annotation: `@Transactional`.

At startup Spring sees the annotation and does **not** register your `BookingService` as is, but a generated proxy that wraps it (in the debugger you'll see a class like `BookingService$$SpringCGLIB$$0`). That's what the controller receives.

> [!spring]
> The generated proxy does what our `TxBookingProxy` did: open the transaction, call your method and commit, or roll back on a `RuntimeException` or an `Error`. Spring Boot generates it as a CGLIB subclass by default, interface or not.

> [!warning]
> A checked exception does **not** roll back: whatever you'd done so far gets committed. If you need it, say so with `@Transactional(rollbackFor = MyException.class)`.
@describe: The Spring context appears. Between the controller and BookingService sits the proxy Spring generates, highlighted together with the context. BookingService talks to the database.

## @step:request — A booking when the class is full
Follow the request:

1. The athlete sends `POST /api/sessions/1/bookings?athlete=Ana`.
2. The controller calls `book()` on the proxy, which opens a transaction and calls the real service.
3. The service inserts the booking and tries to take a spot. With 0 left, it throws `ClassFullException`.
4. The proxy sees the exception and **rolls back**: the inserted booking is gone and the API answers 409.

The API also guards its input: an empty name or one longer than 80 characters gets a 400, and booking the same class twice gets a 409.

> [!key-idea]
> The example test checks it: `AopUtils.isAopProxy(bookings)` is `true` and, after the exception, the table has no bookings left.
@describe: Packets travel the chain: POST booking from the athlete to the controller, book() to the proxy, BEGIN · book() from the proxy to BookingService and INSERT + UPDATE to the database; finally ROLLBACK · 409 travels back from the proxy to the controller. The proxy is highlighted.

## @step:self-call — Watch out for this
A proxy only intercepts calls that **reach it**. `bookPair()` has no `@Transactional` and calls `this.book()` twice.

Those calls go straight to the real object without passing through the proxy, so **there's no transaction**. If the second booking fails because the class filled up, the first booking's row stays… and so does the second one, inserted before the spots were checked.

> [!warning]
> To make it work, put `@Transactional` on the method called from outside (`bookPair`) or move the logic to another bean. And remember that `private` or `final` methods can't be intercepted either.
@describe: bookPair() reaches the proxy and moves on to BookingService, highlighted: both internal book() calls happen inside the real object, never going back to the proxy.

## @step:spring-does-it — Spring already does it for you
`@Transactional` is just one case. The same mechanism powers `@Cacheable`, `@Async`, `@PreAuthorize`, `@Retryable`… and Spring Data repositories, which are proxies of an interface you never implemented.

Underneath sits `ProxyFactory`: you give it an object and an *interceptor* that decides what happens before and after, and it hands you the proxy.

> [!spring]
> The example test wraps a `Scoreboard` with an interceptor that logs `begin`, calls the real object and logs `commit`, or `rollback` if an exception is thrown. Swap those log lines for calls to the transaction manager and you have the core idea of `@Transactional`.
@describe: Inside the Spring context, ProxyFactory, highlighted, sends getProxy() to the proxy, also highlighted, which wraps BookingService.

## @step:recap — Recap
You started with manual transactions in every method, moved to a hand-written proxy and ended up with one annotation:

- **The service only holds business logic.**
- **The proxy**, generated by Spring, opens, commits or rolls back the transaction.
- **The client never knows**, because it gets the proxy with the same face as the service.
- **Watch out for `this`, `private` and `final`**, which bypass the proxy.

> [!key-idea]
> When a Spring annotation "does things" around your method, there's almost always a proxy behind it.
@describe: Final view: the athlete, the controller, Spring's proxy, BookingService and the database inside the Spring context.
