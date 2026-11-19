---
title: Adapter
summary: The box switches heart-rate bands and the new vendor speaks another language. Define the interface your app needs and write one adapter per vendor, without touching their SDK or your code.
minutes: 11
level: beginner
recap:
  intent: Put a translator between your code and a class you can't change, so your code only talks to the interface it designed and the translator turns each call into something that class understands.
  participants:
    - Target (HeartRateMonitor), the interface the client needs, in its own terms
    - Adaptee (PulseBandClient, HeartLinkHub), the existing class with a different interface, which you can't change
    - Adapter (PulseBandMonitor, HeartLinkMonitor), which implements the Target and translates every call to the Adaptee it wraps
    - Client (ZoneBoard), which only knows the Target
  pros:
    - The vendor's code doesn't leak into your domain, with its types, units and errors
    - Switching vendor means writing another adapter, not rewriting the client
    - Each translation lives in a small class that's easy to test
  cons:
    - One more layer to read, and one class per thing you adapt
    - If the interface you design copies the vendor's, you've only renamed things
    - Some differences don't translate well (an SDK with no timestamp, say) and you have to decide what to do
  related:
    - Facade
    - Decorator
    - Proxy
quiz:
  - q: What exactly does PulseBandMonitor do?
    options:
      - It extends PulseBandClient and overrides latestBeat so it returns beats per minute
      - It wraps PulseBandClient and adds caching and retries without changing its interface
      - It implements HeartRateMonitor and translates every call to the PulseBandClient it wraps
      - It replaces PulseBandClient with its own implementation that talks to the band
    answer: 2
    explain: It's an object adapter. It receives "current(ana)" in the box's language, turns it into latestBeat with the serial number, goes from beats per second to per minute and turns the vendor's error into "no signal".
  - q: The box replaces the PulseBand bands with HeartLink straps. What do you change?
    options:
      - A new adapter, HeartLinkMonitor, and one configuration property
      - ZoneBoard, so it can read HeartLink's text and channels
      - HeartRateMonitor, to add readSample and the radio channels to it
      - The HeartLink SDK, so it returns the same as PulseBand's
    answer: 0
    explain: The client only knows HeartRateMonitor. With box.monitors.vendor=heartlink, Spring registers the other adapter and neither ZoneBoard nor the controller notices.
  - q: Why does the adapter wrap the SDK instead of extending it?
    options:
      - Because wrapping is faster than extending at runtime
      - Because Spring can't inject beans whose class extends another one
      - Because in Java you can't extend classes from another package
      - Because the SDK class may be final, extending it would expose all its methods and tie the adapter to that concrete class
    answer: 3
    explain: A class adapter would be possible here (extends PulseBandClient implements HeartRateMonitor), but it's rarely worth it. The object adapter only exposes your interface and can take any instance, including a test double.
  - q: What does the DispatcherServlet use HandlerAdapters for?
    options:
      - To turn the request's JSON body into the objects each method receives
      - To call different kinds of handler the same way, by asking each adapter whether it supports it
      - To pick which controller handles each URL by its path and HTTP method
      - To adapt the response format to what the Accept header asks for
    answer: 1
    explain: Picking the handler for each URL is the HandlerMappings' job. Once it's picked, the DispatcherServlet looks for the HandlerAdapter whose supports(handler) says yes and asks it to handle(), without knowing what type the handler is.
---
## @step:problem — The zones board
During class, the box's screen shows which **heart-rate zone** each athlete is in (1 to 5, by percentage of their max heart rate). Ana wears a **PulseBand** band and the app uses the vendor's SDK, `PulseBandClient`.

The first version, `VendorBoundZoneBoard`, calls the SDK directly: it looks up the band's serial number, calls `latestBeat(...)`, turns **beats per second** into beats per minute and milliseconds into an `Instant`.

