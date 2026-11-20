---
title: Bridge
summary: The box sends class and payment reminders by email, SMS or push. Separate what's said from how it's delivered, so each side grows on its own without one class per combination.
minutes: 10
level: intermediate
recap:
  intent: Split an idea into two parts that can change separately (what gets done and how it's done), and join them with a reference instead of inheritance.
  participants:
    - Abstraction (Reminder), what the rest of the app uses; it holds a reference to the channel
    - RefinedAbstraction (ClassReminder, PaymentReminder), each kind of reminder
    - Implementor (Channel), the interface for how a message is delivered
    - ConcreteImplementor (EmailChannel, SmsChannel, PushChannel), each channel with its rules
  pros:
    - Reminders and channels grow separately; any combination works
    - Each rule lives in one place (the SMS cut, in the channel)
    - The channel can be picked at runtime, by the member's preference for example
  cons:
    - Two hierarchies and a reference between them, more to read than one direct class
    - You have to decide well what goes on each side; with a bad boundary, things cross over
    - If only one dimension varies, it's extra structure
    - If each channel needs different wording for each reminder, the sides aren't independent and the bridge breaks
  related:
    - Adapter
    - Strategy
    - Abstract Factory
quiz:
  - q: The box adds WhatsApp as a channel. What do you change?
    options:
      - One class per reminder, like WhatsappClassReminder
      - ClassReminder and PaymentReminder, so they can use WhatsApp
      - A WhatsappChannel class implementing Channel
      - Reminder, to add a sendByWhatsapp() method to it
    answer: 2
    explain: Reminders talk to Channel, not to a concrete channel. A new channel works for every reminder that already exists.
  - q: And if you add a new reminder, the personal-record one?
    options:
      - A PrReminder class extending Reminder
      - Three classes, one for each existing channel
      - A new method on Channel for records
      - An if in every channel to format the record
    answer: 0
    explain: It's the other half of the bridge. The new reminder says what to tell and any channel delivers it.
  - q: Why is the 160-character cut in SmsChannel and not in each reminder?
    options:
      - Because reminders have no access to the text's length
      - So each reminder can pick its own limit
      - Because only SmsChannel knows the member's phone
      - Because it's a channel rule and applies to all
    answer: 3
    explain: In the earlier version, every SMS class copied the cut and one left it out. If the rule belongs to the channel, it goes in the channel and can't be forgotten.
  - q: How are RestClient and ClientHttpRequestFactory related?
    options:
      - RestClient extends the request factory and adds to it
      - RestClient is the API; the factory, the transport underneath
      - They're the same object seen through two different interfaces
      - The factory is only used in tests with MockRestServiceServer
    answer: 1
    explain: You write the same code with RestClient and pick the HTTP client underneath (java.net.http.HttpClient, HttpURLConnection, Apache, Jetty…). It's a bridge between the API and the transport.
---
## @step:problem — One class per combination
The box sends two kinds of reminder, for tomorrow's **class** and for the membership **payment**, and sends them by **email** or **SMS**. The first version has one class for each combination: `EmailClassReminder`, `SmsClassReminder`, `EmailPaymentReminder` and `SmsPaymentReminder`.

Now push arrives. That's two more classes. And a third kind of reminder would be three more. The classes grow like a table: kinds × channels.

> [!problem]
> Two things that change separately (what's said and how it's sent) are mixed in every class.
@describe: Four classes in a grid, one per combination: EmailClassReminder, SmsClassReminder, EmailPaymentReminder and SmsPaymentReminder, all highlighted.

## @step:smell — Copies that drift apart
Every SMS class repeats the same channel rules, like the 160-character limit. `SmsPaymentReminder` was copied from `SmsClassReminder`… without the cut. A payment reminder with a long note goes out whole and the carrier splits it into two messages. The `OneClassPerCombinationTest` test proves it.

> [!warning]
> When a "how it's sent" rule is copied into every "what's sent", sooner or later one copy falls behind.
@describe: SmsPaymentReminder is highlighted in red: its copy of the SMS text doesn't cut at 160 characters.

## @step:abstraction — What's said
Bridge splits the classes into two sides. The first is the **abstraction**, `Reminder`: it decides the message's title and body.

It doesn't extend any channel: it **has** one (`channel`) and, when sending, hands it the title and body. That reference is the "bridge".

> [!key-idea]
> Instead of inheriting the channel, the reminder has it. That way it can be combined with any.
@describe: Reminder appears, highlighted, with ClassReminder and PaymentReminder; Reminder calls channel.deliver(…) across the bridge.

## @step:implementor — How it's delivered
The other side is the **implementation**, `Channel`: it takes a title and a body and delivers them to a member. `EmailChannel`, `SmsChannel` and `PushChannel` know which address to send to and how to format it.

No channel knows what a class or a payment is.
@describe: The Channel interface appears, highlighted, with EmailChannel, SmsChannel and PushChannel implementing it.

## @step:refined — Each reminder, its text
`ClassReminder` and `PaymentReminder` are the **refined abstractions**: they only write their title and body ("Class tomorrow", "Hyrox prep at 18:00…"). They don't know which channel they'll go out on.
@describe: ClassReminder and PaymentReminder, highlighted, extend Reminder.

## @step:channel-rules — Each rule, in its place
The 160-character limit is the SMS's business, so it lives in `SmsChannel`, once. It applies to the class reminder, the payment one with a long note and any that comes. It counts real characters (code points), so it never splits an emoji in half. Push cuts the title at 40 and the body at 120; email cuts nothing.

(160 is a simplification: a real SMS counts GSM-7 septets, `€` costs two, and any character outside GSM-7 drops the limit to 70.)
@describe: SmsChannel, highlighted, applies its 160-character limit to any reminder.

## @step:combine — Any combination
With two kinds of reminder and three channels there are six combinations, and not a single class per combination: `new ClassReminder(sms, …)` or `new PaymentReminder(sms, …)`. A test walks all six.

> [!key-idea]
> A new channel works for every reminder, and a new reminder for every channel. The classes grow like a sum, not like a table.
@describe: ClassReminder, PaymentReminder and SmsChannel, highlighted: both reminders go out by SMS across the bridge.

## @step:request — Each member, their channel
In Spring, each channel is a bean, and `ReminderService` gets the list of every `Channel` and indexes them by their `name()` (`"email"`, `"sms"`, `"push"`). Each member has a preferred channel: Ana email, Leo SMS, Eva push.

`POST /api/reminders` with Leo and "class": the service creates a `ClassReminder` with Leo's channel and sends it to +34600000002. With `"channel": "email"` in the request, the same reminder goes out by email; with no channel, or a blank one, the preferred one is used.
@describe: POST /api/reminders travels from the front desk to the controller and remind("leo", "class") to the service, which creates a ClassReminder with the SMS channel; ReminderService and SmsChannel are highlighted.

## @step:spring-does-it — Spring already does it for you
With `RestClient` you always write the same thing: `get().uri(…).retrieve()`. Underneath, a `ClientHttpRequestFactory` decides which HTTP client does the work: the `java.net.http` one (`JdkClientHttpRequestFactory`), the classic `HttpURLConnection` (`SimpleClientHttpRequestFactory`), Apache, Jetty or Reactor.

The test makes the same call with two different transports against its own server and gets the same answer. And the `RestClient.Builder` Spring Boot gives you picks one by itself from the classpath (Apache, Jetty, Reactor Netty, the JDK's and, as a last resort, `HttpURLConnection`).

It's a "degenerate" bridge: the abstraction side has a single class (`RestClient` has no refined subtypes), and the implementation is a request factory.

> [!spring]
> `RestClient` is the abstraction and the request factory, the implementation. You can change the HTTP client without touching a single line of the code that makes the calls.
@describe: RestClient, highlighted, creates its requests with ClientHttpRequestFactory, also highlighted, which can be the JDK's or HttpURLConnection's.

## @step:recap — Recap
You started with one class per combination and ended up with:

- **An abstraction**, `Reminder`, that has a channel instead of inheriting it.
- **An implementation**, `Channel`, with one class per channel and its rules inside.
- **Free combinations**: kinds of reminder and channels grow separately.

Don't mix it up with its neighbours: an **Adapter** fits something that already exists and didn't fit; a Bridge is designed from the start so two sides can change separately. With **Strategy** the shape is almost the same, and here `Channel` looks like one: a single method, injected. What makes it a Bridge is the intent: *both* sides are hierarchies meant to grow separately. In the book, besides, the implementation usually offers lower-level operations that the abstraction combines; here we've simplified it to a single `deliver`. By the way, a final `send()` with `title()` and `body()` as hooks is a **Template Method** inside the abstraction. And an **Abstract Factory** can be the one that picks which implementation to use.

And when you don't need it: if there's only one channel, or only one kind of reminder, a direct class is simpler. And if each channel needs different wording for each reminder, the two sides aren't independent: the bridge leaks, and per-channel templates will serve you better.

> [!key-idea]
> When something varies in two directions at once, separate the two directions and join them with a reference.
@describe: Final view: the front desk, the controller, ReminderService, both reminders with Reminder and the three channels with Channel, joined by the bridge, all inside the Spring context.
