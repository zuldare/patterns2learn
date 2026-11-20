---
title: Bridge
summary: El box manda recordatorios de clase y de pago por email, SMS o push. Separa qué se dice de cómo se entrega, para que cada lado crezca por su cuenta sin una clase por cada combinación.
minutes: 10
level: intermediate
recap:
  intent: Separa una idea en dos partes que pueden cambiar por separado (lo que se hace y cómo se hace), y únelas con una referencia en lugar de con herencia.
  participants:
    - Abstraction (Reminder), lo que el resto de la app usa; guarda una referencia al canal
    - RefinedAbstraction (ClassReminder, PaymentReminder), cada tipo de recordatorio
    - Implementor (Channel), la interfaz de cómo se entrega un mensaje
    - ConcreteImplementor (EmailChannel, SmsChannel, PushChannel), cada canal con sus reglas
  pros:
    - Recordatorios y canales crecen por separado; cualquier combinación funciona
    - Cada regla vive en un sitio (el recorte del SMS, en el canal)
    - El canal se puede elegir al ejecutar, por ejemplo según la preferencia del socio
  cons:
    - Dos jerarquías y una referencia entre ellas, más que leer que una clase directa
    - Hay que decidir bien qué va en cada lado; si la frontera está mal, se cruzan cosas
    - Si solo hay una dimensión que varía, es estructura de más
    - Si cada canal necesita otra redacción para cada recordatorio, los lados no son independientes y el puente se rompe
  related:
    - Adapter
    - Strategy
    - Abstract Factory
quiz:
  - q: El box añade WhatsApp como canal. ¿Qué cambias?
    options:
      - Una clase por cada recordatorio, como WhatsappClassReminder
      - ClassReminder y PaymentReminder, para que sepan usar WhatsApp
      - Una clase WhatsappChannel que implemente Channel
      - Reminder, para añadirle un método sendByWhatsapp()
    answer: 2
    explain: Los recordatorios hablan con Channel, no con un canal concreto. Un canal nuevo vale para todos los recordatorios que ya existen.
  - q: ¿Y si añades un recordatorio nuevo, el de récord personal?
    options:
      - Una clase PrReminder que extienda Reminder
      - Tres clases, una para cada canal que ya existe
      - Un método nuevo en Channel para los récords
      - Un if en cada canal para dar formato al récord
    answer: 0
    explain: Es la otra mitad del puente. El recordatorio nuevo dice qué contar y cualquier canal lo entrega.
  - q: ¿Por qué el recorte a 160 caracteres está en SmsChannel y no en cada recordatorio?
    options:
      - Porque los recordatorios no tienen acceso a la longitud del texto
      - Para que cada recordatorio pueda elegir su propio límite
      - Porque solo SmsChannel conoce el teléfono del socio
      - Porque es una regla del canal y vale para todos
    answer: 3
    explain: En la versión anterior, cada clase SMS copiaba el recorte y una lo olvidó. Si la regla es del canal, va en el canal y no se puede olvidar.
  - q: ¿Qué relación hay entre RestClient y ClientHttpRequestFactory?
    options:
      - RestClient hereda de la fábrica de peticiones y la amplía
      - RestClient es la API; la fábrica, el transporte que va debajo
      - Son el mismo objeto visto a través de dos interfaces distintas
      - La fábrica solo se usa en los tests con MockRestServiceServer
    answer: 1
    explain: Escribes el mismo código con RestClient y eliges debajo el cliente HTTP (java.net.http.HttpClient, HttpURLConnection, Apache, Jetty…). Es un puente entre la API y el transporte.
---
## @step:problem — Una clase por combinación
El box manda dos tipos de recordatorio, el de la **clase** de mañana y el del **pago** de la cuota, y los manda por **email** o por **SMS**. La primera versión tiene una clase para cada combinación: `EmailClassReminder`, `SmsClassReminder`, `EmailPaymentReminder` y `SmsPaymentReminder`.

Ahora llega el push. Son dos clases más. Y un tercer tipo de recordatorio serían tres más. Las clases crecen como una tabla: tipos × canales.

> [!problem]
> Dos cosas que cambian por separado (qué se dice y cómo se envía) están mezcladas en cada clase.
@describe: Cuatro clases en cuadrícula, una por combinación: EmailClassReminder, SmsClassReminder, EmailPaymentReminder y SmsPaymentReminder, todas resaltadas.

## @step:smell — Copias que se separan
Cada clase SMS repite las mismas reglas del canal, como el límite de 160 caracteres. `SmsPaymentReminder` se copió de `SmsClassReminder`… sin el recorte. Un recordatorio de pago con una nota larga sale entero y el operador lo parte en dos mensajes. El test `OneClassPerCombinationTest` lo demuestra.

> [!warning]
> Cuando una regla de "cómo se envía" está copiada en cada "qué se envía", tarde o temprano una copia se queda atrás.
@describe: SmsPaymentReminder aparece resaltado en rojo: su copia del texto SMS no recorta a 160 caracteres.

## @step:abstraction — Lo que se dice
Bridge parte las clases en dos lados. El primero es la **abstracción**, `Reminder`: decide el título y el cuerpo del mensaje.

No hereda de ningún canal: **tiene** uno (`channel`) y, al enviar, le pasa el título y el cuerpo. Esa referencia es el "puente".

> [!key-idea]
> En lugar de heredar el canal, el recordatorio lo tiene. Así se puede combinar con cualquiera.
@describe: Aparece Reminder, resaltado, con ClassReminder y PaymentReminder; Reminder llama a channel.deliver(…) a través del puente.

