---
title: Composite
summary: Un WOD puede tener rondas dentro de rondas. Haz que un movimiento suelto y un bloque entero respondan a las mismas preguntas, y el árbol se calcula solo, sea lo profundo que sea.
minutes: 10
level: intermediate
recap:
  intent: Trata igual a una pieza suelta y a un grupo de piezas, para poder montar árboles tan profundos como haga falta y recorrerlos sin preguntar qué es cada nodo.
  participants:
    - Component (WorkoutPart), lo que todos los nodos saben hacer, sean hojas o grupos
    - Leaf (Movement, Run), un nodo sin hijos que responde por sí mismo
    - Composite (Block), un nodo con hijos que responde preguntándoles a ellos
    - Client (WodController, WodSummary), que trata cualquier nodo igual, sea un movimiento o un WOD entero
  pros:
    - El cliente no distingue entre una pieza y un grupo
    - Los árboles pueden tener cualquier profundidad sin código especial para cada nivel
    - Un tipo de hoja nuevo es una clase más; los bloques no cambian
  cons:
    - Una interfaz común puede quedarse corta o demasiado general si hojas y grupos se parecen poco
    - Es fácil olvidar los límites (profundidad, tamaño) cuando el árbol llega desde fuera
    - Si la estructura es siempre plana, es más código del necesario
  related:
    - Decorator
    - Iterator
    - Visitor
quiz:
  - q: ¿Qué hace Block.reps()?
    options:
      - Recorre todos los movimientos del WOD con dos bucles anidados
      - Pregunta solo a las hojas, porque los bloques no tienen repeticiones
      - Multiplica sus rondas por la suma de lo que devuelve cada hijo
      - Lee el total de repeticiones que se guardó al crear el WOD
    answer: 2
    explain: Block no sabe si cada hijo es un movimiento, una carrera u otro bloque. Le pregunta reps() a cada uno y cada uno responde a su manera, así que la recursión baja sola por el árbol.
  - q: Quieres añadir un tipo de hoja nuevo, Rest (descanso). ¿Qué cambias?
    options:
      - Una clase Rest que implemente WorkoutPart, y su nombre en @JsonSubTypes para el JSON
      - Block, para que sepa sumar los descansos en el tiempo total
      - Movement y Run, para que sepan qué hacer cuando van detrás de un descanso
      - WodSummary, para que cuente aparte el tiempo de descanso
    answer: 0
    explain: Block solo conoce WorkoutPart. Una hoja nueva que responda a reps(), seconds() y lines() encaja en cualquier bloque sin tocarlo.
  - q: Murph es una carrera, 20 rondas de 5, 10 y 15 repeticiones y otra carrera. ¿Qué devuelve murph.reps()?
    options:
      - 30, las repeticiones de una sola ronda del bloque interior
      - 20, el número de rondas que tiene el bloque interior
      - 50, las 20 rondas más las 30 repeticiones de cada una
      - 600, el bloque interior da 20 × 30 y las carreras, 0
    answer: 3
    explain: Murph pregunta a sus tres hijos. Las carreras dicen 0 y el bloque de 20 rondas dice 20 × 30 = 600. Murph tiene una sola ronda, así que el total es 600.
  - q: ¿Qué tiene de Composite el CompositePropertySource de Spring?
    options:
      - Que mezcla varios ficheros de propiedades y los guarda en uno nuevo
      - Que es un PropertySource hecho de PropertySources y se usa igual que cualquiera de ellos
      - Que organiza las propiedades en un árbol de carpetas según sus prefijos
      - Que deja cambiar las propiedades mientras la aplicación se está ejecutando
    answer: 1
    explain: Quien le pide una propiedad no sabe si habla con una fuente o con un grupo. El grupo pregunta a sus fuentes en orden y responde con la primera que la tiene; y un grupo puede contener otros grupos.
---
## @step:problem — El WOD plano
La pizarra del box muestra cada WOD con su total de repeticiones y una estimación del tiempo. La primera versión, `FlatWod`, entiende los WODs como "N rondas de estos movimientos":

- `reps()` suma los movimientos de una ronda y multiplica por las rondas;
- `seconds()` hace lo mismo con el tiempo.

Para Murph (correr una milla, 20 rondas de 5 dominadas, 10 flexiones y 15 sentadillas, y otra milla) alguien añadió dos campos: `runBeforeMeters` y `runAfterMeters`.

> [!problem]
> El modelo solo tiene un nivel. Cada WOD que no encaja se resuelve con otro campo especial.
@describe: El coach pide reps() a WodController, que llama a FlatWod, resaltado en rojo.

## @step:smell — Helen no cabe
Helen son 3 rondas de: correr 400 m, 21 swings con kettlebell y 12 dominadas. La carrera va **dentro** de cada ronda, y `FlatWod` no tiene forma de decirlo: solo sabe correr antes o después de todo.

Podrías añadir otro campo, `runInsideEachRoundMeters`. Y luego otro para un EMOM dentro de un AMRAP. Cada campo nuevo es otro caso en `reps()`, en `seconds()` y en cualquier otro cálculo que añadas.

> [!warning]
> Si tu modelo necesita un campo especial cada vez que algo contiene a otra cosa, lo que tienes es un árbol disfrazado.
@describe: El diagrama no cambia: FlatWod sigue resaltado en rojo; Helen no encaja en su único nivel de rondas.

## @step:component — Lo que todos saben hacer
Composite empieza por la pregunta que se le hace a cualquier trozo de entrenamiento, sea un movimiento o un WOD entero. Eso es `WorkoutPart`:

