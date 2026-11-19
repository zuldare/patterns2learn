---
title: Adapter
summary: El box cambia de bandas de pulso y el nuevo fabricante habla otro idioma. Define la interfaz que tu app necesita y escribe un adaptador por fabricante, sin tocar ni su SDK ni tu código.
minutes: 11
level: beginner
recap:
  intent: Convierte la interfaz de una clase en la que espera el cliente, para que colaboren clases que de otro modo no podrían por tener interfaces incompatibles.
  participants:
    - Target (HeartRateMonitor), la interfaz que el cliente necesita, en sus propios términos
    - Adaptee (PulseBandClient, HeartLinkHub), la clase existente con otra interfaz, que no puedes cambiar
    - Adapter (PulseBandMonitor, HeartLinkMonitor), que implementa el Target y traduce cada llamada al Adaptee que envuelve
    - Client (ZoneBoard), que solo conoce el Target
  pros:
    - El código del fabricante no se cuela en tu dominio, con sus tipos, unidades y errores
    - Cambiar de fabricante es escribir otro adaptador, no reescribir el cliente
    - Cada traducción vive en una clase pequeña y fácil de probar
  cons:
    - Una capa más que leer, y una clase por cada cosa que adaptas
    - Si la interfaz que diseñas copia la del fabricante, solo has cambiado los nombres
    - Algunas diferencias no se traducen bien (un SDK sin marca de tiempo, por ejemplo) y hay que decidir qué hacer
  related:
    - Facade
    - Decorator
    - Proxy
quiz:
  - q: ¿Qué hace exactamente PulseBandMonitor?
    options:
      - Hereda de PulseBandClient y sobrescribe sus métodos
      - Añade funciones nuevas a PulseBandClient sin cambiar su interfaz
      - Implementa HeartRateMonitor y traduce cada llamada al PulseBandClient que envuelve, con sus unidades y sus errores
      - Sustituye a PulseBandClient, que deja de usarse
    answer: 2
    explain: Es un adaptador de objeto. Recibe "current(ana)" en el idioma del box, lo convierte en latestBeat con el número de serie, pasa de latidos por segundo a por minuto y convierte el error del fabricante en "sin señal".
  - q: El box cambia las bandas PulseBand por correas HeartLink. ¿Qué cambias?
    options:
      - Un adaptador nuevo, HeartLinkMonitor, y una propiedad de configuración; ZoneBoard y el controlador no cambian
      - ZoneBoard, para que sepa leer el texto de HeartLink
      - HeartRateMonitor, para añadir los métodos de HeartLink
      - El SDK de HeartLink, para que se parezca al de PulseBand
    answer: 0
    explain: El cliente solo conoce HeartRateMonitor. Con box.monitors.vendor=heartlink, Spring registra el otro adaptador y el resto del código ni se entera.
  - q: ¿Por qué el adaptador envuelve el SDK en lugar de heredar de él?
    options:
      - Porque es más rápido en tiempo de ejecución
      - Porque Spring no puede inyectar clases que heredan de otras
      - Porque en Java no se puede heredar de clases de otro paquete
      - Porque solo se puede heredar de una clase, la del SDK puede ser final y, al heredar, todos sus métodos quedarían a la vista del resto del código
    answer: 3
    explain: El GoF describe también el adaptador de clase, que hereda del adaptee. En Java casi siempre se usa el de objeto, que lo envuelve y solo expone la interfaz que tú has decidido.
  - q: ¿Para qué usa el DispatcherServlet los HandlerAdapter?
    options:
      - Para convertir el JSON de la petición en objetos
      - Para llamar del mismo modo a handlers de tipos distintos, como métodos @GetMapping o un HttpRequestHandler, preguntando a cada adaptador si lo soporta
      - Para elegir qué controlador atiende cada URL
      - Para adaptar las respuestas a cada navegador
    answer: 1
    explain: Elegir el handler para cada URL es trabajo de los HandlerMapping. Una vez elegido, el DispatcherServlet busca el HandlerAdapter que dice supports(handler) y le pide handle(), sin saber de qué tipo es el handler.
---
## @step:problem — La pizarra de zonas
Durante la clase, la pantalla del box muestra en qué **zona de pulso** va cada atleta (de la 1 a la 5, según el porcentaje de su pulso máximo). Ana lleva una banda **PulseBand** y la app usa el SDK del fabricante, `PulseBandClient`.

