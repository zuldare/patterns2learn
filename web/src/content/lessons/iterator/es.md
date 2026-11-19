---
title: Iterator
summary: El box guarda miles de resultados y la clasificación solo quiere los tres mejores. Recórrelos uno a uno con un for normal, sin cargar todo en memoria y sin repetir la paginación en cada sitio.
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
      - Recorrerlos con un for sin saber de páginas y sin cargarlo todo en memoria
      - Poder ordenarlos como quiera antes de empezar a leerlos
      - Acceder a cualquier posición directamente, como con get(i)
      - Que los resultados queden guardados en caché entre peticiones
    answer: 0
    explain: El cliente solo ve hasNext() y next(). Cómo se guardan los resultados, y cuándo se piden, es cosa del iterador.
  - q: ¿Por qué las páginas se piden "después del último resultado visto" y no con offset?
    options:
      - Porque H2 no admite offset en sus consultas
      - Porque así cada página trae siempre el mismo número de filas
      - Porque offset solo funciona cuando la clave es numérica
      - Porque offset hace recorrer y descartar las filas anteriores en cada página
    answer: 3
    explain: Con offset 200, la base de datos lee 200 filas para tirarlas. Pidiendo "después de este tiempo y este id", el índice salta directamente al sitio; y si entran resultados nuevos mientras recorres, no se repiten ni se saltan filas por desplazamiento.
  - q: ¿Qué hay que hacer siempre con el Stream que devuelve JdbcClient al llamar a stream()?
    options:
      - Convertirlo en una lista antes de usarlo para nada
      - Cerrarlo, porque mantiene abiertos la conexión y el ResultSet
      - Llamar a parallel() para que lea las filas más rápido
      - Recorrerlo dos veces para comprobar que los datos son correctos
    answer: 1
    explain: El stream lee filas a medida que lo consumes, así que necesita el ResultSet abierto. Un try-with-resources lo cierra aunque salgas antes de tiempo.
---
## @step:problem — El podio de Fran
La pizarra muestra el podio de Fran: los tres tiempos más rápidos del box. Hay 230 resultados guardados, y cada mes hay más.

La primera versión, `LoadEverythingLeaderboard`, los carga **todos** en una lista, los ordena en memoria y se queda con tres. El test lo confirma: lee 230 filas para enseñar 3.

> [!problem]
> Para usar tres resultados, la app trae a memoria todos los que existen. Cuantos más haya, peor.
@describe: El coach pide el top 3 de Fran al controlador, que llama a LoadEverythingLeaderboard, resaltado en rojo; este trae las 230 filas de la tabla.

## @step:smell — La paginación, copiada
La alternativa habitual es paginar: pedir 50, luego otros 50… Pero mira `OffsetLoopReport`: el bucle de páginas está escrito a mano, con su `limit`, su `offset` y su condición de salida. Y cada informe que necesite recorrer los resultados lo vuelve a escribir.

Además, `offset 200` hace que la base de datos lea y descarte 200 filas en cada página, y si entra un resultado mientras recorres, una fila puede repetirse o perderse.

> [!warning]
> Cuando cada cliente sabe cómo están guardados los datos para poder recorrerlos, cambiar esa forma de guardarlos obliga a tocarlos a todos.
@describe: OffsetLoopReport, resaltado en rojo, pide a la tabla limit 50 offset ? en un bucle escrito a mano.

## @step:iterator — Uno a uno
Iterator mete el recorrido en un objeto con dos preguntas:

- `hasNext()`: ¿queda algo?
- `next()`: dame el siguiente.

`PagedResultIterator` responde con una página en memoria. Cuando se le acaba, pide la siguiente, y solo entonces: "los 50 siguientes **después del último que entregué**". Si una página viene incompleta, sabe que era la última.

> [!key-idea]
> El iterador recuerda por dónde va. Quien lo usa solo pregunta "¿hay más?" y "dame otro".
@describe: Aparece PagedResultIterator, resaltado, que pide la siguiente página a la tabla solo cuando la actual se agota.

## @step:aggregate — Lo que se puede recorrer
`ResultHistory` no devuelve una lista. Devuelve un `Iterable<Result>`: algo que sabe dar un iterador nuevo cada vez que alguien empieza a recorrerlo.