## @step:implementor — Cómo se entrega
El otro lado es la **implementación**, `Channel`: recibe un título y un cuerpo y los entrega a un socio. `EmailChannel`, `SmsChannel` y `PushChannel` saben a qué dirección mandar y cómo dar formato.

Ningún canal sabe qué es una clase ni un pago.
@describe: Aparece la interfaz Channel, resaltada, con EmailChannel, SmsChannel y PushChannel implementándola.

## @step:refined — Cada recordatorio, su texto
`ClassReminder` y `PaymentReminder` son las **abstracciones refinadas**: solo escriben su título y su cuerpo ("Class tomorrow", "Hyrox prep at 18:00…"). No saben por qué canal van a salir.
@describe: ClassReminder y PaymentReminder, resaltados, extienden Reminder.

## @step:channel-rules — Cada regla, en su sitio
El límite de 160 caracteres es cosa del SMS, así que vive en `SmsChannel`, una sola vez. Vale para el recordatorio de clase, para el de pago con una nota larga y para cualquiera que venga. Cuenta caracteres reales (code points), así que nunca parte un emoji por la mitad. El push recorta el título a 40 y el cuerpo a 120; el email no recorta nada.

(160 es una simplificación: un SMS de verdad cuenta septetos GSM-7, el `€` vale por dos y cualquier carácter fuera de GSM-7 baja el límite a 70.)
@describe: SmsChannel, resaltado, aplica su límite de 160 caracteres a cualquier recordatorio.

## @step:combine — Cualquier combinación
Con dos tipos de recordatorio y tres canales hay seis combinaciones, y no hay ni una clase por combinación: `new ClassReminder(sms, …)` o `new PaymentReminder(sms, …)`. Un test recorre las seis.

> [!key-idea]
> Un canal nuevo vale para todos los recordatorios, y un recordatorio nuevo, para todos los canales. Las clases crecen como una suma, no como una tabla.
@describe: ClassReminder, PaymentReminder y SmsChannel, resaltados: los dos recordatorios salen por SMS a través del puente.

## @step:request — Cada socio, su canal
En Spring, cada canal es un bean, y `ReminderService` recibe la lista de todos los `Channel` y los indexa por su `name()` (`"email"`, `"sms"`, `"push"`). Cada socio tiene su canal preferido: Ana email, Leo SMS, Eva push.

`POST /api/reminders` con Leo y "class": el servicio crea un `ClassReminder` con el canal de Leo y lo envía al +34600000002. Con `"channel": "email"` en la petición, el mismo recordatorio sale por email; sin canal, o con uno en blanco, se usa el preferido.
@describe: POST /api/reminders viaja de recepción al controlador y remind("leo", "class") al servicio, que crea un ClassReminder con el canal SMS; ReminderService y SmsChannel aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
Con `RestClient` escribes siempre lo mismo: `get().uri(…).retrieve()`. Debajo, un `ClientHttpRequestFactory` decide qué cliente HTTP hace el trabajo: el de `java.net.http` (`JdkClientHttpRequestFactory`), el clásico `HttpURLConnection` (`SimpleClientHttpRequestFactory`), Apache, Jetty o Reactor.

El test hace la misma llamada con dos transportes distintos contra el propio servidor y obtiene la misma respuesta. Y el `RestClient.Builder` que te da Spring Boot elige uno por sí mismo según el classpath (Apache, Jetty, Reactor Netty, el del JDK y, como último recurso, `HttpURLConnection`).

Es un puente "degenerado": del lado de la abstracción solo hay una clase (`RestClient` no tiene subtipos refinados), y la implementación es una fábrica de peticiones.

> [!spring]
> `RestClient` es la abstracción y la fábrica de peticiones, la implementación. Puedes cambiar el cliente HTTP sin tocar ni una línea del código que hace las llamadas.
@describe: RestClient, resaltado, crea sus peticiones con ClientHttpRequestFactory, también resaltada, que puede ser la del JDK o la de HttpURLConnection.

## @step:recap — Resumen
Empezaste con una clase por combinación y acabaste con:

- **Una abstracción**, `Reminder`, que tiene un canal en lugar de heredarlo.
- **Una implementación**, `Channel`, con una clase por canal y sus reglas dentro.
- **Combinaciones libres**: tipos de recordatorio y canales crecen por separado.

No lo confundas con sus vecinos: un **Adapter** encaja algo que ya existe y no encajaba; un Bridge se diseña desde el principio para que dos lados cambien por separado. Con **Strategy** la forma es casi igual, y aquí `Channel` lo parece: un solo método, inyectado. Lo que lo hace Bridge es la intención: *los dos* lados son jerarquías pensadas para crecer por separado. En el libro, además, la implementación suele ofrecer operaciones más básicas que la abstracción combina; aquí la hemos simplificado a un único `deliver`. Por cierto, `send()` final con `title()` y `body()` como ganchos es un **Template Method** dentro de la abstracción. Y una **Abstract Factory** puede ser la que elija qué implementación usar.

Y cuándo no hace falta: si solo hay un canal, o solo un tipo de recordatorio, una clase directa es más sencilla. Y si cada canal necesita otra redacción para cada recordatorio, los dos lados no son independientes: el puente hace agua, y te irán mejor plantillas por canal.

> [!key-idea]
> Cuando algo varía en dos direcciones a la vez, separa las dos direcciones y únelas con una referencia.
@describe: Vista final: recepción, el controlador, ReminderService, los dos recordatorios con Reminder y los tres canales con Channel, unidos por el puente, todo dentro del contexto de Spring.
