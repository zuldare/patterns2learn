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
    - Se pueden comparar movimientos por identidad
  cons:
    - Solo compensa con muchos objetos y mucho estado repetido; si no, es complicar por nada
    - El flyweight tiene que ser inmutable, o un cambio aparecería en todas las series a la vez
    - El estado extrínseco se pasa en cada llamada, y el código queda algo más indirecto
  related:
    - Singleton
    - Composite
    - State
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
      - Para que equals() siga siendo coherente
      - Porque lo comparten todas sus series a la vez
      - Para que la clave del mapa no cambie nunca
      - Para poder serializarlo sin problemas
    answer: 1
    explain: Un flyweight es el mismo objeto para todos los que lo usan. Si una serie pudiera cambiar su norma, se la cambiaría a todas las demás.
  - q: ¿Qué hace que dos series de sentadilla compartan objeto?
    options:
      - Que Java une por su cuenta los objetos iguales
      - Que LoggedSet copia el movimiento de la anterior
      - Que el record Movement redefine equals()
      - Que todas lo piden al mismo catálogo
    answer: 3
    explain: computeIfAbsent crea el movimiento la primera vez y después devuelve la misma instancia. Que equals() dé true no basta; hace falta que alguien reparta el mismo objeto.
  - q: ¿Qué NO debería ir dentro de Movement?
    options:
      - Los kilos que levantó cada atleta
      - La categoría del movimiento
      - El material que hace falta
      - La norma de cómo se hace
    answer: 0
    explain: Los kilos cambian en cada serie, así que son estado extrínseco. Si fueran dentro de Movement, ya no se podría compartir.
---
## @step:problem — Una copia por serie
El box registra cada serie: quién, qué movimiento, cuántas repeticiones y cuántos kilos. En un mes son miles, y casi todas son sentadilla, peso muerto o thruster.

En la primera versión, cada serie lleva el movimiento entero: nombre, categoría, la norma de cómo se hace (un texto largo) y el material. Es lo que pasa con una consulta desnormalizada o una importación de JSON: cada fila trae sus propios textos. Con 3.000 series hay 3.000 copias de dos textos; el test `CopiedMovementLogTest` las cuenta.

> [!problem]
> Lo que es igual en todas las series se repite en cada una, y cada copia tiene sus propios caracteres en memoria.
@describe: Tres series, cada una con su propia copia del movimiento, resaltadas en rojo: dos copias de la sentadilla y una del peso muerto.

## @step:flyweight — Lo que se comparte
Flyweight separa los datos en dos. Lo que es igual para todas las series de un movimiento (nombre, categoría, norma, material) va en `Movement`: es el **estado intrínseco**, y el objeto se comparte.

`Movement` es un `record` y su lista de material se copia con `List.copyOf`: es **inmutable**. Tiene que serlo, porque lo usan miles de series a la vez.

> [!key-idea]
> Lo que se vuelve ligero es cada serie: la parte pesada y común se guarda una sola vez.
@describe: Aparecen los dos movimientos compartidos, la sentadilla y el peso muerto, resaltados.

## @step:extrinsic — Lo que es de cada serie
Lo que cambia en cada serie (el atleta, las repeticiones, los kilos) es el **estado extrínseco**. No va dentro del movimiento: lo guarda `LoggedSet` y se le pasa a `line()` cuando hace falta.

Ana y Leo hacen sentadilla y comparten **el mismo** objeto `Movement`; cada uno tiene su línea: "Ana · 5 × back squat @ 100 kg", "Leo · 3 × back squat @ 120 kg".
@describe: Las series de Ana y Leo apuntan a la misma sentadilla, resaltada, y le pasan sus repeticiones y kilos con line().

## @step:factory — Uno por nombre
`MovementCatalog` es la **fábrica de flyweights**. `get("Back Squat")` normaliza el nombre y usa `computeIfAbsent`: la primera vez lee los datos y construye el `Movement`; las siguientes devuelve el mismo objeto. Es seguro entre hilos porque es un `ConcurrentHashMap`.

Un movimiento que no existe responde 404 "unknown movement".

> [!key-idea]
> Que dos objetos sean `equals` no ahorra nada. El ahorro está en que alguien reparta siempre la misma instancia.
@describe: MovementCatalog, resaltado, crea con computeIfAbsent la sentadilla y el peso muerto una sola vez.

