---
title: Iterator
summary: El box guarda cientos de resultados, más cada mes, y el podio solo quiere a los tres mejores atletas. Recórrelos uno a uno con un for normal, sin cargar todo en memoria y sin repetir la paginación en cada sitio.
minutes: 10
level: beginner
recap:
  intent: Da una forma de recorrer los elementos de una colección uno a uno sin enseñar cómo están guardados, para que quien los recorre no dependa de esos detalles.
  participants:
    - Iterator (Iterator<Result>), con hasNext() y next()
    - ConcreteIterator (PagedResultIterator), que sabe pedir la siguiente página cuando hace falta
    - Aggregate (Iterable<Result>), lo que se puede recorrer
    - ConcreteAggregate (ResultHistory), que da un iterador nuevo para cada recorrido
    - Client (Leaderboard), que recorre con un for y para cuando le basta
  pros:
    - El cliente recorre con un for, sin saber nada de páginas ni de SQL
    - Solo se lee lo que se usa; si el bucle para pronto, no se piden más páginas
    - La paginación vive en un solo sitio en lugar de copiarse en cada informe
  cons:
    - Un recorrido largo hace varias consultas y puede ver datos que cambian mientras tanto
    - No hay acceso directo a una posición ni tamaño total sin recorrerlo todo
    - Escribir bien hasNext() y next() (sin saltarse ni repetir elementos) tiene su truco
  related:
    - Composite
    - Factory Method
    - Visitor
quiz:
  - q: ¿Cuántas páginas lee Leaderboard para el podio de Fran (top 3) con páginas de 50?
    options:
      - Cinco, porque necesita ver todos los resultados para ordenarlos
      - Tres, una por cada atleta que entra en el podio
      - Una, porque el bucle para en el tercero y el iterador no pide más
      - Ninguna, porque los resultados ya estaban cargados en memoria
    answer: 2
    explain: La base de datos ya devuelve los resultados ordenados. El iterador solo pide la siguiente página cuando se acaba la actual, y el bucle sale con break antes de que eso pase.
  - q: ¿Qué gana el cliente al recibir un Iterable en lugar de una List con todos los resultados?
    options:
      - Recorrerlos sin cargarlos todos en memoria
      - Evitar las N+1 consultas que provocaría una List
      - Acceder a cualquier posición directamente, como con get(i)
      - Que los resultados queden guardados en caché entre peticiones
    answer: 0
    explain: El cliente solo ve hasNext() y next(). Cómo se guardan los resultados, y cuándo se piden, es cosa del iterador.
  - q: ¿Por qué las páginas se piden "después del último resultado visto" y no con offset?
    options:
      - Porque offset puede devolver las páginas desordenadas
      - Porque así cada página trae siempre el mismo número de filas
      - Porque offset obliga a contar antes el total de filas
      - Porque offset hace recorrer y descartar las filas anteriores en cada página
    answer: 3
    explain: Con offset 200, la base de datos lee 200 filas para tirarlas. Pidiendo (seconds, id) > (el último visto), puede usar el índice para empezar justo ahí, y lo que ya se entregó no se repite aunque entren resultados nuevos.
  - q: ¿Qué hay que hacer siempre con el Stream que devuelve JdbcClient al llamar a stream()?
    options:
      - Nada, Spring lo cierra solo al terminar la petición
      - Cerrarlo, porque mantiene abiertos la conexión y el ResultSet
      - Convertirlo en una lista antes de usarlo para nada
      - Pasarlo a parallel() para que no bloquee la conexión
    answer: 1
    explain: El stream lee filas a medida que lo consumes, así que necesita el ResultSet abierto. Un try-with-resources lo cierra aunque salgas antes de tiempo.
---
## @step:problem — El podio de Fran
La pizarra muestra el podio de Fran: los tres **atletas** más rápidos, cada uno con su mejor marca. Hay 233 resultados guardados, de unos 90 atletas que repiten Fran a menudo, y cada mes hay más.

La primera versión, `LoadEverythingLeaderboard`, los carga **todos** en una lista, los ordena en memoria y se queda con los primeros. El test lo confirma: lee 233 filas para enseñar 3.

> [!problem]
> Para usar tres resultados, la app trae a memoria todos los que existen. Cuantos más haya, peor.
@describe: En la versión anterior, la petición del top 3 de Fran llega a LoadEverythingLeaderboard, resaltado en rojo, que trae las 233 filas de la tabla.

## @step:smell — La paginación, copiada
La alternativa habitual es paginar: pedir 50, luego otros 50… Pero mira `OffsetLoopReport`: el bucle de páginas está escrito a mano, con su `limit`, su `offset` y su condición de salida. Y cada informe que necesite recorrer los resultados lo vuelve a escribir.

Además, `offset 200` hace que la base de datos lea y descarte 200 filas en cada página. Y si mientras recorres entra un resultado, una fila se repite; si se borra uno, otra se pierde.

> [!warning]
> Cuando cada cliente sabe cómo están guardados los datos para poder recorrerlos, cambiar esa forma de guardarlos obliga a tocarlos a todos.
@describe: OffsetLoopReport, resaltado en rojo, pide a la tabla limit 50 offset ? en un bucle escrito a mano.

## @step:iterator — Uno a uno
Iterator mete el recorrido en un objeto con dos preguntas:

- `hasNext()`: ¿queda algo?
- `next()`: dame el siguiente.

`PagedResultIterator` responde con una página en memoria. Cuando se le acaba, pide la siguiente, y solo entonces: "los 50 siguientes **después del último que entregué**", con `(seconds, id) > (?, ?)` para que los empates se resuelvan por id. Si una página viene incompleta, sabe que era la última; si viene llena justo al final, hace falta una consulta más, vacía, para saberlo.