La primera versión, `VendorBoundZoneBoard`, llama al SDK directamente: busca el número de serie de la banda, llama a `latestBeat(...)`, convierte **latidos por segundo** en latidos por minuto y los milisegundos en un `Instant`.

> [!problem]
> La pizarra habla el idioma de PulseBand: sus números de serie, sus unidades y sus excepciones.
@describe: El coach pide GET /zones/ana a ZoneController, que llama a VendorBoundZoneBoard, resaltado en rojo; este llama directamente a PulseBandClient con latestBeat("PB-0042").

## @step:smell — Llegan las correas nuevas
El box cambia a correas **HeartLink**, que se leen desde un hub en la pared. Su SDK no se parece en nada:

- Las correas se identifican por **canal de radio**, no por número de serie.
- `readSample(3)` devuelve **texto**: `"HR=171;T=1700000000"`, con el tiempo en **segundos**.
- Sin señal no lanza una excepción, devuelve `"NO_SIGNAL"`.

Todas las líneas resaltadas dependen de PulseBand. Habría que reescribir la pizarra, y volver a hacerlo con el siguiente fabricante.

> [!warning]
> Cuando los tipos de una librería externa se reparten por tu código, cambiar de proveedor deja de ser una decisión y pasa a ser un proyecto.
@describe: Aparece HeartLinkHub junto a PulseBandClient. VendorBoundZoneBoard y HeartLinkHub, resaltados, no encajan: readSample(3) no se parece a nada de lo que la pizarra sabe usar.

## @step:target — Primero, lo que tú necesitas
Adapter empieza por tu lado: define la interfaz que la pizarra necesita, **en sus propios términos**. Eso es `HeartRateMonitor`:

- recibe el id del atleta, no un número de serie ni un canal;
- devuelve un `HeartRate` en latidos por minuto, con su `Instant`;
- si no hay señal, devuelve `Optional.empty()`.

No sale ningún tipo de ningún fabricante. Es el **Target** del patrón.

> [!key-idea]
> Diseña la interfaz pensando en quien la usa, no copiando la del primer SDK que tengas a mano.
@describe: Aparece la interfaz HeartRateMonitor, resaltada, y ZoneBoard le pide current("ana").

## @step:adapter — Un adaptador por fabricante
`PulseBandMonitor` implementa `HeartRateMonitor` y **envuelve** un `PulseBandClient`. Cada llamada se traduce:

- el id del atleta pasa a número de serie;
- latidos por segundo, a latidos por minuto, y milisegundos, a `Instant`;
- la `PulseBandException` del fabricante, a "sin señal".

El SDK no cambia y la pizarra tampoco. Toda la traducción vive en esta clase.

> [!key-idea]
> El adaptador habla los dos idiomas: hacia dentro, el de tu app; hacia fuera, el del fabricante.
@describe: PulseBandMonitor, resaltado, se enchufa a HeartRateMonitor. ZoneBoard pide current("ana") y el adaptador llama a PulseBandClient con latestBeat("PB-0042").

## @step:client — La pizarra ya no sabe de fabricantes
En Spring, `ZoneBoard` recibe un `HeartRateMonitor` por el constructor. Pide el pulso, calcula la zona con el pulso máximo del atleta y ya está.

No importa nada de `vendor.pulseband` ni de `vendor.heartlink`. El SDK y su adaptador se declaran como beans en una clase `@Configuration` aparte, que es el único sitio donde aparece el nombre del fabricante.
@describe: Aparece el contexto de Spring. ZoneBoard, resaltado junto al contexto, está unido a HeartRateMonitor, en el que está enchufado PulseBandMonitor, que usa PulseBandClient.

## @step:request — Ana, en zona 4
La banda de Ana marca 2,6 latidos por segundo:

1. `GET /api/zones/ana` llega a `ZoneController`, que llama a `ZoneBoard`.
2. `ZoneBoard` pide `current("ana")` a su `HeartRateMonitor`.
3. `PulseBandMonitor` lo traduce: número de serie `PB-0042`, 2,6 × 60 = **156 bpm**.
4. Con un máximo de 190, es el 82 %: **zona 4**.