- `reps()`, las repeticiones;
- `seconds()`, el tiempo estimado;
- `lines()`, cómo se escribe en la pizarra.

Es el **Component** del patrón. Las anotaciones de Jackson solo sirven para recibir el árbol en JSON, con un campo `type` en cada nodo.

> [!key-idea]
> Si todos los nodos responden a las mismas preguntas, quien pregunta no necesita saber qué tipo de nodo tiene delante.
@describe: Aparece la interfaz WorkoutPart, resaltada, con tres clases que la implementan: Movement, Run y Block.

## @step:leaf — Las hojas
Las **hojas** responden por sí mismas:

- `Movement` (12 dominadas): 12 repeticiones, 3 segundos cada una en la estimación.
- `Run` (400 m): 0 repeticiones, a 5 minutos el kilómetro.

No tienen hijos ni saben que pueden estar dentro de un bloque.
@describe: Movement y Run, resaltados, implementan WorkoutPart.

## @step:composite — El bloque
`Block` es el **Composite**: unas rondas de otras partes, que a su vez pueden ser bloques. Para responder, pregunta a sus hijos:

- `reps()` es sus rondas por la suma de las repeticiones de cada hijo;
- `lines()` escribe su cabecera y debajo las líneas de cada hijo, con dos espacios más de sangría.

No pregunta si un hijo es un movimiento, una carrera u otro bloque. Le basta con que sea un `WorkoutPart`.

> [!key-idea]
> El grupo responde preguntando a sus hijos. La recursión sale sola: cada nivel hace lo mismo con el siguiente.
@describe: Block, resaltado, implementa WorkoutPart y además guarda una lista de WorkoutPart: sus partes.

## @step:tree — Murph como árbol
Murph ya no necesita campos especiales:

- un bloque "Murph" de una ronda,
- con una carrera, un bloque de **20 rondas** y otra carrera,
- y dentro del bloque de 20 rondas, los tres movimientos.

Helen es otro árbol: un bloque de 3 rondas con la carrera dentro. Con el mismo código caben los dos, y cualquier combinación que se le ocurra al coach.
@describe: El árbol de Murph: Murph, resaltado, contiene Run 1600 m, el bloque 20 rounds, también resaltado, y otra Run 1600 m; el bloque de 20 rondas contiene 5 pull-ups, 10 push-ups y 15 air squats.

## @step:request — La pregunta baja por el árbol
`GET /api/wods/murph`:

1. `WodController` busca Murph en la biblioteca y le pide `reps()`, `seconds()` y `lines()`.
2. Murph pregunta a sus tres hijos; el bloque de 20 rondas pregunta a sus tres movimientos.
3. Las respuestas suben: 20 × (5 + 10 + 15) = **600 repeticiones**, unos **46 minutos**.

`POST /api/wods/estimate` acepta cualquier árbol en JSON. Como llega de fuera, `Block` pone límites al construirse: de 1 a 50 rondas, de 1 a 10 partes, como mucho 4 niveles y no más de 10 000 repeticiones o 6 horas.

> [!warning]
> Un árbol que llega del cliente puede ser enorme o tener muchísimos niveles. Valida el tamaño y la profundidad al construirlo, no al recorrerlo.
@describe: GET /api/wods/murph viaja del coach al controlador; reps() baja de WodController a Murph, de Murph al bloque de 20 rondas y de ahí a cada movimiento. Todo el árbol aparece resaltado.

## @step:spring-does-it — Spring ya lo hace por ti
Un `CompositePropertySource` es un `PropertySource`… hecho de `PropertySource`s. Cuando le pides una propiedad, pregunta a sus fuentes en orden y devuelve la primera que la tiene. En el ejemplo, `downtown` responde la capacidad (20) y los minutos caen hasta `box-defaults` (60). Y como es un `PropertySource` más, se puede meter dentro de otro.

Hay más en Spring: `HandlerMethodArgumentResolverComposite` es un resolver de argumentos hecho de resolvers, `CompositeCacheManager` junta varios gestores de caché, y en Actuator, `/actuator/health` es un árbol de indicadores de salud.

> [!spring]
> Cuando en Spring veas `Composite` en el nombre de una clase, casi siempre es esto: un objeto que implementa la misma interfaz que los que contiene.
@describe: Dentro del contexto de Spring, CompositePropertySource, resaltado, pregunta a downtown por la capacidad (20) y a box-defaults por los minutos (60).

## @step:recap — Resumen
Empezaste con un WOD plano lleno de campos especiales y acabaste con:

- **Un Component**, `WorkoutPart`, con las preguntas que se le hacen a cualquier parte.
- **Hojas**, `Movement` y `Run`, que responden por sí mismas.
- **Un Composite**, `Block`, que responde preguntando a sus hijos.
- **Límites** al construir árboles que llegan de fuera.

Aquí las partes se reciben al crear el bloque y no se pueden añadir después. Otras versiones del patrón ponen `add()` y `remove()` en el grupo, o incluso en la interfaz común; es una decisión entre comodidad y seguridad.

Y cuándo no hace falta: si la estructura siempre tiene la misma forma y la misma profundidad, una clase con sus campos es más clara.

> [!key-idea]
> Cuando algo puede contener cosas de su mismo tipo, haz que el grupo y la pieza respondan igual.
@describe: Vista final: el coach, el controlador y el árbol de Murph, todo dentro del contexto de Spring.