> [!problem]
> The board speaks PulseBand's language: its serial numbers, its units and its exceptions.
@describe: The coach asks ZoneController for GET /api/zones/ana, which calls VendorBoundZoneBoard, highlighted in red; it calls PulseBandClient directly with latestBeat("PB-0042").

## @step:smell — The new straps arrive
The box switches to **HeartLink** straps, read from a hub on the wall. Its SDK looks nothing alike:

- Straps are identified by **radio channel**, not serial number.
- `readSample(3)` returns **text**: `"HR=171;T=1700000000"`, with the time in **seconds**.
- With no signal it doesn't throw, it returns `"NO_SIGNAL"`.

Every highlighted line depends on PulseBand. You'd have to rewrite the board, and do it again with the next vendor.

> [!warning]
> When an external library's types spread through your code, switching provider stops being a decision and becomes a project.
@describe: HeartLinkHub appears next to PulseBandClient. VendorBoundZoneBoard and HeartLinkHub, highlighted, don't fit: readSample(3) looks like nothing the board knows how to use.

## @step:target — First, what you need
Adapter starts on your side: define the interface the board needs, **in its own terms**. That's `HeartRateMonitor`:

- it takes the athlete's id, not a serial number or a channel;
- it returns a `HeartRate` in beats per minute, with its `Instant`;
- with no signal, it returns `Optional.empty()`.

No vendor type shows up anywhere. It's the pattern's **Target**.

> [!key-idea]
> Design the interface for whoever uses it, not by copying the first SDK you have at hand.
@describe: The HeartRateMonitor interface appears, highlighted, and ZoneBoard asks it for current("ana").

## @step:adapter — One adapter per vendor
`PulseBandMonitor` implements `HeartRateMonitor` and **wraps** a `PulseBandClient`. Every call is translated:

- the athlete's id becomes a serial number;
- beats per second become beats per minute, and milliseconds an `Instant`;
- the vendor's `PulseBandException` becomes "no signal".

The SDK doesn't change and neither does the board. All the translation lives in this class.

> [!key-idea]
> The adapter speaks both languages: inwards, your app's; outwards, the vendor's.
@describe: PulseBandMonitor, highlighted, plugs into HeartRateMonitor. ZoneBoard asks for current("ana") and the adapter calls PulseBandClient with latestBeat("PB-0042").

## @step:client — The board no longer knows about vendors
In Spring, `ZoneBoard` gets a `HeartRateMonitor` through its constructor. It asks for the heart rate, works out the zone with the athlete's max heart rate, and that's it.

It imports nothing from `vendor.pulseband` or `vendor.heartlink`. The SDK and its adapter are declared as beans in a separate `@Configuration` class which, apart from the adapter itself, is the only place where the vendor's name appears.
@describe: The Spring context appears. ZoneBoard, highlighted together with the context, is wired to HeartRateMonitor, where PulseBandMonitor is plugged in, using PulseBandClient.

## @step:request — Ana, in zone 4
Ana's band reads 2.6 beats per second:

1. `GET /api/zones/ana` reaches `ZoneController`, which calls `ZoneBoard`.
2. `ZoneBoard` asks its `HeartRateMonitor` for `current("ana")`.
3. `PulseBandMonitor` translates: serial `PB-0042`, 2.6 × 60 = **156 bpm**.
4. With a max of 190, that's 82%: **zone 4**.

> [!key-idea]
> The zone calculation uses bpm and nothing else. The vendor's units stayed in the adapter.
@describe: GET /api/zones/ana travels from the coach to the controller, zoneOf("ana") to ZoneBoard, current() to the interface, and PulseBandMonitor, highlighted with ZoneBoard, reads 2.6 beats/s from PulseBandClient.

## @step:heartlink — The second adapter
For HeartLink you write `HeartLinkMonitor`, another adapter for the same Target:

- it looks up the athlete's **channel** and calls `readSample(channel)`;
- if it gets `"NO_SIGNAL"`, it returns empty;
- otherwise it parses `"HR=171;T=1700000000"` and turns the seconds into an `Instant`.

