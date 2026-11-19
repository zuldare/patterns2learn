---
title: Chain of Responsibility
summary: Para entrar a clase hay que tener la cuota al día, el waiver firmado y plaza libre. Convierte cada comprobación en un eslabón que decide o pasa el turno, igual que los filtros de Spring Security.
minutes: 12
level: intermediate
recap:
  intent: Pasa una petición por una cadena de manejadores; cada uno decide si la resuelve o la deja seguir, sin que quien envía sepa cuál acabará respondiendo.
  participants:
    - Handler (AccessRule, o AccessHandler en la versión a mano), el contrato de cada eslabón
    - ConcreteHandler (MembershipRule, WaiverRule, CapacityRule, AuditRule), cada uno con una sola comprobación
    - La cadena (AccessChain), que lleva la petición de un eslabón al siguiente
    - Cliente (AccessControl, llamado por el controlador), que entrega la petición al primer eslabón
  pros:
    - Cada regla vive en su clase, pequeña y fácil de probar
    - Añadir o quitar una regla no toca a las demás
    - Un eslabón puede actuar antes y después del resto, como AuditRule
  cons:
    - El orden importa y hay que fijarlo a propósito
    - Si nadie responde, la petición puede llegar al final sin que nadie lo note
    - Seguir una petición por la cadena cuesta más que leer un método con ifs
  related:
    - Decorator
    - Command
    - Composite
quiz:
  - q: Leo no ha firmado el waiver. ¿Qué reglas se ejecutan cuando hace check-in?
    options:
      - Todas, y al final se combinan los resultados
      - AuditRule, MembershipRule y WaiverRule; CapacityRule nunca se entera
      - Solo WaiverRule, porque es la que falla
      - Ninguna, el controlador lo rechaza antes
    answer: 1
    explain: Cada regla decide si llama a chain.proceed(). WaiverRule responde "waiver not signed" y no llama al siguiente, así que CapacityRule no se ejecuta y Leo no gasta plaza.
  - q: ¿Por qué CapacityRule tiene que ser la última?
    options:
      - Por orden alfabético
      - Porque Spring ejecuta las reglas en el orden en que se declaran
      - Porque es la más lenta
      - Porque es la única con un efecto (ocupar plaza), y no puede ocuparla para alguien al que otra regla va a rechazar
    answer: 3
    explain: Si fuera antes que el waiver, Leo ocuparía una plaza y después lo rechazarían. Las comprobaciones sin efectos van primero; la que cambia algo, al final.
  - q: AuditRule tiene @Order(0) y llama a chain.proceed() antes de escribir en el log. ¿Qué consigue?
    options:
      - Ver la respuesta final de la cadena, sea cual sea, porque el resto se ejecuta "dentro" de su llamada
      - Rechazar a todos los atletas que no estén en el log
      - Que el resto de reglas no se ejecuten
      - Nada, el orden no afecta a un log
    answer: 0
    explain: Como un filtro de servlet, un eslabón puede trabajar antes y después de llamar al siguiente. AuditRule va el primero, deja decidir al resto y anota el resultado a la vuelta.
  - q: ¿Dónde usa Spring este patrón de forma más visible?
    options:
      - En los repositorios de Spring Data
      - En @Transactional
      - En la cadena de filtros de servlet, y en particular en la SecurityFilterChain de Spring Security
      - En el scope singleton
    answer: 2
    explain: Cada filtro de Spring Security (autenticación, CSRF, autorización…) decide si corta la petición o llama a chain.doFilter(). Es la misma idea que nuestras reglas de la puerta.
---
## @step:problem — La puerta del box
Son las 18:00 y Leo pasa su tarjeta para entrar a clase. Antes de abrirle, la puerta comprueba tres cosas:

1. Que tenga la **cuota al día**.
2. Que haya firmado el **waiver**, el documento de exención de responsabilidad.
3. Que quede **plaza** en la clase, y si queda, se la reserva.

La primera versión mete todo en `MonolithicCheckIn.checkIn()`: una fila de `if` que devuelven "no" o, si llegas al final, "sí".

> [!problem]
> Todas las reglas de la puerta viven en el mismo método, mezcladas, y su orden depende de dónde caiga cada `if`.
@describe: El atleta envía Leo · 18:00 a CheckInController, que llama a MonolithicCheckIn, resaltado en rojo.

## @step:smell — Una regla más
Mañana llega otra: los menores necesitan autorización. Toca abrir el método, encontrar el sitio justo entre los otros `if` y esperar no romper nada. Y en algún momento alguien pondrá una comprobación **después** de reservar la plaza, y esa plaza se quedará ocupada aunque al atleta lo rechacen.

> [!warning]
> Un método que crece con cada regla nueva es difícil de leer, de probar por partes y de reordenar con seguridad.
@describe: El diagrama no cambia: MonolithicCheckIn sigue resaltado en rojo como el método que habría que abrir con cada regla nueva.

## @step:gof — Cada regla, un eslabón
Chain of Responsibility parte el método en **eslabones**. Cada handler comprueba **una sola cosa** y:

- si tiene la respuesta (un "no"), la devuelve y la cadena se para;
- si no, le pasa el check-in al siguiente.

En la versión clásica, cada `AccessHandler` guarda una referencia a su `next` y la cadena se arma a mano: `membership.linkWith(waiver).linkWith(capacity)`. A Leo lo para el `WaiverHandler` y el de plazas ni se entera.

