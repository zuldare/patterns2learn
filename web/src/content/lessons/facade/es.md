---
title: Facade
summary: Dar de alta a un socio toca seis piezas del sistema, en un orden concreto y deshaciendo lo hecho si el pago falla. Ponlo todo detrás de una sola operación que cualquier cliente pueda usar.
minutes: 10
level: beginner
recap:
  intent: Ofrece una sola puerta, sencilla, a un conjunto de piezas que juntas hacen algo complicado, para que quien lo usa no tenga que conocerlas ni coordinarlas.
  participants:
    - Facade (OnboardingFacade), que expone la operación join() y sabe a qué piezas llamar y en qué orden
    - Subsistemas (MemberRegistry, AccessCards, Billing, Waivers, IntroClasses, Mailer), que hacen el trabajo y no saben que hay una fachada
    - Clientes (MemberController, KioskController), que solo conocen la fachada
  pros:
    - Los clientes hacen una llamada en lugar de coordinar seis
    - El orden de los pasos y cómo deshacerlos viven en un solo sitio
    - Los subsistemas pueden cambiar por dentro sin tocar a los clientes
  cons:
    - Si se le añade de todo, la fachada acaba siendo una clase enorme que sabe demasiado
    - Es una capa más entre el cliente y el trabajo real
    - Quien necesite algo que la fachada no ofrece tiene que ir al subsistema directamente
  related:
    - Adapter
    - Mediator
    - Singleton
quiz:
  - q: Con FrontDeskController, ¿qué pasa si el pago de Leo es rechazado?
    options:
      - Nada, porque cobrar es lo primero que hace el controlador
      - Leo queda registrado y con una tarjeta de acceso, aunque nunca ha pagado
      - Spring deshace automáticamente todo lo que se había hecho
      - El controlador reintenta el cobro hasta que el banco lo acepta
    answer: 1
    explain: El controlador registra a Leo y le da una tarjeta antes de cobrar, y no deshace nada si el cobro falla. El test FrontDeskControllerTest lo comprueba.
  - q: ¿Qué NO hace OnboardingFacade?
    options:
      - Decidir en qué orden se hacen los pasos del alta
      - Deshacer lo que ya se hizo si el cobro falla
      - Ofrecer la misma operación a varios clientes distintos
      - Impedir que otras partes del código usen Billing directamente
    answer: 3
    explain: Una fachada simplifica, pero no esconde. Billing sigue siendo un bean más, y un panel de facturación puede usarlo sin pasar por el alta.
  - q: La recepción y el kiosco de la entrada dan de alta socios. ¿Qué ganan con la fachada?
    options:
      - Los dos llaman a join() y el orden de los pasos y cómo deshacerlos viven en un solo sitio
      - Cada cliente puede elegir su propio orden de pasos sin afectar al otro
      - Los subsistemas dejan de necesitar sus propios tests unitarios
      - Los clientes ya no tienen que validar los datos que reciben
    answer: 0
    explain: Sin fachada, cada cliente copiaría la secuencia y, tarde o temprano, uno se olvidaría del waiver o de deshacer la tarjeta.
  - q: ¿En qué sentido ApplicationContext es una fachada?
    options:
      - Porque envuelve cada bean en un proxy que intercepta todas sus llamadas
      - Porque es la única manera que tiene Spring de crear beans
      - Porque reúne beans, mensajes, eventos y recursos en una interfaz y delega en cada pieza
      - Porque oculta el BeanFactory y nadie más puede acceder a él
    answer: 2
    explain: AbstractApplicationContext pasa getBean a su BeanFactory, getMessage al MessageSource, publishEvent al ApplicationEventMulticaster y getResources a un ResourcePatternResolver.
---
## @step:problem — Hacerse socio
Ana quiere apuntarse al box. En recepción, darla de alta supone:

1. registrarla como socia;
2. darle una tarjeta de acceso;
3. cobrarle el primer mes;
4. enviarle el waiver para firmar;
5. reservarle la clase de iniciación;
6. mandarle el email de bienvenida.

Son seis piezas distintas del sistema. La primera versión, `FrontDeskController`, las llama una a una.

> [!problem]
> El controlador conoce seis subsistemas y el orden exacto en que hay que usarlos.
@describe: Recepción envía Ana · unlimited a FrontDeskController, resaltado en rojo, que llama él solo a los seis subsistemas: register(), subscribe(), welcome() y el resto.

## @step:smell — Leo, a medias
Leo intenta apuntarse, pero su tarjeta bancaria es rechazada. Para entonces, el controlador **ya lo ha registrado y ya le ha dado una tarjeta de acceso**, y no deshace nada: Leo puede entrar al box sin haber pagado. El test `FrontDeskControllerTest` lo demuestra.

Y llega el kiosco de la entrada, que también da de alta socios. ¿Copias los seis pasos? ¿Y la próxima vez que cambie el orden?