And if the text can't be read, it doesn't make up a heart rate: it throws `MonitorException`. The API answers 502, because the fault is the device's and not the caller's, with a neutral message; the vendor details go to the log.

> [!warning]
> An adapter translates **errors** too. If it lets the vendor's exceptions through, the client depends on the vendor again.
@describe: HeartLinkMonitor, highlighted, plugs into HeartRateMonitor next to PulseBandMonitor and reads from HeartLinkHub with readSample(3).

## @step:switch — Switching vendor is configuration
Each vendor has its own `@Configuration` with `@ConditionalOnProperty`:

- `PulseBandConfig` is active when nothing is set (`matchIfMissing = true`).
- `HeartLinkConfig`, with `box.monitors.vendor=heartlink`.

You change one line in `application.properties`, Spring registers the other SDK and the other adapter, and `ZoneBoard` gets a different `HeartRateMonitor` without noticing. The `HeartLinkWiringTest` test checks it. And if someone misspells the vendor's name, no adapter is activated and the app fails at startup, not at the first reading.

> [!spring]
> With one adapter per provider and a condition in the configuration, the provider is chosen at deploy time, not at coding time.
@describe: With the heartlink property, the Spring context has HeartLinkMonitor, highlighted, plugged in instead of PulseBandMonitor. GET /api/zones/ana arrives the same way and the adapter reads "HR=171;T=…" from HeartLinkHub.

## @step:spring-does-it — Spring already does it for you
The `DispatcherServlet` serves very different handlers: `@GetMapping` methods on a `@RestController`, an old-style `HttpRequestHandler`, router functions (`RouterFunction`)… It can't call any of them directly. For each handler it looks for the **`HandlerAdapter`** that answers `true` to `supports(handler)` and asks it to `handle(...)`:

- `RequestMappingHandlerAdapter` for `@RequestMapping` methods (and `@GetMapping`, `@PostMapping`…);
- `HttpRequestHandlerAdapter` for an `HttpRequestHandler`;
- and others, such as `SimpleControllerHandlerAdapter` or `HandlerFunctionAdapter`.

The example test registers an `HttpRequestHandler` with the bean name `"/legacy/ping"`. `BeanNameUrlHandlerMapping`, which Spring MVC registers by default, maps beans whose name starts with `/` to a URL. Then it calls it alongside the zones API, and the same servlet serves both.

> [!spring]
> Picking **which** handler serves a URL is the `HandlerMapping`s' job. The `HandlerAdapter`s work out **how** to call it.
@describe: Inside the Spring context, DispatcherServlet calls handle() on the HandlerAdapter interface, highlighted, where RequestMappingHandlerAdapter and HttpRequestHandlerAdapter are plugged in; the latter, highlighted, calls handleRequest() on /legacy/ping.

## @step:recap — Recap
You started with a board tied to one vendor and ended up with:

- **A Target**, `HeartRateMonitor`, in the box's language.
- **One adapter per vendor**, wrapping its SDK and translating ids, units and errors.
- **A client**, `ZoneBoard`, that doesn't know which band anyone wears.
- **The vendor choice** in the configuration.

Don't mix it up with its neighbours: **Decorator** keeps the interface and adds behaviour; **Proxy** keeps the interface and controls access to the object; **Facade** offers a simpler interface to a whole subsystem; **Adapter** turns one interface into another that already exists.

And when you don't need it: if you own both sides, change the interface directly; if the external type already fits what you need, use it as is; and if you only call it from one place, a function that converts the result is sometimes enough.

> [!key-idea]
> When something you don't control doesn't fit your code, don't change your code: write the piece that translates.
@describe: Final view: the coach, the controller, ZoneBoard and HeartRateMonitor with both adapters plugged in, each with its SDK, all inside the Spring context.
