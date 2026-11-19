---
title: Strategy
summary: Sustituye un switch de tarifas por una estrategia para cada plan y deja que Spring te las inyecte todas en un Map.
minutes: 12
level: beginner
recap:
  intent: Saca cada variante de un mismo cálculo a su propia clase, todas detrás de un contrato común, para poder elegir una u otra (o añadir nuevas) sin tocar el código que las usa.
  participants:
    - Context (PricingService), que recibe las estrategias y delega en la que toca
    - Strategy (PricingStrategy), el contrato común
    - ConcreteStrategy (MonthlyPricing, TenPackPricing, DropInPricing, StudentPricing), una clase por plan
  pros:
    - Open/Closed, un plan nuevo es una clase nueva y no se toca lo que ya funciona
    - Adiós a los condicionales, el switch desaparece
    - Cada estrategia se prueba por separado, con tests pequeños y sin dependencias
  cons:
    - Más clases, aunque cada una sea diminuta
    - El cliente tiene que conocer las claves (monthly, ten-pack…) para pedir la estrategia correcta
  related:
    - State
    - Template Method
    - Factory Method
quiz:
  - q: ¿Qué inyecta Spring en un constructor que recibe un Map<String, PricingStrategy>?
    options:
      - Todos los beans que implementan PricingStrategy, con el nombre de cada bean como clave
      - Solo el bean marcado con @Primary, envuelto en un mapa de un elemento
      - Un mapa vacío que tienes que rellenar tú en un método @PostConstruct
      - Todos los beans que implementan PricingStrategy, con el nombre de la clase como clave
    answer: 0
    explain: Spring busca en el contexto todos los beans de ese tipo y los mete en el mapa usando su nombre de bean. Por eso @Component("ten-pack") hace que la clave sea exactamente ten-pack.
  - q: Quieres añadir la tarifa student. ¿Qué tienes que tocar?
    options:
      - PricingService, para añadir una rama más
      - PricingController y PricingService
      - Solo la nueva clase StudentPricing
      - Una clase de configuración que registre la estrategia a mano
    answer: 2
    explain: Basta con una clase nueva anotada con @Component("student"). Spring la encuentra al arrancar y la añade al mapa; el servicio y el controlador no se enteran.
  - q: ¿En qué se diferencia Strategy de State?
    options:
      - En nada, son el mismo patrón con distinto nombre
      - En Strategy la variante la elige alguien de fuera (aquí, el plan que llega en la petición); en State es el propio objeto el que cambia de comportamiento al cambiar su estado
      - State usa interfaces y Strategy usa herencia
      - Strategy solo sirve para cálculos y State solo para máquinas de estados de la base de datos
    answer: 1
    explain: La estructura se parece mucho, pero la intención no. Con Strategy el cliente decide qué algoritmo usar; con State las transiciones las gestiona el propio objeto y el cliente ni siquiera sabe en qué estado está.
  - q: ¿Cómo sabe DelegatingPasswordEncoder qué algoritmo usar para comprobar una contraseña?
    options:
      - Prueba todos los algoritmos hasta que uno coincide
      - Lo decide según la longitud del hash
      - Usa siempre bcrypt; el prefijo es solo decorativo
      - Lee el prefijo {id} del hash guardado, por ejemplo {bcrypt}, y delega en el encoder con ese id
    answer: 3
    explain: Cada hash guarda delante el id del algoritmo entre llaves. El encoder lo lee, busca en su mapa la estrategia con ese id y le delega el trabajo. Es el mismo truco que nuestro Map de tarifas.
---
## @step:problem — Un switch que no para de crecer
Tu box tiene una pequeña API en Spring Boot para calcular cuánto paga cada atleta. Hoy alguien pregunta por el bono de 10 con 12 sesiones: `GET /api/pricing/quote?plan=ten-pack&sessions=12`.

Hoy hay tres planes:

- **monthly**: 79.00 €, entrenes lo que entrenes.
- **ten-pack**: 120.00 € por cada bloque de 10 sesiones empezado.
- **drop-in**: 15.00 € por sesión, para quien viene de visita.

Todo el cálculo vive en `LegacyPricingService`, dentro de un `switch` por nombre de plan.

> [!problem]
> Cada tarifa es una rama del mismo método. Funciona, sí, pero la lógica de todos los planes está mezclada en una sola clase.
@describe: A la izquierda, el atleta envía un paquete con el texto plan=ten-pack a PricingController, que llama a LegacyPricingService, resaltado en rojo.

## @step:smell — Y ahora llega el descuento de estudiante
El coach quiere una tarifa para estudiantes. ¿Dónde la metes? En el mismo `switch`, claro: otro `case`, otro `return`, y a cruzar los dedos para no romper el bono de 10 de paso.

Cada plan nuevo obliga a abrir, cambiar y volver a probar la clase entera. Si dos personas tocan tarifas a la vez, os toca resolver conflictos en el mismo método.

> [!warning]
> Esto rompe el principio Open/Closed: para **añadir** comportamiento tienes que **modificar** código que ya estaba probado y en producción.
@describe: El diagrama no cambia: LegacyPricingService sigue resaltado en rojo como el punto que hay que tocar con cada plan nuevo.

## @step:interface — Un contrato para todas las tarifas
Lo primero es ponerle nombre a lo que tienen en común todos los planes: dado un `PricingRequest` (plan y sesiones), devuelven un `Money`.

Esa es la interfaz `PricingStrategy`. Un único método, nada más. Quien calcule precios ya no necesita saber *cómo* se calcula cada tarifa, solo que existe alguien que cumple este contrato.

