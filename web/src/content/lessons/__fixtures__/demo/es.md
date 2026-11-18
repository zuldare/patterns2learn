---
title: Demo Strategy
summary: Lección de prueba con seis pasos para el build.
minutes: 5
level: beginner
recap:
  intent: Encapsular algoritmos intercambiables detrás de una interfaz.
  participants: [PricingStrategy, PricingService, TenPackPricing]
  pros: [Abierto a extensión]
  cons: [Más clases]
  related: [state]
quiz:
  - { q: ¿Quién elige la estrategia?, options: [El cliente, El mapa de Spring, Nadie], answer: 1, explain: Spring inyecta un mapa por nombre de bean. }
  - { q: ¿Qué es PricingStrategy?, options: [Una clase, Una interfaz, Un enum], answer: 1, explain: Es el contrato común. }
  - { q: ¿Cuánto cuesta un bono de 10?, options: [79, 120, 15], answer: 1, explain: 120 EUR por cada bloque de diez. }
---
## @step:intro — Un cliente pide precio
Un socio del box quiere saber cuánto cuesta su plan.
> [!problem]
> Cada plan calcula el precio de forma distinta.
@describe: Un cliente aparece solo a la izquierda del lienzo.

## @step:interface — El contrato
Todas las tarifas cumplen la interfaz `PricingStrategy`.
@describe: Dentro del contexto de Spring aparece la interfaz PricingStrategy, resaltada.

## @step:service — El servicio
`PricingService` recibe **todas** las estrategias en un mapa.
> [!spring]
> Spring inyecta un `Map<String, PricingStrategy>` con el nombre de cada bean como clave.
@describe: El bloque PricingService aparece junto a la interfaz y queda resaltado.

## @step:request — Llega la petición
El cliente pide el precio del plan `ten-pack`.
@describe: Un paquete con el texto plan=ten-pack viaja del cliente al servicio.

## @step:strategies — Una estrategia concreta
`TenPackPricing` implementa la interfaz y se registra como bean `ten-pack`.
> [!key-idea]
> Añadir un plan es añadir una clase, sin tocar el servicio.
@describe: Aparece el bloque TenPackPricing unido a la interfaz con una flecha de implementación.

## @step:price — El precio vuelve
El servicio delega y devuelve 120.00 EUR.
@describe: Un paquete con el texto 120.00 EUR vuelve del servicio al cliente.
