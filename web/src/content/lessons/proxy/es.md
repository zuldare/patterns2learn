---
title: Proxy
summary: Reservar plaza en una clase son dos escrituras que van juntas o no van. Mira cómo un proxy añade la transacción sin tocar tu servicio, y por qué @Transactional es exactamente eso.
minutes: 12
level: intermediate
recap:
  intent: Pon delante de un objeto un sustituto con su misma interfaz que controla el acceso a él y añade trabajo antes y después de cada llamada, sin que el cliente note la diferencia.
  participants:
    - Subject (BookingOperations en la versión a mano; en Spring, la propia clase BookingService), el contrato que comparten el objeto real y su proxy
    - RealSubject (PlainBookingService o BookingService), que hace el trabajo de verdad
    - Proxy (TxBookingProxy o el proxy que genera Spring), que abre la transacción, delega y confirma o deshace
    - Cliente (BookingController), que habla con el proxy creyendo que es el servicio
  pros:
    - El servicio solo tiene lógica de negocio; la transacción vive aparte
    - El cliente no cambia, porque el proxy cumple el mismo contrato
    - Con Spring, una anotación sustituye a una clase proxy por cada servicio
  cons:
    - La magia es invisible y cuesta depurar si no sabes que hay un proxy
    - Las llamadas internas (this.metodo()) se saltan el proxy
    - Los métodos privados o final no se pueden interceptar
  related:
    - Decorator
    - Adapter
    - Facade
quiz:
  - q: Spring inyecta un BookingService con un método @Transactional. ¿Qué recibe realmente el controlador?
    options:
      - La instancia de BookingService, y la transacción la gestiona el driver JDBC
      - Una copia nueva de BookingService por cada petición
      - Un proxy que abre la transacción, llama al BookingService real y confirma o deshace
      - Un BookingService con el código de la transacción copiado dentro al compilar
    answer: 2
    explain: Al arrancar, Spring ve @Transactional y registra en el contexto un proxy en lugar del objeto real. El controlador llama al proxy, que envuelve la llamada en BEGIN/COMMIT o ROLLBACK.
  - q: bookPair() no tiene @Transactional y llama dos veces a this.book(), que sí lo tiene. ¿Qué pasa?
    options:
      - Las dos llamadas a book() se ejecutan sin transacción, porque this es el objeto real y no el proxy
      - Cada book() abre su propia transacción, como siempre
      - Spring detecta la llamada interna y abre una transacción para las dos
      - No compila, no se puede llamar a un método @Transactional desde la misma clase
    answer: 0
    explain: El proxy solo intercepta las llamadas que llegan desde fuera. Dentro del objeto real, this.book() es una llamada Java normal y la anotación no hace nada. El test del ejemplo lo demuestra con una reserva que no se deshace.
  - q: ¿Qué diferencia a un Proxy de un Decorator, si los dos envuelven a otro objeto con la misma interfaz?
    options:
      - El Proxy solo funciona con interfaces y el Decorator solo con clases
      - El Decorator no puede llamar al objeto envuelto
      - Ninguna, son el mismo patrón
      - La intención; el Proxy controla el acceso al objeto (transacciones, permisos, carga perezosa) y el Decorator le añade funcionalidad visible
    answer: 3
    explain: La estructura es casi idéntica. Un Proxy suele venir impuesto desde fuera y el cliente no sabe que está ahí; un Decorator se compone a propósito para enriquecer el comportamiento.
  - q: Con ProxyFactory envuelves un objeto que implementa una interfaz. ¿Qué tipo de proxy crea Spring?
    options:
      - Un proxy CGLIB, porque es el único que existe
      - Un proxy dinámico de la JDK, que implementa la misma interfaz
      - Ninguno, ProxyFactory solo sirve para clases sin interfaz
      - Una subclase generada en tiempo de compilación
    answer: 1
    explain: ProxyFactory, si el objeto implementa una interfaz, crea por defecto un proxy dinámico de la JDK. Ojo, en una app Spring Boot los proxies de @Transactional usan CGLIB por defecto aunque haya interfaz, y así puedes inyectar la clase concreta. Los dos interceptan igual las llamadas públicas que llegan desde fuera.
---
## @step:problem — Una reserva, dos escrituras
Reservar plaza en la clase de las 18:00 son **dos** cambios en la base de datos: insertar la reserva y restar una plaza libre.

Tienen que ir juntos. Si la clase ya está llena, la reserva no puede quedarse a medias, así que hace falta una **transacción**. La versión manual la abre, la confirma y la deshace a mano dentro del propio servicio.

> [!problem]
> La lógica de negocio (dos líneas) está enterrada entre `getTransaction`, `commit`, `rollback` y un `try/catch`.
@describe: El atleta envía POST booking a BookingController, que llama a ManualTxBookingService, resaltado en rojo, y este a la base de datos.

## @step:smell — Y otra vez, en cada método
Cancelar una reserva también son dos escrituras: borrar la reserva y devolver la plaza. Así que `cancel()` repite **la misma ceremonia**: abrir, intentar, confirmar, capturar, deshacer.

Cada método nuevo la copia otra vez, y basta olvidarse de un `rollback` en un `catch` para dejar la base de datos inconsistente.

> [!warning]
> Mezclar *qué* hace el método con *cómo* se protege hace que las dos cosas sean más difíciles de leer, de probar y de cambiar.
@describe: El diagrama no cambia. ManualTxBookingService sigue resaltado en rojo como el sitio donde se repite el código de la transacción.

## @step:gof-proxy — Un sustituto con la misma cara
El patrón Proxy separa las dos cosas:

- `BookingOperations` es el contrato: `book(sessionId, athlete)`.
- `PlainBookingService` lo implementa solo con la lógica de negocio, sin una línea de transacción.
- `TxBookingProxy` **también** lo implementa: abre la transacción, delega en el servicio real y confirma o deshace.

