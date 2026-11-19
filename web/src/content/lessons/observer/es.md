---
title: Observer
summary: Un récord personal tiene que avisar al atleta, mover el ranking y dar una insignia. Publica un evento y deja que cada parte reaccione por su cuenta, sin que el servicio sepa quién escucha.
minutes: 12
level: beginner
recap:
  intent: Define una dependencia uno a muchos para que, cuando un objeto cambia, todos los interesados se enteren sin que ese objeto los conozca.
  participants:
    - Subject (ResultService, o ManualPrSubject en la versión a mano), que detecta el cambio y avisa
    - Observer (PrObserver, o cualquier método @EventListener), el contrato de quien quiere enterarse
    - ConcreteObserver (NotificationListener, LeaderboardListener, BadgeListener), que reaccionan a su manera
    - Event (PersonalRecordEvent), lo que viaja de uno a otros
  pros:
    - El servicio no conoce a quien escucha, así que añadir una reacción no lo toca
    - Cada reacción vive en su clase y se prueba por separado
    - Con @Async, las reacciones lentas no frenan a quien publica
  cons:
    - Es más difícil seguir el flujo, porque la llamada ya no se ve en el código
    - Por defecto todo es síncrono y una excepción en un listener llega al que publica
    - El orden entre listeners no está garantizado salvo que lo fijes con @Order
  related:
    - Mediator
    - Chain of Responsibility
    - Command
quiz:
  - q: Con @EventListener y sin nada más, ¿cuándo se ejecuta el listener?
    options:
      - Más tarde, en un hilo aparte
      - En el mismo hilo, dentro de publishEvent(), antes de que siga el código que publicó
      - Cuando el contexto de Spring se cierra
      - Solo si la transacción hace commit
    answer: 1
    explain: Los eventos de Spring son síncronos por defecto. publishEvent() llama a cada listener y solo vuelve cuando han terminado; si uno lanza una excepción, le llega al que publicó.
  - q: Quieres que el aviso de "nuevo PR" no retrase la respuesta. ¿Qué haces?
    options:
      - Mover el envío dentro de ResultService
      - Llamar a publishEvent() dos veces
      - Usar @Order(1) en el listener
      - Anotar el listener con @Async y activar @EnableAsync
    answer: 3
    explain: Con @Async, Spring entrega el evento a ese listener en otro hilo, así que publishEvent() ya no espera por él (los listeners síncronos sí se ejecutan antes de volver). Ideal para trabajo lento de entrada/salida, como mandar notificaciones.
  - q: Mañana quieres además mandar un email al coach con cada PR. ¿Qué tocas?
    options:
      - Solo una clase nueva con un método @EventListener que reciba PersonalRecordEvent
      - ResultService, para añadir la llamada al email
      - El controlador, para que llame al servicio de email después de record()
      - Una configuración que registre el nuevo listener en el publicador
    answer: 0
    explain: Spring descubre los métodos @EventListener de cualquier bean y los suscribe solo. El servicio publica el mismo evento de siempre y no se entera de que hay alguien más escuchando.
  - q: ¿Qué diferencia hay entre el Observer clásico y los eventos de Spring?
    options:
      - El clásico no sirve para Java
      - Los eventos de Spring no usan el patrón Observer
      - En el clásico el subject guarda su lista de observers y los llama; en Spring lo hace el publicador de eventos del contexto
      - En Spring cada listener tiene que implementar una interfaz de Spring
    answer: 2
    explain: Es el mismo patrón con el trabajo de fontanería hecho por el contexto. Spring guarda quién escucha qué tipo de evento y se lo entrega; tus clases solo publican o escuchan.
---
## @step:problem — Un PR que lo dispara todo
Ana acaba de hacer 105 kg de sentadilla trasera, cinco más que su mejor marca. Un récord personal significa tres cosas:

- **Avisarla** con una notificación.
- **Actualizar el ranking** de ese ejercicio.
- **Darle la insignia** "PR club".

En la versión acoplada, `CoupledResultService` hace las tres cosas llamando directamente a cada servicio, uno detrás de otro.

> [!problem]
> El servicio de resultados depende de todos los interesados y los llama uno a uno. Cada reacción nueva es una dependencia y una línea más en este método.
@describe: El atleta envía 105 kg a LiftController, que llama a CoupledResultService, resaltado en rojo; este llama directamente a Notifier, Leaderboard y Badges.

## @step:smell — Si falla la insignia, se pierde el PR
El servicio de insignias está caído y `award()` lanza una excepción. Como todo va en el mismo método, el `best.put(...)` de la línea siguiente **no llega a ejecutarse**: el PR de Ana no queda guardado.

El test del ejemplo lo demuestra. Una función secundaria (una insignia) ha tumbado la principal (registrar el resultado).

> [!warning]
> Cuanto más sabe una clase de sus vecinos, más formas tiene de romperse por culpa de ellos.
@describe: El paquete award() ✗ sale de CoupledResultService hacia Badges, resaltado: la llamada falla.

## @step:gof — Observer: avisa, no llames
El patrón Observer invierte la relación:

- `PrObserver` es el contrato: `onRecord(event)`.
- Cada interesado lo implementa a su manera.
- `ManualPrSubject` guarda una **lista de observers**, deja que se apunten con `subscribe()` y, cuando hay un PR, recorre la lista y avisa a todos.

El subject ya no sabe si hay uno, tres o ninguno, ni qué hace cada uno.

> [!key-idea]
> El que cambia publica *que* ha pasado algo; los interesados deciden *qué* hacer con ello.
@describe: Aparecen ManualPrSubject y la interfaz PrObserver, resaltados; dos observers, el del ranking y el de las insignias, la implementan y el subject envía onRecord() a la interfaz.