> [!key-idea]
> Depende del contrato, no de la clase concreta. Todo lo demás sale de aquí.
@describe: A la derecha de LegacyPricingService aparece la interfaz PricingStrategy, resaltada.

## @step:strategies — Una clase por plan
Cada rama del `switch` pasa a ser una clase que implementa `PricingStrategy`: `MonthlyPricing`, `TenPackPricing` y `DropInPricing`.

Fíjate en `@Component("ten-pack")`: el nombre del bean es **exactamente** la clave que llega en la URL. No es casualidad, lo vas a aprovechar en el siguiente paso.

La lógica del bono queda aislada y se entiende sola: con 12 sesiones, `Math.ceilDiv(12, 10)` da 2 bloques (redondea hacia arriba), así que 2 × 120.00 €.

> [!key-idea]
> Cada estrategia es pequeña, no depende de las demás y se prueba con un test unitario de tres líneas.
@describe: Alrededor de la interfaz aparecen tres bloques, monthly, ten-pack y drop-in, resaltados y unidos a PricingStrategy con flechas de implementación.

## @step:injection — Spring te trae todas las estrategias
Ahora entra en juego el contexto de Spring. `PricingService` sustituye al servicio antiguo y pide en su constructor un `Map<String, PricingStrategy>`.

No hay que registrar nada a mano: Spring busca todos los beans que implementan la interfaz y te los entrega en ese mapa, con el nombre de cada bean como clave. Con un solo constructor, ni siquiera necesitas `@Autowired`.

> [!spring]
> Inyectar un `Map<String, T>` (o un `List<T>`) viene de serie en Spring: recibes todos los beans de tipo `T` del contexto. El mapa queda así: `monthly → MonthlyPricing`, `ten-pack → TenPackPricing`, `drop-in → DropInPricing`.
@describe: Aparece la plataforma del contexto de Spring bajo todos los bloques. LegacyPricingService desaparece y en su lugar está PricingService, resaltado junto al contexto, unido a la interfaz con un enlace de inyección.

## @step:request — Una petición de principio a fin
Repetimos la petición del principio: plan `ten-pack`, 12 sesiones.

1. El controlador recibe los parámetros y crea un `PricingRequest`.
2. `PricingService` hace `strategies.get("ten-pack")` y obtiene `TenPackPricing`.
3. La estrategia calcula 2 bloques × 120.00 € y devuelve **240.00 €**.

El servicio ya no decide nada: busca y delega. Si alguien pide un plan que no existe, el mapa devuelve `null`, el servicio lanza `UnknownPlanException` y la API responde con un 400.
@describe: El paquete plan=ten-pack viaja del atleta al controlador y del controlador a PricingService; el bloque ten-pack se resalta y un paquete con 240.00 € vuelve de PricingService al controlador.

## @step:extend — Añadir student sin tocar nada
Volvemos a la petición del coach. Esta vez la solución es una clase nueva y punto: `StudentPricing`, registrada como `@Component("student")`, que aplica un 20 % de descuento a la cuota mensual: 79.00 € pasan a ser **63.20 €**.

Ni el servicio ni el controlador cambian. Al arrancar, Spring encuentra el nuevo bean y lo añade al mapa con la clave `student`.

> [!warning]
> El precio de esta flexibilidad: el cliente tiene que conocer las claves. Si escribes `@Component("studen")`, la app arranca sin quejarse y las peticiones con `plan=student` acaban en un 400. Un test por clave te ahorra el susto.
@describe: A la izquierda de ten-pack, cerca del controlador, aparece el bloque student, resaltado y unido a PricingStrategy con una flecha de implementación. El resto del diagrama no cambia.

## @step:spring-does-it — Spring ya lo hace por ti
Lo más probable es que ya uses este patrón sin darte cuenta. `DelegatingPasswordEncoder`, de Spring Security, guarda cada hash con un prefijo que indica el algoritmo: `{bcrypt}…`, `{noop}…`, `{pbkdf2}…`.

Al comprobar una contraseña, lee ese `{id}`, busca en su mapa interno el encoder correspondiente y le delega el trabajo. Es exactamente nuestro `Map<String, PricingStrategy>`, pero con algoritmos de hash.

> [!spring]
> Gracias a esto puedes migrar de algoritmo sin obligar a nadie a cambiar su contraseña: los hashes nuevos se generan con bcrypt y los antiguos se siguen validando con su prefijo. El test del ejemplo lo comprueba con la contraseña `wod-2026`.
@describe: Dentro del contexto de Spring solo queda el bloque DelegatingPasswordEncoder, resaltado; el atleta le envía un paquete con el texto {bcrypt}….

## @step:recap — Resumen
Has pasado de un `switch` que crecía con cada tarifa a esto:

- **Context**: `PricingService`, que recibe las estrategias y delega.
- **Strategy**: `PricingStrategy`, el contrato.
- **ConcreteStrategy**: una clase por plan, registrada con su clave como nombre de bean.

Y la parte más Spring de todas: no has escrito ni una línea para elegir la estrategia. El contenedor monta el mapa por ti.

> [!key-idea]
> Si tienes dos ramas que nunca van a cambiar, un `if` está bien. Cuando las variantes crecen o cambian por separado, conviértelas en estrategias.
@describe: El diagrama completo: el atleta, el controlador y PricingService dentro del contexto de Spring, unido a la interfaz PricingStrategy, que implementan monthly, ten-pack, drop-in y student.