> [!key-idea]
> Quien envía el check-in no sabe qué eslabón contestará. Solo lo entrega al primero.
@describe: Tres handlers en fila, MembershipHandler, WaiverHandler y CapacityHandler, resaltados. Leo pasa del controlador al primero y de este al segundo, que devuelve denied.

## @step:spring-chain — Las reglas son beans
En Spring, cada regla es un bean que implementa `AccessRule`, con un `@Order` que fija su sitio. `AccessControl` recibe la lista ordenada y, para cada check-in, crea una `AccessChain` que la recorre:

- Si ya no quedan reglas, el atleta pasa.
- Si quedan, llama a la siguiente pasándole **la propia cadena**, y es la regla la que decide si llama a `proceed()` para seguir.

Es la misma forma que el `FilterChain` de los servlets.

> [!spring]
> ¿Una regla nueva? Un `@Component` con su `@Order`. Ni `AccessControl` ni las demás reglas cambian.
@describe: Aparece el contexto de Spring. AccessControl, resaltado junto al contexto, está unido a la fila de reglas: AuditRule, MembershipRule, WaiverRule y CapacityRule, todas implementando AccessRule.

## @step:request — Ana entra
Ana tiene la cuota al día, el waiver firmado y queda plaza:

1. `POST /api/check-ins?athlete=Ana&session=1` llega a `AccessControl`.
2. Cada regla comprueba lo suyo y llama a `chain.proceed()`.
3. `CapacityRule` le reserva una plaza y, como no quedan reglas, la cadena responde **granted**: 200.

Fíjate en `MembershipRule`: o devuelve un "no" y corta, o pasa el turno. No sabe qué viene después.
@describe: Ana · 18:00 viaja del atleta al controlador, decide() a AccessControl y proceed() recorre toda la fila de reglas, resaltadas, hasta CapacityRule.

## @step:denied — Leo se queda fuera
Leo tiene la cuota al día, pero **no** ha firmado el waiver:

1. `MembershipRule` lo deja pasar.
2. `WaiverRule` responde `denied("waiver not signed")` y **no** llama a `proceed()`.
3. La respuesta vuelve hacia atrás por la cadena: 403 con el motivo.

`CapacityRule` no se ejecuta, así que Leo no gasta plaza: siguen quedando 2. El test del ejemplo lo comprueba.

> [!key-idea]
> Cortar la cadena es tan sencillo como devolver una respuesta en lugar de llamar al siguiente.
@describe: Leo pasa MembershipRule; WaiverRule, resaltada, devuelve waiver not signed hacia atrás y la cadena se para antes de CapacityRule.

## @step:order — El orden es parte de la regla
`CapacityRule` es la única regla con un **efecto**: ocupa una plaza. Por eso va la última (`@Order(30)`). Si fuera antes que el waiver, Leo ocuparía una plaza y luego lo rechazarían.

> [!warning]
> Primero las comprobaciones que no cambian nada; al final, la que sí. Y deja el orden escrito en un solo sitio, con `@Order`, no en el orden en que se declaren las clases.
@describe: CapacityRule aparece resaltada al final de la fila: es la que reserva la plaza.

## @step:audit — Antes y después
`AuditRule` va la **primera** (`@Order(0)`) y hace algo curioso: llama a `chain.proceed()` **antes** de hacer nada. Todo el resto de la cadena se ejecuta "dentro" de esa llamada, y cuando vuelve, `AuditRule` ve la respuesta final y la anota en el log: "Ana → session 1: granted", "Leo → session 1: denied (waiver not signed)".

> [!spring]
> Es justo lo que hacen muchos filtros de servlet: medir el tiempo, añadir cabeceras a la respuesta o registrar el resultado, envolviendo a todos los que vienen detrás.
@describe: AccessControl envía proceed() a AuditRule, resaltada, y la respuesta granted vuelve por el mismo enlace al final.

## @step:spring-does-it — Spring ya lo hace por ti
Cada petición HTTP a una app Spring pasa por una **cadena de filtros de servlet** antes de llegar al `DispatcherServlet`. Spring Security es justo eso: su `SecurityFilterChain` encadena filtros de autenticación, CSRF, sesión y autorización, y cada uno decide si corta la petición o llama a `chain.doFilter()`.

El test del ejemplo monta un `WaiverHeaderFilter`. Sin la cabecera `X-Waiver-Signed` responde 403 y la app no se entera; con ella, llama a `chain.doFilter()` y la petición sigue.

> [!spring]
> Por eso el orden de los filtros de seguridad importa tanto, y por eso un filtro mal colocado puede dejar pasar algo o bloquearlo todo.
@describe: Dentro del contexto de Spring, la petición GET /api/wods llega a WaiverHeaderFilter, resaltado, que la pasa con doFilter() a DispatcherServlet.

## @step:recap — Resumen
Empezaste con un método lleno de `if` y acabaste con:

- **Una regla por clase**, con una única comprobación.
- **`@Order`** para fijar la posición de cada una.
- **Cortar o seguir**: devuelve una respuesta o llama a `chain.proceed()`.
- **Eslabones que envuelven**, como `AuditRule`, que actúan antes y después del resto.

> [!key-idea]
> Cuando varias comprobaciones pueden decir "no" por su cuenta, encadénalas en lugar de anidarlas.
@describe: Vista final: el atleta, el controlador, AccessControl y la fila de reglas implementando AccessRule, todo dentro del contexto de Spring.