> [!warning]
> Cuando una secuencia de llamadas se repite en varios clientes, cada copia es una oportunidad de olvidarse de un paso o de un "deshacer".
@describe: El cobro con tok_declined falla; MemberRegistry, AccessCards y Billing aparecen resaltados: el socio y su tarjeta se quedan aunque no haya pagado.

## @step:facade — Una puerta
`OnboardingFacade` ofrece una sola operación: `join(JoinRequest)`. Dentro, coordina las seis piezas:

- registra, entrega la tarjeta y cobra;
- después, envía el waiver, reserva la clase y manda la bienvenida;
- devuelve un `Welcome` con todo lo que el socio necesita saber.

Los subsistemas no cambian ni saben que hay una fachada. Solo hay un sitio nuevo que sabe cómo usarlos juntos.

> [!key-idea]
> La fachada no hace el trabajo: sabe **a quién** pedírselo y **en qué orden**.
@describe: Aparece OnboardingFacade, resaltada, unida a los seis subsistemas.

## @step:undo — El orden importa, y deshacer también
La fachada ordena los pasos a propósito:

- comprueba el plan antes de nada;
- lo que se puede deshacer va primero (registrar, entregar la tarjeta) y **cobrar va al final** de ese bloque;
- si el cobro falla, devuelve la tarjeta y borra el registro, y relanza el error;
- lo que no se puede deshacer, como los emails, solo se envía cuando ya se ha cobrado.

> [!spring]
> Con una base de datos, `@Transactional` en `join()` haría atómicos los pasos que tocan la base de datos. Pero un cobro o un email no se deshacen con un rollback: el orden y la compensación siguen siendo cosa de la fachada.
@describe: Billing, resaltado con la fachada, responde payment declined; la fachada llama a revoke() en AccessCards y a remove() en MemberRegistry.

## @step:clients — Dos clientes, una llamada
En Spring, la fachada es un `@Service` más. `MemberController` (la app de recepción, con JSON) y `KioskController` (el formulario de la tablet) la reciben por el constructor y hacen **una** llamada: `join(...)`.

Ninguno de los dos sabe que existen las tarjetas, el cobro o el waiver. Si mañana cambia el orden, cambia la fachada y los clientes ni se enteran.
@describe: Aparece el contexto de Spring. MemberController y KioskController, resaltados, envían join() a OnboardingFacade, unida a los seis subsistemas.

## @step:request — Ana, dentro
`POST /api/members` con Ana, plan `unlimited` y un pago válido:

1. `MemberController` llama a `join(...)`.
2. La fachada registra a Ana, le da la tarjeta `CARD-0001` y le cobra 89,00 €.
3. Envía el waiver, le reserva la clase del sábado a las 10:00 y le manda la bienvenida.
4. Responde 201 con todo eso.

Si el pago se rechaza, la respuesta es 402 y no queda rastro de Ana en el sistema.
@describe: POST /api/members viaja de Recepción a MemberController y join() a la fachada, resaltada, que llama a register(), issue(), cobra 89.00 € y envía welcome().

## @step:spring-does-it — Spring ya lo hace por ti
El `ApplicationContext` es una fachada. Detrás de una sola interfaz hay varias piezas, y `AbstractApplicationContext` delega cada llamada en la suya:

- `getBean(...)`, en su `BeanFactory`;
- `getMessage(...)`, en el `MessageSource` (Spring Boot lo configura solo si hay un `messages.properties`);
- `publishEvent(...)`, en el `ApplicationEventMulticaster`;
- `getResources(...)`, en un `ResourcePatternResolver`.

El test del ejemplo usa las cuatro sobre el mismo objeto.

> [!spring]
> `JdbcTemplate` y `RestClient` también hacen de fachada sobre APIs más complicadas (JDBC, los clientes HTTP), aunque además aplican otros patrones, como Template Method.
@describe: Dentro del contexto de Spring, ApplicationContext, resaltado, envía getBean() a BeanFactory, getMessage() a MessageSource, publishEvent() a ApplicationEventMulticaster y getResources() a ResourcePatternResolver.

## @step:recap — Resumen
Empezaste con un controlador que coordinaba seis piezas y acabaste con:

- **Una fachada** con una operación de negocio, `join()`.
- **El orden y la compensación** en un solo sitio.
- **Varios clientes** que hacen una sola llamada.
- **Subsistemas** que siguen ahí para quien los necesite directamente.

Y cuándo no hace falta: si solo hay un cliente y dos llamadas, la fachada es una clase de más. Y si empieza a acumular operaciones que no tienen que ver entre sí, divídela por casos de uso antes de que lo sepa todo.

> [!key-idea]
> Cuando hacer algo requiere coordinar varias piezas, pon esa coordinación detrás de una operación con nombre de negocio.
@describe: Vista final: Recepción y el visitante, los dos controladores, OnboardingFacade y los seis subsistemas, todo dentro del contexto de Spring.