> [!key-idea]
> El cálculo de la zona usa bpm y nada más. Las unidades del fabricante se quedaron en el adaptador.
@describe: GET /zones/ana viaja del coach al controlador, zoneOf("ana") a ZoneBoard, current() a la interfaz, y PulseBandMonitor, resaltado con ZoneBoard, lee 2.6 beats/s de PulseBandClient.

## @step:heartlink — El segundo adaptador
Para HeartLink escribes `HeartLinkMonitor`, otro adaptador del mismo Target:

- busca el **canal** del atleta y llama a `readSample(canal)`;
- si recibe `"NO_SIGNAL"`, devuelve vacío;
- si no, interpreta `"HR=171;T=1700000000"` y convierte los segundos en un `Instant`.

Y si el texto no se puede leer, no se inventa un pulso: lanza `MonitorException`, que la API devuelve como 502 porque el fallo es del dispositivo, no de quien pregunta.

> [!warning]
> Un adaptador también traduce los **errores**. Si deja pasar las excepciones del fabricante, el cliente vuelve a depender de él.
@describe: HeartLinkMonitor, resaltado, se enchufa a HeartRateMonitor junto a PulseBandMonitor y lee de HeartLinkHub con readSample(3).

## @step:switch — Cambiar de fabricante es configuración
Cada fabricante tiene su `@Configuration` con `@ConditionalOnProperty`:

- `PulseBandConfig` está activa si no se dice nada (`matchIfMissing = true`).
- `HeartLinkConfig`, con `box.monitors.vendor=heartlink`.

Cambias una línea de `application.properties`, Spring registra el otro SDK y el otro adaptador, y `ZoneBoard` recibe un `HeartRateMonitor` distinto sin enterarse. El test `HeartLinkWiringTest` lo comprueba.

> [!spring]
> Con un adaptador por proveedor y una condición en la configuración, el proveedor se elige al desplegar, no al programar.
@describe: Con la propiedad heartlink, el contexto de Spring tiene HeartLinkMonitor, resaltado, enchufado en lugar de PulseBandMonitor. GET /zones/ana llega igual y el adaptador lee "HR=171;T=…" de HeartLinkHub.

## @step:spring-does-it — Spring ya lo hace por ti
El `DispatcherServlet` atiende handlers muy distintos: métodos `@GetMapping` de un `@RestController`, un `HttpRequestHandler` de los de antes, funciones de rutas… No sabe llamar a ninguno directamente. Para cada handler busca el **`HandlerAdapter`** que responde `true` a `supports(handler)` y le pide `handle(...)`:

- `RequestMappingHandlerAdapter` para los métodos `@RequestMapping` (y `@GetMapping`, `@PostMapping`…);
- `HttpRequestHandlerAdapter` para un `HttpRequestHandler`;
- y otros, como `SimpleControllerHandlerAdapter` o `HandlerFunctionAdapter`.

El test del ejemplo registra un `HttpRequestHandler` llamado `"/legacy/ping"` y lo llama junto a la API de zonas. El mismo servlet atiende a los dos.

> [!spring]
> Elegir **qué** handler atiende una URL es trabajo de los `HandlerMapping`. Los `HandlerAdapter` resuelven **cómo** llamarlo.
@describe: Dentro del contexto de Spring, DispatcherServlet llama a handle() en la interfaz HandlerAdapter, resaltada, en la que están enchufados RequestMappingHandlerAdapter y HttpRequestHandlerAdapter; este último, resaltado, llama a handleRequest() en /legacy/ping.

## @step:recap — Resumen
Empezaste con una pizarra atada a un fabricante y acabaste con:

- **Un Target**, `HeartRateMonitor`, en el idioma del box.
- **Un adaptador por fabricante**, que envuelve su SDK y traduce ids, unidades y errores.
- **Un cliente**, `ZoneBoard`, que no sabe qué banda lleva nadie.
- **La elección del fabricante** en la configuración.

No lo confundas con sus vecinos: **Decorator** mantiene la interfaz y añade comportamiento; **Facade** ofrece una interfaz más sencilla para un subsistema entero; **Adapter** convierte una interfaz en otra que ya existe.

> [!key-idea]
> Cuando algo que no controlas no encaja con tu código, no cambies tu código: escribe la pieza que traduce.
@describe: Vista final: el coach, el controlador, ZoneBoard y HeartRateMonitor con los dos adaptadores enchufados, cada uno con su SDK, todo dentro del contexto de Spring.