> [!key-idea]
> El iterador recuerda por dónde va. Quien lo usa solo pregunta "¿hay más?" y "dame otro".
@describe: Aparece PagedResultIterator, resaltado, que pide la siguiente página a la tabla solo cuando la actual se agota.

## @step:aggregate — Lo que se puede recorrer
`ResultHistory` no devuelve una lista. Devuelve un `Iterable<Result>`: algo que sabe dar un iterador nuevo cada vez que alguien empieza a recorrerlo.

Por eso dos bucles sobre el mismo `fastest("fran")` no se estorban: cada uno tiene su propio iterador, que empieza por el principio. `iterator()` es, de hecho, un factory method: `ResultHistory` decide qué iterador concreto se crea.
@describe: ResultHistory, resaltado, crea un iterador nuevo para cada recorrido.

## @step:client — Un for de toda la vida
`Leaderboard` recorre con un `for` normal: Java llama por debajo a `iterator()`, `hasNext()` y `next()`. Ni páginas, ni SQL, ni offsets.

Salta los resultados de atletas que ya están en el podio (cada uno sale una vez, con su mejor marca) y, cuando tiene los que necesita, sale con `break`. No sabe de antemano cuántas filas va a necesitar, y no le hace falta: como el iterador solo pide páginas bajo demanda, salir del bucle es también dejar de leer.

> [!key-idea]
> El cliente decide cuántos quiere; el iterador decide cómo conseguirlos.
@describe: Leaderboard, resaltado, pide fastest("fran") a ResultHistory y después next() al iterador.

## @step:lazy — Solo lo que se usa
El test lo cuenta: para el podio, con páginas de 50, se lee **una** página. Recorrer los 233 resultados lee cinco (50 + 50 + 50 + 50 + 33), y la última, al venir incompleta, evita una consulta más.

Con la versión que cargaba todo, el podio costaba todas las filas. Ahora cuesta las páginas que haga falta recorrer hasta tener tres atletas distintos, normalmente una, tenga el box 233 resultados o 50 000. Otros tests comprueban que los empates entre páginas no se repiten ni se pierden.
@describe: El iterador, resaltado junto a la tabla, solo ha leído la página 1.

## @step:request — El podio por la API
`GET /api/leaderboard/fran?top=3`:

1. `LeaderboardController` llama a `Leaderboard.top("fran", 3)`.
2. El `for` pide tres resultados al iterador, que lee la primera página.
3. La respuesta trae los tres con su puesto y su tiempo: el primero, 2:31.

`top` va de 1 a 100; fuera de ese rango, la respuesta es 400. Un WOD sin resultados devuelve una lista vacía.
@describe: GET /api/leaderboard/fran?top=3 viaja del coach al controlador, top("fran", 3) a Leaderboard, que pide next() tres veces al iterador; este lee la página 1. Leaderboard y el iterador aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
`JdbcClient` puede darte los resultados como un `Stream`: `query(Result.class).stream()`. Las filas se convierten en objetos a medida que consumes el stream, así que `limit(3)` deja de convertir pronto. Si el driver además las trae de la base de datos poco a poco depende de él (su *fetch size*, si hay transacción…): algunos se lo traen todo de golpe igualmente. Y el stream mantiene abiertos la conexión y el `ResultSet` hasta que lo cierras: úsalo siempre en un try-with-resources.

Un detalle: con el `for` y `hasNext()` el bucle lo llevas tú (iteración externa); con un `Stream` y sus operaciones, lo lleva la librería (iteración interna).

En Spring Data, los repositorios devuelven `Slice`, `Page` o `Stream`, y desde la versión 3.1 tienen `Window` y `WindowIterator`, que recorren los resultados por páginas "a partir de la última posición", como nuestro iterador.

> [!spring]
> Elige según el caso: un iterador por páginas para recorrer sin mantener nada abierto entre página y página; un stream para leer de una vez sin cargarlo todo en memoria.
@describe: Dentro del contexto de Spring, JdbcClient, resaltado, da un Stream<Result>, también resaltado, que convierte las filas de la tabla a medida que se consumen.

## @step:recap — Resumen
Empezaste cargando 230 filas para enseñar 3 y acabaste con:

- **Un iterador** que entrega uno a uno y pide la siguiente página solo cuando hace falta.
- **Un agregado**, `ResultHistory`, que da un iterador nuevo para cada recorrido.
- **Un cliente** que recorre con un `for` y para cuando le basta.
- **Páginas por clave**, "después del último visto", en lugar de offset.

No lo confundas con sus vecinos: **Composite** describe *cómo están organizados* los datos (un árbol), e Iterator *cómo recorrerlos* sin saberlo; **Visitor** sirve para hacer operaciones distintas sobre cada elemento que recorres.

Y cuándo no hace falta: si los datos son pocos y ya están en memoria, una `List` y su for son más sencillos; y si sabes cuántas filas quieres y el filtro cabe en SQL, un `LIMIT n` en la consulta es mejor que cualquier iterador. El iterador por páginas compensa cuando no sabes cuántas filas vas a necesitar y traerlo todo sale caro.

> [!key-idea]
> Cuando alguien necesita recorrer una colección, dale un iterador, no la colección: así puede parar cuando quiera y no depende de cómo está guardada.
@describe: Vista final: el coach, el controlador, Leaderboard, ResultHistory, el iterador y la tabla de resultados, todo dentro del contexto de Spring.