Por eso dos bucles sobre el mismo `fastest("fran")` no se estorban: cada uno tiene su propio iterador, que empieza por el principio.
@describe: ResultHistory, resaltado, crea un iterador nuevo para cada recorrido.

## @step:client — Un for de toda la vida
`Leaderboard` recorre con un `for` normal: Java llama por debajo a `iterator()`, `hasNext()` y `next()`. Ni páginas, ni SQL, ni offsets.

Cuando tiene los que necesita, sale con `break`. Como el iterador solo pide páginas bajo demanda, salir del bucle es también dejar de leer.

> [!key-idea]
> El cliente decide cuántos quiere; el iterador decide cómo conseguirlos.
@describe: Leaderboard, resaltado, pide fastest("fran") a ResultHistory y después next() al iterador.

## @step:lazy — Solo lo que se usa
El test lo cuenta: para el podio, con páginas de 50, se lee **una** página. Recorrer los 230 resultados lee cinco (50 + 50 + 50 + 50 + 30), y la última, al venir incompleta, evita una consulta más.

Con la versión que cargaba todo, el podio costaba 230 filas. Ahora cuesta 50, y seguirá costando 50 aunque el box tenga 50 000 resultados.
@describe: El iterador, resaltado junto a la tabla, solo ha leído 1 página de 5.

## @step:request — El podio por la API
`GET /api/leaderboard/fran?top=3`:

1. `LeaderboardController` llama a `Leaderboard.top("fran", 3)`.
2. El `for` pide tres resultados al iterador, que lee la primera página.
3. La respuesta trae los tres con su puesto y su tiempo: el primero, 2:31.

`top` va de 1 a 100; fuera de ese rango, la respuesta es 400. Un WOD sin resultados devuelve una lista vacía.
@describe: GET /api/leaderboard/fran?top=3 viaja del coach al controlador, top("fran", 3) a Leaderboard, que pide next() tres veces al iterador; este lee la página 1. Leaderboard y el iterador aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
`JdbcClient` puede darte los resultados como un `Stream`: `query(Result.class).stream()`. Las filas se leen a medida que consumes el stream, así que `limit(3)` deja de leer pronto (cuántas filas trae el driver de golpe depende de su *fetch size*). A cambio, el stream mantiene abiertos la conexión y el `ResultSet` hasta que lo cierras: úsalo siempre en un try-with-resources.

En Spring Data, los repositorios devuelven `Slice`, `Page` o `Stream`, y desde la versión 3.1 tienen `Window` y `WindowIterator`, que recorren los resultados por páginas "a partir de la última posición", como nuestro iterador.

> [!spring]
> Elige según el caso: un iterador por páginas para recorrer sin mantener nada abierto entre página y página; un stream para leer de una vez sin cargarlo todo en memoria.
@describe: Dentro del contexto de Spring, JdbcClient, resaltado, da un Stream<Result>, también resaltado, que lee filas de la tabla a medida que se consumen.

## @step:recap — Resumen
Empezaste cargando 230 filas para enseñar 3 y acabaste con:

- **Un iterador** que entrega uno a uno y pide la siguiente página solo cuando hace falta.
- **Un agregado**, `ResultHistory`, que da un iterador nuevo para cada recorrido.
- **Un cliente** que recorre con un `for` y para cuando le basta.
- **Páginas por clave**, "después del último visto", en lugar de offset.

No lo confundas con sus vecinos: **Composite** describe *cómo están organizados* los datos (un árbol), e Iterator *cómo recorrerlos* sin saberlo; **Visitor** sirve para hacer operaciones distintas sobre cada elemento que recorres.

Y cuándo no hace falta: si los datos son pocos y ya están en memoria, una `List` y su for son más sencillos; un iterador por páginas solo compensa cuando traerlo todo sale caro.

> [!key-idea]
> Cuando alguien necesita recorrer una colección, dale un iterador, no la colección: así puede parar cuando quiera y no depende de cómo está guardada.
@describe: Vista final: el coach, el controlador, Leaderboard, ResultHistory, el iterador y la tabla de resultados, todo dentro del contexto de Spring.
