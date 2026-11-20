---
title: Flyweight
summary: Miles de series registradas, y casi todas repiten los mismos movimientos. Comparte un único objeto por movimiento y deja que cada serie guarde solo lo suyo.
minutes: 9
level: intermediate
recap:
  intent: Cuando muchísimos objetos repiten los mismos datos, separa lo que tienen en común, compártelo en unos pocos objetos inmutables y deja fuera lo que cambia en cada uno.
  participants:
    - Flyweight (Movement), el estado compartido (intrínseco); inmutable
    - FlyweightFactory (MovementCatalog), crea cada flyweight una vez y devuelve siempre el mismo
    - Client (SetLog, LoggedSet), guarda el estado propio (extrínseco) y lo pasa cuando hace falta
  pros:
    - Un objeto por movimiento, aunque haya miles de series
    - Los datos comunes viven en un sitio, sin copias que mantener
    - Comparar movimientos puede ser por identidad
  cons:
    - Solo compensa con muchos objetos y mucho estado repetido; si no, es complicar por nada
    - El flyweight tiene que ser inmutable, o un cambio aparecería en todas las series a la vez
    - El estado extrínseco se pasa en cada llamada, y el código queda algo más indirecto
  related:
    - Singleton
    - Composite
    - Prototype
quiz:
  - q: ¿Qué es estado intrínseco en este ejemplo?
    options:
      - El nombre del atleta de cada serie
      - Las repeticiones y los kilos de la serie
      - La norma y el material del movimiento
      - La posición de la serie en el registro
    answer: 2
    explain: Lo intrínseco es lo que comparten todas las series de un movimiento, y va dentro del flyweight. El atleta, las repeticiones y los kilos son de cada serie.
  - q: ¿Por qué Movement tiene que ser inmutable?
    options:
      - Porque los records de Java no pueden tener métodos
      - Porque lo comparten miles de series y un cambio les llegaría a todas
      - Porque ConcurrentHashMap solo admite valores inmutables
      - Porque Spring no inyecta objetos que se puedan modificar
    answer: 1
    explain: Un flyweight es el mismo objeto para todos los que lo usan. Si una serie pudiera cambiar su norma, se la cambiaría a todas las demás.
  - q: ¿Qué hace que dos series de sentadilla compartan el mismo objeto?
    options:
      - Que MovementCatalog lo crea una vez y luego devuelve siempre ese
      - Que Java detecta los objetos iguales y los une por su cuenta
      - Que LoggedSet copia el movimiento de la serie anterior
      - Que el record Movement redefine equals() y hashCode()
    answer: 0
    explain: computeIfAbsent crea el movimiento la primera vez y después devuelve la misma instancia. equals() iguales no bastan; hace falta que alguien reparta el mismo objeto.
  - q: ¿Por qué Integer.valueOf(100) == Integer.valueOf(100) es true y con 1000 no?
    options:
      - Porque 100 cabe en un byte y Java lo guarda en la pila
      - Porque el compilador sustituye 100 por una constante
      - Porque Integer guarda en caché los valores de -128 a 127
      - Porque == compara el valor cuando el número es pequeño
    answer: 2
    explain: valueOf devuelve objetos compartidos para los valores pequeños, que son los más usados. Es un flyweight del propio JDK; con 1000 crea un objeto nuevo (salvo que se amplíe la caché con -XX:AutoBoxCacheMax).
---
## @step:problem — Una copia por serie
El box registra cada serie: quién, qué movimiento, cuántas repeticiones y cuántos kilos. En un mes son miles, y casi todas son sentadilla, peso muerto o thruster.

En la primera versión, cada serie lleva el movimiento entero: nombre, categoría, la norma de cómo se hace (un texto largo) y el material. Es lo que pasa cuando cada fila de una consulta se convierte en objetos nuevos. Con 3.000 series hay 3.000 copias de dos textos; el test `CopiedMovementLogTest` las cuenta.

> [!problem]
> Lo que es igual en todas las series se repite en cada una, y cada copia ocupa su memoria.
@describe: Tres series, cada una con su propia copia del movimiento, resaltadas en rojo: dos copias de la sentadilla y una del peso muerto.

## @step:flyweight — Lo que se comparte
Flyweight separa los datos en dos. Lo que es igual para todas las series de un movimiento (nombre, categoría, norma, material) va en `Movement`: es el **estado intrínseco**, y el objeto se comparte.

`Movement` es un `record` y su lista de material se copia con `List.copyOf`: es **inmutable**. Tiene que serlo, porque lo usan miles de series a la vez.

> [!key-idea]
> Un flyweight es un objeto pequeño en número, no en tamaño: hay uno por movimiento, por muchas series que lo usen.
@describe: Aparecen los dos movimientos compartidos, la sentadilla y el peso muerto, resaltados.

