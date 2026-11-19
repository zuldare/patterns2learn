---
title: Demo Strategy
summary: Six-step test lesson for the build.
minutes: 5
level: beginner
recap:
  intent: Encapsulate interchangeable algorithms behind an interface.
  participants: [PricingStrategy, PricingService, TenPackPricing]
  pros: [Open for extension]
  cons: [More classes]
  related: [state]
quiz:
  - { q: Who picks the strategy?, options: [The client, The Spring map, Nobody], answer: 1, explain: Spring injects a map keyed by bean name. }
  - { q: What is PricingStrategy?, options: [A class, An interface, An enum], answer: 1, explain: It is the common contract. }
  - { q: How much is a ten-pack?, options: ["79", "120", "15"], answer: 1, explain: 120 EUR per block of ten. }
---
## @step:intro — A client asks for a price
A box member wants to know what their plan costs.
> [!problem]
> Every plan computes its price differently.
@describe: A client appears alone on the left of the canvas.

## @step:interface — The contract
Every tariff fulfils the `PricingStrategy` interface.
@describe: Inside the Spring context the PricingStrategy interface appears, highlighted.

## @step:service — The service
`PricingService` receives **every** strategy in a map.
> [!spring]
> Spring injects a `Map<String, PricingStrategy>` keyed by each bean name.
@describe: The PricingService block appears next to the interface and is highlighted.

## @step:request — The request arrives
The client asks for the price of the `ten-pack` plan.
@describe: A packet labelled plan=ten-pack travels from the client to the service.

## @step:strategies — A concrete strategy
`TenPackPricing` implements the interface and registers as bean `ten-pack`.
> [!key-idea]
> Adding a plan means adding a class, without touching the service.
@describe: The TenPackPricing block appears, joined to the interface by an implements arrow.

## @step:price — The price comes back
The service delegates and returns 120.00 EUR.
@describe: A packet labelled 120.00 EUR travels back from the service to the client.