Si el controlador depende de `BookingOperations`, le das el proxy en lugar del servicio y no nota la diferencia.

> [!key-idea]
> El proxy se pone delante del objeto real, con su misma interfaz, y decide qué pasa antes y después de cada llamada.
@describe: Aparecen TxBookingProxy y PlainBookingService, los dos implementando BookingOperations, resaltada junto al proxy. El controlador llama al proxy y el proxy al servicio real.

## @step:gof-cons — Un proxy por servicio
Funciona, y el servicio por fin está limpio. Pero mira el coste:

- Necesitas **una clase proxy por cada interfaz**, y dentro un método envoltorio por cada método.
- El código de la transacción sigue repetido, solo que ahora vive en los proxies.
- Si mañana quieres además medir tiempos o comprobar permisos, toca otra capa de proxies.

> [!warning]
> El patrón es bueno; escribirlo a mano para cada servicio, no. Lo ideal sería generar estos proxies automáticamente.
@describe: El diagrama no cambia. TxBookingProxy sigue resaltado, ahora como el código que habría que repetir para cada servicio.

## @step:spring-tx — @Transactional y Spring escribe el proxy
Eso es justo lo que hace Spring. Escribes el servicio con la lógica de negocio y una anotación: `@Transactional`.

Al arrancar, Spring ve la anotación y **no** registra tu `BookingService` tal cual, sino un proxy generado que lo envuelve (en el depurador verás una clase como `BookingService$$SpringCGLIB$$0`). Es lo que recibe el controlador.

> [!spring]
> El proxy generado hace lo mismo que nuestro `TxBookingProxy`: abre la transacción, llama a tu método y confirma, o deshace si sale una `RuntimeException` o un `Error`. Spring Boot lo genera por defecto como una subclase con CGLIB, haya o no interfaz.

> [!warning]
> Una excepción comprobada (*checked*) **no** deshace la transacción: se confirma lo que llevaras hecho. Si la necesitas, decláralo con `@Transactional(rollbackFor = MiExcepcion.class)`.
@describe: Aparece el contexto de Spring. Entre el controlador y BookingService está el proxy que genera Spring, resaltado junto al contexto. BookingService habla con la base de datos.

## @step:request — Una reserva con la clase llena
Sigue la petición:

1. El atleta hace `POST /api/sessions/1/bookings?athlete=Ana`.
2. El controlador llama a `book()` en el proxy, que abre una transacción y llama al servicio real.
3. El servicio inserta la reserva e intenta restar una plaza. Si quedaban 0, lanza `ClassFullException`.
4. El proxy ve la excepción y hace **rollback**: la reserva insertada desaparece y la API responde con un 409.

La API también se protege en la entrada: un nombre vacío o de más de 80 caracteres da un 400, y reservar dos veces la misma clase da un 409.

> [!key-idea]
> El test del ejemplo lo comprueba: `AopUtils.isAopProxy(bookings)` es `true` y, tras la excepción, no queda ninguna reserva en la tabla.
@describe: Los paquetes recorren la cadena: POST booking del atleta al controlador, book() al proxy, BEGIN · book() del proxy a BookingService e INSERT + UPDATE hacia la base de datos; al final vuelve ROLLBACK · 409 del proxy al controlador. El proxy está resaltado.

## @step:self-call — Ojo con this
Un proxy solo intercepta las llamadas que **le llegan a él**. `bookPair()` no tiene `@Transactional` y llama dos veces a `this.book()`.

Esas llamadas van directas al objeto real, sin pasar por el proxy, así que **no hay transacción**. Si la segunda reserva falla porque la clase se llenó, la fila de la primera se queda… y también la de la segunda, que se insertó antes de comprobar las plazas.

> [!warning]
> Para que funcione, pon `@Transactional` en el método que llaman desde fuera (`bookPair`) o mueve la lógica a otro bean. Y recuerda que los métodos `private` o `final` tampoco se pueden interceptar.
@describe: bookPair() llega al proxy y pasa a BookingService, resaltado: las dos llamadas internas a book() se hacen dentro del objeto real, sin volver al proxy.

## @step:spring-does-it — Spring ya lo hace por ti
`@Transactional` es solo un caso. Con el mismo mecanismo funcionan `@Cacheable`, `@Async`, `@PreAuthorize`, `@Retryable`… y los repositorios de Spring Data, que son proxies de una interfaz sin implementación escrita por ti.

Por debajo está `ProxyFactory`: le das un objeto y un *interceptor* que decide qué pasa antes y después, y te devuelve el proxy.

> [!spring]
> El test del ejemplo envuelve un `Scoreboard` con un interceptor que anota `begin`, llama al objeto real y anota `commit`, o `rollback` si salta una excepción. Cambia esas anotaciones por llamadas al gestor de transacciones y tienes la idea central de `@Transactional`.
@describe: Dentro del contexto de Spring, ProxyFactory, resaltado, envía getProxy() al proxy, también resaltado, que envuelve a BookingService.

## @step:recap — Resumen
Empezaste con transacciones manuales en cada método, pasaste a un proxy escrito a mano y acabaste con una anotación:

- **El servicio solo tiene lógica de negocio.**
- **El proxy**, generado por Spring, abre, confirma o deshace la transacción.
- **El cliente no se entera**, porque recibe el proxy con la misma cara que el servicio.
- **Cuidado con `this`, `private` y `final`**, que se saltan el proxy.

> [!key-idea]
> Cuando una anotación de Spring "hace cosas" alrededor de tu método, casi siempre hay un proxy detrás.
@describe: Vista final: el atleta, el controlador, el proxy de Spring, BookingService y la base de datos dentro del contexto de Spring.