## @step:client — El cliente pide, no crea
`SetLog` no hace `new Movement(...)`: pide el movimiento al catálogo y crea una `LoggedSet` con lo compartido y lo propio. Mientras todos pasen por el catálogo, ninguna serie tendrá su propia copia (el tipo no lo impide: cualquiera podría hacer `new Movement(...)`).
@describe: SetLog, resaltado, pide get("deadlift") al catálogo y crea la serie de Eva con el movimiento compartido.

## @step:share — 3.000 series, 2 movimientos
El test registra 3.000 series alternando sentadilla y peso muerto. Al final, el catálogo ha creado **dos** objetos `Movement`. Las 3.000 series apuntan a esos dos.

Cada serie sigue siendo un objeto pequeño (atleta, repeticiones, kilos y una referencia); lo que desaparece es el movimiento copiado. Cuánto se ahorra depende de lo grande que sea esa parte común y de cuántas veces se repite: aquí, una norma de unos 100 caracteres por serie.

(En el libro, a veces ni siquiera hay un objeto por elemento: el estado extrínseco se calcula a partir de la estructura, como la posición de una letra en un documento.)
@describe: La sentadilla, el peso muerto y el catálogo, resaltados: todas las series apuntan a solo dos movimientos.

## @step:request — Por HTTP
Ana, Leo y Eva registran un peso muerto con `POST /api/sets` (responde 201 con su línea). `GET /api/sets/stats` dice que hay 3 series y que el catálogo ha creado **1** movimiento. La escena muestra la serie de Eva.

Un movimiento desconocido responde 404; unas repeticiones fuera de rango, 400; y si el registro de la demo se llena (10.000 series), 409.
@describe: POST /api/sets viaja del atleta al controlador y a SetLog, que pide el peso muerto al catálogo; la serie de Eva apunta al movimiento compartido, resaltado junto a SetLog.

## @step:spring-does-it — Java y Spring ya lo hacen por ti
`Integer.valueOf(100)` devuelve siempre el mismo objeto: el JDK guarda en caché los enteros de -128 a 127, que son los que más se usan. Con 1000, por defecto, crea uno nuevo (no está garantizado: la caché se puede ampliar). Por eso comparar `Integer` con `==` es mala idea.

Spring hace lo mismo con los tipos MIME: `MimeTypeUtils.parseMimeType("application/json")` guarda los tipos analizados hace poco en una pequeña caché LRU (los `multipart` se quedan fuera) y devuelve la misma instancia. En una aplicación web se piden miles de veces.

> [!spring]
> Son la mitad "compartir" de Flyweight: un valor inmutable que se reparte desde un almacén por su clave. Sin estado extrínseco que separar, es caché o *interning*; Flyweight añade la separación.
@describe: Integer.valueOf(100) y MimeTypeUtils.parseMimeType reciben siempre la misma instancia en caché, resaltadas.

## @step:recap — Resumen
Empezaste con una copia del movimiento en cada serie y acabaste con:

- **Un flyweight**, `Movement`, inmutable, con lo que comparten todas las series.
- **Una fábrica**, `MovementCatalog`, que crea cada uno una vez y lo reparte.
- **Estado extrínseco** en cada `LoggedSet`: atleta, repeticiones y kilos.

Sus vecinos: un **Singleton** es una sola instancia de una clase; con Flyweight hay una por clave (una por movimiento). En un **Composite** las hojas repetidas pueden ser flyweights, y los objetos de **State** y **Strategy** a menudo lo son. **Prototype** hace lo contrario: copia un objeto para que cada uno tenga el suyo. Y `String.intern()` o la deduplicación de cadenas de la JVM son parientes cercanos: comparten valores iguales, pero sin separar estado.

Cuándo no usarlo: con pocos objetos, o con poco estado repetido, el ahorro no compensa. Y si los datos compartidos tienen que cambiar por serie, no son intrínsecos: el flyweight no encaja. Mide antes de optimizar.

> [!key-idea]
> Lo que se repite, compártelo una vez; lo que cambia, que lo lleve cada uno.
@describe: Vista final: los atletas, el controlador, SetLog, las tres series apuntando a dos movimientos y el catálogo, todo dentro del contexto de Spring.