## @step:extrinsic — Lo que es de cada serie
Lo que cambia en cada serie (el atleta, las repeticiones, los kilos) es el **estado extrínseco**. No va dentro del movimiento: lo guarda `LoggedSet` y se le pasa a `line()` cuando hace falta.

Ana y Leo hacen sentadilla y comparten **el mismo** objeto `Movement`; cada uno tiene su línea: "Ana · 5 × back squat @ 100 kg", "Leo · 3 × back squat @ 120 kg".
@describe: Las series de Ana y Leo apuntan a la misma sentadilla, resaltada, y le pasan sus repeticiones y kilos con line().

## @step:factory — Uno por nombre
`MovementCatalog` es la **fábrica de flyweights**. `get("Back Squat")` normaliza el nombre y usa `computeIfAbsent`: la primera vez carga el movimiento y lo guarda; las siguientes devuelve el mismo objeto. Es seguro entre hilos porque es un `ConcurrentHashMap`.

Un movimiento que no existe responde 404 "unknown movement".

> [!key-idea]
> Que dos objetos sean `equals` no ahorra nada. El ahorro está en que alguien reparta siempre la misma instancia.
@describe: MovementCatalog, resaltado, crea con computeIfAbsent la sentadilla y el peso muerto una sola vez.

## @step:client — El cliente pide, no crea
`SetLog` no hace `new Movement(...)`: pide el movimiento al catálogo y crea una `LoggedSet` con lo compartido y lo propio. Así es imposible que una serie acabe con su propia copia.
@describe: SetLog, resaltado, pide get("deadlift") al catálogo y crea la serie de Eva con el movimiento compartido.

## @step:share — 3.000 series, 2 movimientos
El test registra 3.000 series alternando sentadilla y peso muerto. Al final, el catálogo ha creado **dos** objetos `Movement`. Las 3.000 series apuntan a esos dos.

Cuánto se ahorra depende de lo grande que sea el estado compartido y de cuántas veces se repite: aquí, una norma de unos 100 caracteres por serie.
@describe: La sentadilla, el peso muerto y el catálogo, resaltados: todas las series apuntan a solo dos movimientos.

## @step:request — Por HTTP
Ana, Leo y Eva registran un peso muerto con `POST /api/sets` (responde 201 con su línea). `GET /api/sets/stats` dice que hay 3 series y **1** objeto de movimiento.

Un movimiento desconocido responde 404; unas repeticiones fuera de rango, 400.
@describe: POST /api/sets viaja del atleta al controlador y a SetLog, que pide el peso muerto al catálogo; la serie apunta al movimiento compartido, resaltado junto a SetLog.

## @step:spring-does-it — Java y Spring ya lo hacen por ti
`Integer.valueOf(100)` devuelve siempre el mismo objeto: el JDK guarda en caché los enteros de -128 a 127, que son los que más se usan. Con 1000 crea uno nuevo. Es un flyweight de libro (y la razón de que comparar `Integer` con `==` sea mala idea).

Spring hace lo mismo con los tipos MIME: `MimeTypeUtils.parseMimeType("application/json")` analiza el texto una vez, lo guarda en una caché y después devuelve la misma instancia. En una aplicación web se piden miles de veces.

> [!spring]
> Cuando un objeto inmutable se pide muchas veces con los mismos datos, cachearlo por su clave es un flyweight. Spring lo hace con los tipos MIME; tú puedes hacerlo con tus catálogos.
@describe: Integer.valueOf(100) y MimeTypeUtils.parseMimeType reciben siempre la misma instancia en caché, resaltadas.

## @step:recap — Resumen
Empezaste con una copia del movimiento en cada serie y acabaste con:

- **Un flyweight**, `Movement`, inmutable, con lo que comparten todas las series.
- **Una fábrica**, `MovementCatalog`, que crea cada uno una vez y lo reparte.
- **Estado extrínseco** en cada `LoggedSet`: atleta, repeticiones y kilos.

Sus vecinos: un **Singleton** es una sola instancia de una clase; con Flyweight hay una por clave (una por movimiento). En un **Composite** las hojas repetidas pueden ser flyweights. Y **Prototype** hace lo contrario: copia un objeto para que cada uno tenga el suyo.

Cuándo no usarlo: con pocos objetos, o con poco estado repetido, el ahorro no compensa. Y si los datos compartidos tienen que cambiar por serie, no son intrínsecos: el flyweight no encaja. Mide antes de optimizar.

> [!key-idea]
> Lo que se repite, compártelo una vez; lo que cambia, que lo lleve cada uno.
@describe: Vista final: los atletas, el controlador, SetLog, las tres series apuntando a dos movimientos y el catálogo, todo dentro del contexto de Spring.