## @step:spring-events — El contexto ya es un publicador
No hace falta escribir la lista de suscriptores: el **contexto de Spring** ya la tiene. `ResultService` recibe un `ApplicationEventPublisher` y, cuando detecta un PR, hace:

`events.publishEvent(new PersonalRecordEvent(...))`

Y nada más. No hay campos para notificaciones, ranking ni insignias.

> [!spring]
> Cualquier objeto puede ser un evento: aquí, un `record` normal, sin heredar de `ApplicationEvent` (hace años era obligatorio). Spring lo entrega a todos los métodos que lo esperan.
@describe: Aparece el contexto de Spring con ResultService y ApplicationEventPublisher, resaltado junto al contexto, que está unido a los tres listeners.

## @step:listeners — Escuchar es una anotación
Cada interesado es un bean con un método `@EventListener` que recibe el tipo de evento que le interesa:

- `LeaderboardListener` actualiza el ranking.
- `BadgeListener` da la insignia "PR club".
- `NotificationListener` prepara el mensaje "nuevo PR".

Spring los encuentra al arrancar y los suscribe solo, sin interfaces ni registro manual.

> [!key-idea]
> ¿Una reacción nueva, como un email al coach? Una clase nueva con un `@EventListener`. `ResultService` ni se entera.
@describe: Los tres listeners, NotificationListener, LeaderboardListener y BadgeListener, aparecen resaltados.

## @step:request — Un PR de principio a fin
Ana registra sus 105 kg:

1. `POST /api/lifts` llega al controlador, que llama a `record()`.
2. `ResultService` guarda la nueva marca y ve que supera los 100 kg anteriores.
3. Publica un `PersonalRecordEvent`.
4. El ranking pone a Ana con 105 kg, recibe la insignia y le llega el mensaje "new PR in Back squat, 105 kg (+5)".

> [!key-idea]
> El test del ejemplo comprueba las tres reacciones a partir de una sola llamada a `record()`.
@describe: 105 kg viaja del atleta al controlador, record() a ResultService, resaltado, PR event al publicador y de ahí a LeaderboardListener y BadgeListener.

## @step:sync — Ojo: es síncrono
Un detalle que sorprende: por defecto, `publishEvent()` llama a cada listener **en el mismo hilo**, uno detrás de otro, y no vuelve hasta que terminan.

Así que si un listener lanza una excepción, le llega a quien publicó. El test del ejemplo usa una impresora de insignias rota y `record()` falla con ella.

Ojo, porque el problema del paso 2 **no ha desaparecido del todo**. La marca ya está guardada (el evento se publica después), pero el `POST` responde con un 500, los listeners que iban detrás no se ejecutan y, si el atleta reintenta, ya no cuenta como PR.

> [!warning]
> Tres remedios, según el caso. Captura los errores dentro del listener si su fallo no debe afectar a nadie. Hazlo asíncrono (siguiente paso) si además es lento. Y si trabajas con base de datos, `@TransactionalEventListener` lo ejecuta solo cuando la transacción se confirma; sin transacción activa no se ejecuta, salvo que pongas `fallbackExecution = true`.
@describe: El evento llega del servicio al publicador y una excepción vuelve desde BadgeListener, resaltado, hacia el publicador.

## @step:async — Lo lento, en otro hilo
Mandar una notificación es lento: hay red y un servicio externo de por medio. Con `@Async` en el listener (y `@EnableAsync` en la aplicación), Spring le entrega el evento en **otro hilo**, y `record()` responde sin esperarlo.

> [!spring]
> El ranking y la insignia siguen siendo síncronos porque son rápidos y en memoria. Elige por listener: síncrono si debe pasar antes de responder, `@Async` si puede pasar después.

> [!warning]
> Una excepción en un listener `@Async` ya no le llega a nadie: la recibe el `AsyncUncaughtExceptionHandler`, que por defecto solo la escribe en el log. Si el aviso importa, reintenta dentro del listener o guárdalo para reenviarlo.
@describe: El evento viaja del publicador a NotificationListener, resaltado, que lo procesa en otro hilo.

## @step:spring-does-it — Spring ya lo hace por ti
El propio Spring se comunica así. El `ApplicationContext` publica `ContextRefreshedEvent` al arrancar y `ContextClosedEvent` al cerrar, y Spring Boot añade `ApplicationReadyEvent`, `WebServerInitializedEvent`… Tu código se engancha con el mismo `@EventListener`.

> [!spring]
> El test del ejemplo escucha el arranque y el cierre del contexto: "context ready" al abrir y "save today's leaderboard" al cerrar, sin que nadie llame a esos métodos.
@describe: Dentro del contexto de Spring, ApplicationContext, resaltado, envía ContextRefreshedEvent al publicador de eventos, también resaltado.

## @step:recap — Resumen
Empezaste con un servicio que llamaba a todos y acabaste con:

- **Un evento**, `PersonalRecordEvent`, publicado con una línea.
- **Listeners independientes**, cada uno con su `@EventListener`.
- **Síncrono por defecto**, con `@Async` o `@TransactionalEventListener` cuando haga falta, y sabiendo adónde van los errores en cada caso.
- **Cero acoplamiento**: añadir una reacción no toca el servicio.

> [!key-idea]
> Cuando "cuando pase X, haz Y, Z y W" empieza a crecer, publica X y deja que Y, Z y W se suscriban.
@describe: Vista final: el atleta, el controlador, ResultService y el publicador de eventos repartiendo el PR a los tres listeners, todo dentro del contexto de Spring.
