---
title: State
summary: Una cuota del box puede estar de prueba, activa, congelada o caducada, y "entrar" o "congelar" significan cosas distintas en cada caso. Deja que cada estado decida qué hacer y cuál viene después.
minutes: 11
level: intermediate
recap:
  intent: Deja que un objeto cambie de comportamiento cuando cambia su situación, poniendo cada situación en su propio objeto en lugar de repartir condiciones por todos los métodos.
  participants:
    - Context (Membership), lo que usa el resto de la app; pasa cada acción a su estado actual
    - State (MembershipState), lo que cada estado sabe hacer, con un comportamiento por defecto
    - ConcreteState (TRIAL, ACTIVE, FROZEN, EXPIRED), cada situación con sus reglas y sus transiciones
  pros:
    - Las reglas de cada estado viven juntas, en un solo sitio
    - Las transiciones se leen en el código, porque cada estado dice a cuál pasa
    - Un estado nuevo es una constante más, sin tocar los métodos de los demás
  cons:
    - Con dos estados y una regla, un if es más claro
    - Las transiciones quedan repartidas entre los estados; para ver el mapa completo hay que leerlos todos
    - El contexto tiene que abrir a los estados lo que estos necesitan cambiar (aquí, useTrialVisit()), y eso le añade métodos
  related:
    - Strategy
    - Singleton
    - Flyweight
quiz:
  - q: ¿Quién decide a qué estado pasa una cuota activa cuando se congela?
    options:
      - Membership, con un switch sobre el estado que tiene ahora
      - MembershipService, justo antes de guardar en la base de datos
      - El controlador, según la acción que llega en la URL
      - El propio ACTIVE, que devuelve FROZEN desde su freeze()
    answer: 3
    explain: Membership solo pasa la acción a su estado y se queda con lo que este devuelve. Cada estado conoce sus propias transiciones.
  - q: El box añade el estado INJURED (lesionado), del que se sale con resume(). ¿Qué cambias?
    options:
      - Un case nuevo en cada método de Membership y del servicio
      - Una constante INJURED con su comportamiento, y la acción que lleva hasta ella
      - Un if en MembershipService que compruebe si el socio está lesionado
      - La tabla, para guardar un campo booleano injured junto al estado
    answer: 1
    explain: Añades la constante INJURED, que decide qué pasa al entrar o al reanudar, y una acción nueva (injure(), con su caso en el servicio) que ACTIVE redefine para devolver INJURED. Los métodos que ya tenían los demás estados no cambian.
  - q: ¿Por qué todas las cuotas congeladas pueden compartir el mismo objeto FROZEN?
    options:
      - Porque el estado no guarda datos del socio; esos datos viven en Membership
      - Porque Spring registra cada constante de un enum como un bean singleton
      - Porque la base de datos solo guarda un registro por cada estado
      - Porque valueOf guarda en caché los objetos que ya leyó de la base de datos
    answer: 0
    explain: FROZEN solo tiene comportamiento. Lo que cambia de un socio a otro (sus visitas de prueba, por ejemplo) está en Membership, que se pasa como parámetro.
  - q: ¿Qué guarda MembershipRepository en la columna status?
    options:
      - El objeto del estado serializado, con todo su comportamiento
      - Un número con la posición del estado dentro del enum
      - El nombre, como "FROZEN", y valueOf lo convierte de vuelta
      - Una copia de las reglas de cada estado en formato de texto
    answer: 2
    explain: El comportamiento está en el código; en la base de datos basta con el nombre. Guardar la posición (ordinal) sería frágil, porque cambia si reordenas las constantes.
---
## @step:problem — La puerta pregunta por la cuota
Al pasar la tarjeta, la puerta del box pregunta a la cuota del atleta si puede entrar. La respuesta depende de en qué situación esté:

- **de prueba**: puede entrar, hasta 3 visitas;
- **activa**: puede entrar, congelarse o caducar;
- **congelada**: no puede entrar hasta que se reanude;
- **caducada**: no puede entrar hasta que se renueve.

La primera versión, `SwitchingMembership`, guarda el estado en un `String` y cada método hace un `switch` sobre él.

> [!problem]
> Las reglas de cada estado están repartidas por todos los métodos: para saber qué puede hacer una cuota congelada hay que leerlos todos.
@describe: El atleta pide entrar a MembershipController, que pregunta a SwitchingMembership, resaltado en rojo, con un switch sobre el estado.

## @step:smell — Un estado más, todos los switch
Mira las líneas `default`: cada método repite "estado desconocido", porque un `String` admite cualquier cosa y una errata como `"activ"` solo se descubre en tiempo de ejecución.

Y si el box añade un estado nuevo, por ejemplo "lesionado", hay que abrir **todos** los `switch` y decidir qué hace en cada uno. Si se te olvida uno, el compilador no avisa.

> [!warning]
> Un `switch` sobre el mismo estado repetido en varios métodos suele pedir un objeto por estado.
@describe: El diagrama no cambia: SwitchingMembership sigue resaltado en rojo, con un caso por defecto repetido en cada método.

## @step:states — Un objeto por estado
State pone cada situación en su propio objeto. En Java, lo más natural es un `enum` en el que cada constante redefine los métodos que le afectan:

- `TRIAL` deja entrar mientras queden visitas (y es el único que las cuenta), y `renew()` lo pasa a `ACTIVE`;
- `ACTIVE` deja entrar, `freeze()` devuelve `FROZEN` y `expire()`, `EXPIRED`;
- `FROZEN` no deja entrar, `resume()` vuelve a `ACTIVE` y también puede caducar;
- `EXPIRED` no deja entrar, y `renew()` vuelve a `ACTIVE`.

Cada método **devuelve el estado siguiente**: las transiciones están escritas en el propio estado.

> [!key-idea]
> Las reglas de "congelada" están todas en `FROZEN`. Para saber qué puede hacer, lees un solo sitio.
@describe: Aparecen los cuatro estados, resaltados, como un diagrama: renew() lleva de TRIAL a ACTIVE, freeze() de ACTIVE a FROZEN, resume() de vuelta a ACTIVE, expire() a EXPIRED y renew() de EXPIRED a ACTIVE.

## @step:context — La cuota delega
`Membership` es el **contexto**: es lo que usa el resto de la app. No tiene ni un `if` sobre su estado: hasta las visitas de prueba que quedan se las pregunta al estado. Cada acción hace lo mismo: se la pasa a su estado actual y se queda con el estado que este devuelve.

`state = state.freeze(this)`: si la cuota está activa, pasa a congelada; si está de prueba, el estado se niega con un error. `Membership` no necesita saber cuál de las dos cosas va a pasar.
@describe: Aparece Membership, resaltada, que pasa la acción a su estado actual, ACTIVE, con state.freeze(this).

## @step:defaults — Lo que no se permite, por defecto
Cada acción tiene un comportamiento por defecto: rechazarla con un mensaje claro ("can't freeze a trial membership"). Así cada estado solo escribe lo que **sí** permite.

`checkIn` es la excepción: es `abstract`, para que cada estado esté obligado a decidir si deja entrar. Si mañana añades una constante y se te olvida, no compila.

> [!key-idea]
> Un comportamiento por defecto razonable deja cada estado corto. Lo que no puede faltar se declara `abstract` y el compilador vigila.
@describe: TRIAL y EXPIRED aparecen resaltados: solo redefinen lo que permiten y el resto lo rechaza el comportamiento por defecto.

## @step:walkthrough — Ana congela su cuota
Ana se va de vacaciones:

1. `ana.freeze()`: `ACTIVE` devuelve `FROZEN`.
2. Intenta entrar: `FROZEN` responde "membership is frozen: resume it first".
3. Vuelve: `ana.resume()`, y `FROZEN` devuelve `ACTIVE`.
4. Ya puede entrar.

El test del ejemplo hace exactamente esto, y otro comprueba que una acción rechazada no cambia el estado.
@describe: freeze() lleva a Ana de ACTIVE a FROZEN y resume() la devuelve a ACTIVE; los dos estados aparecen resaltados.

## @step:request — Por la API
`POST /api/memberships/1/freeze`:

1. `MembershipService` carga la cuota de Ana desde la base de datos, dentro de una transacción.
2. Llama a `freeze()`, y el estado `ACTIVE` devuelve `FROZEN`.
3. Guarda la cuota y responde 200 con el estado nuevo.

Si después intenta entrar, `POST /api/memberships/1/check-in` responde 409 con el motivo que da `FROZEN`.

> [!warning]
> La transacción sola no impide que dos peticiones lean la misma cuota a la vez y la última pise a la otra (dos entradas simultáneas con la última visita de prueba, por ejemplo). Por eso `save()` solo actualiza la fila si sigue como se leyó, y si no responde 409 para que se reintente.
@describe: POST /api/memberships/1/freeze viaja del atleta al controlador y apply() al servicio, que pide find() al repositorio y freeze() a Membership, resaltada; ACTIVE pasa a FROZEN, también resaltado.

## @step:persist — ¿Y Spring?
El núcleo de Spring no trae un State genérico. Lo que sí hace la app es **guardar el estado entre peticiones**, y ahí el enum ayuda:

- en la base de datos solo se guarda el nombre (`"FROZEN"`);
- al leer, `MembershipState.valueOf(...)` devuelve la constante, siempre el mismo objeto;
- como un estado no guarda datos del socio, todas las cuotas congeladas comparten el mismo `FROZEN`.

Y Spring ya trata los enums por su nombre en varios sitios: Spring Data JDBC los guarda con `name()`, y Spring MVC convierte un parámetro de la URL en la constante con `valueOf` (que distingue mayúsculas). Con JPA, en cambio, `@Enumerated` usa por defecto la posición (`ORDINAL`): escribe siempre `@Enumerated(EnumType.STRING)`.

> [!warning]
> Si guardas el estado por su nombre, renombrar una constante deja filas que ya no se pueden leer. Trátalo como un cambio de esquema y migra los datos.
@describe: Dentro del contexto de Spring, MembershipRepository, resaltado, guarda "FROZEN" en la tabla membership, también resaltada, solo si la fila no ha cambiado desde que se leyó.

## @step:recap — Resumen
Empezaste con un `switch` sobre un `String` en cada método y acabaste con:

- **Un estado por situación**, cada uno con sus reglas y sus transiciones.
- **Un contexto**, `Membership`, que delega sin un solo `if`.
- **Un comportamiento por defecto** que rechaza lo que no se permite, y `abstract` para lo que no puede faltar.
- **El nombre del estado** en la base de datos.

No lo confundas con **Strategy**: los dos ponen comportamiento en objetos intercambiables, pero una estrategia la elige quien la usa, mientras que aquí es el propio estado el que decide cuándo cambiar al siguiente.

Y cuándo no hace falta: con dos estados y una regla, un `if` se lee mejor; y si las transiciones son muchas y cambian a menudo, una tabla de transiciones (estado y evento, estado siguiente) las deja más visibles.

> [!key-idea]
> Cuando el mismo objeto se comporta distinto según su situación, pon cada situación en su propio objeto y deja que ella decida la siguiente.
@describe: Vista final: el atleta, el controlador, el servicio, Membership con sus cuatro estados, el repositorio y la tabla, todo dentro del contexto de Spring.
