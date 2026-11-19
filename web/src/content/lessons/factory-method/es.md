---
title: Factory Method
summary: AMRAP, EMOM o For Time se describen y se puntúan distinto. Deja que cada planificador decida qué tipo de WOD construir y que el resto del código ni se entere de qué clase sale.
minutes: 11
level: intermediate
recap:
  intent: Define un método para crear un objeto, pero deja que las subclases decidan qué clase concreta instanciar.
  participants:
    - Product (Workout), la interfaz de lo que se crea
    - ConcreteProduct (Amrap, Emom, ForTime), cada formato de WOD
    - Creator (WodPlanner), con el método plantilla plan() que usa el método fábrica createWorkout()
    - ConcreteCreator (AmrapPlanner, EmomPlanner, ForTimePlanner), que deciden qué producto construir
  pros:
    - El código que usa el producto no conoce las clases concretas
    - Un formato nuevo es un producto y un creador nuevos; lo demás no cambia
    - La lógica de construir cada tipo vive junto a quien la conoce
  cons:
    - Una jerarquía de creadores paralela a la de productos, que puede parecer mucho para casos simples
    - Si crear es trivial, un constructor o un método estático bastan
    - Usa herencia, así que el creador concreto queda atado a la clase base
  related:
    - Abstract Factory
    - Template Method
    - Strategy
quiz:
  - q: En WodPlanner, ¿cuál es exactamente el "factory method"?
    options:
      - plan(), porque es público
      - El constructor de WodPlanner
      - createWorkout(), el método abstracto que cada subclase implementa para decidir qué Workout construir
      - format(), porque devuelve el nombre del tipo
    answer: 2
    explain: plan() es el algoritmo común y llama a createWorkout() sin saber qué clase saldrá. Cada creador concreto lo implementa con su new Amrap(...), new Emom(...) o new ForTime(...).
  - q: Quieres añadir el formato Tabata. ¿Qué cambias?
    options:
      - Un producto Tabata y un TabataPlanner con @Component; WodService y el controlador no cambian
      - Los dos switch de SwitchingWodService
      - WodPlanner, para añadir un caso más
      - El controlador, para que conozca el nuevo formato
    answer: 0
    explain: WodService recibe todos los WodPlanner del contexto y los indexa por formato. Un creador nuevo con su producto es todo lo que hace falta.
  - q: Con un FactoryBean registrado como "dailyWod", ¿qué devuelve context.getBean("dailyWod")?
    options:
      - El propio FactoryBean
      - Una excepción, porque los FactoryBean no se pueden pedir por nombre
      - Siempre null hasta que llames a getObject() tú
      - El objeto que fabrica (lo que devuelve getObject()); para el FactoryBean en sí se pide "&dailyWod"
    answer: 3
    explain: Spring trata los FactoryBean de forma especial. El nombre del bean da el producto, y el prefijo & da la fábrica. Así funcionan muchas integraciones que construyen objetos complejos.
  - q: ¿Qué relación hay entre Factory Method y Template Method en este ejemplo?
    options:
      - Ninguna, son patrones incompatibles
      - plan() es un Template Method y uno de sus pasos, createWorkout(), es el Factory Method
      - Factory Method es una versión antigua de Template Method
      - Template Method crea objetos y Factory Method los usa
    answer: 1
    explain: Es una combinación muy habitual. La clase base fija el algoritmo (Template Method) y uno de sus pasos es justamente "crea el objeto adecuado" (Factory Method).
---
## @step:problem — Un servicio que conoce todos los formatos
El coach programa los WODs de la semana en la app. Hay tres formatos y cada uno se describe y se puntúa distinto:

- **AMRAP**: tantas rondas como puedas en un tiempo; se puntúa en rondas y repeticiones.
- **EMOM**: cada minuto empiezas de nuevo; se puntúa en minutos completados.
- **For Time**: termina el trabajo lo antes posible, con un tiempo límite; se puntúa en segundos y menos es mejor (si llegas al límite, cuentan las repeticiones hechas).

`SwitchingWodService` lo resuelve con un `switch` por formato para construir la descripción.

> [!problem]
> El servicio conoce todos los formatos y cómo es cada uno por dentro.
@describe: El coach envía AMRAP 20' a WodController, que llama a SwitchingWodService, resaltado en rojo: un único servicio que construye a mano el texto de cada formato.

## @step:smell — El mismo switch, dos veces
Mira más abajo: hay **otro** `switch` por formato para la unidad de puntuación, y una comprobación suelta `format.equals("for-time")` para saber si menos es mejor.

Añadir Tabata significa tocar los dos `switch` y esa comprobación, y acordarse de todos. Cada formato está repartido por el servicio en lugar de vivir en un sitio.

> [!warning]
> Un `switch` sobre un tipo que aparece en varios sitios suele pedir a gritos un objeto por tipo.
@describe: El diagrama no cambia: SwitchingWodService sigue resaltado en rojo, con un switch por cada cosa que depende del formato.

## @step:factory-method — El creador no sabe qué crea
Factory Method separa **usar** un objeto de **decidir qué clase** es:

- `Workout` es el producto: describe el WOD y dice cómo se puntúa.
- `WodPlanner` es el creador. Su método `plan()` arma el plan para la pizarra, pero para conseguir el `Workout` llama a `createWorkout()`, un método **abstracto**.

`plan()` funciona igual para cualquier formato. La pregunta "¿qué clase de Workout?" se la deja a las subclases.

> [!key-idea]
> El método fábrica es un hueco en el algoritmo que dice "aquí va un objeto, que la subclase decida cuál".
@describe: Aparece la clase abstracta WodPlanner, resaltada, con tres planificadores que la implementan.

## @step:creators — Un creador por formato
Cada formato tiene su creador:

- `AmrapPlanner` devuelve un `new Amrap(...)`.
- `EmomPlanner` devuelve un `new Emom(...)`.
- `ForTimePlanner` devuelve un `new ForTime(...)`.

Y cada producto sabe describirse y puntuarse. Ya no hay ningún `switch`: la decisión está repartida en clases pequeñas y cada una sabe lo suyo.

> [!key-idea]
> Añadir Tabata es un producto y un creador nuevos. `WodPlanner` ni se toca.
@describe: Los tres planificadores, resaltados, construyen cada uno su producto: new Amrap(), new Emom() y new ForTime().

## @step:spring-planners — Los creadores son beans
Cada planificador es un `@Component`. `WodService` recibe **todos** los `WodPlanner` del contexto y los guarda en un mapa por formato (`amrap`, `emom`, `for-time`).

Cuando llega una petición, busca el planificador de ese formato y le pide el plan. Si el formato no existe, responde con un 400.

> [!spring]
> Esto mezcla dos patrones que ya conoces: elegir el creador por clave es un Strategy (como en esa lección), y cada creador aplica Factory Method para construir su producto.
@describe: Aparece el contexto de Spring. WodService, resaltado junto al contexto, está unido a los tres planificadores, que implementan WodPlanner y construyen sus productos.

## @step:request — Cindy, AMRAP de 20 minutos
El coach programa Cindy: `POST /api/wods/plan` con formato `amrap`, 20 minutos y tres movimientos.

1. `WodService` busca el planificador `amrap`.
2. `AmrapPlanner.plan()` llama a su `createWorkout()`, que construye un `Amrap`.
3. La pizarra recibe "AMRAP 20': 5 pull-ups, 10 push-ups, 15 air squats", que se puntúa en rondas y repeticiones.

El test del ejemplo hace esa misma petición llamando directamente a `WodService`.

> [!key-idea]
> Ni el servicio ni el controlador han escrito `new Amrap(...)`. Solo lo sabe su creador.
@describe: Cindy · AMRAP 20' viaja del coach al controlador, plan() a WodService y a AmrapPlanner, resaltado, que construye un Amrap, también resaltado.

## @step:for-time — Cada creador sabe lo suyo
En For Time, los minutos de la petición no son la duración, sino el **tiempo límite**: Fran con un límite de 8 minutos. Solo `ForTimePlanner` sabe interpretarlo así, y crea un `ForTime` en el que menos tiempo es mejor.

Ese conocimiento vive en el creador del formato, no repartido en `if` por el servicio.

> [!warning]
> Si crear un objeto es solo un `new` sin decisiones, Factory Method es demasiado. Úsalo cuando la clase concreta o su configuración dependan de algo que solo una parte del código conoce.
@describe: WodService envía plan() a ForTimePlanner, resaltado, que construye un ForTime, también resaltado.

## @step:spring-does-it — Spring ya lo hace por ti
En sentido amplio, Spring está lleno de "métodos que crean": `BeanFactory.getBean(...)` te da objetos sin que hagas `new`, y en la documentación de Spring a cada método `@Bean` se le llama *factory method*. Pero no son el patrón del GoF, porque no hay una subclase que decida qué clase crear.

Lo más parecido al patrón es `FactoryBean`: un bean cuyo trabajo es **fabricar otro objeto**. Spring registra el `FactoryBean` y, cuando alguien pide ese bean, llama a su `getObject()`; como `isSingleton()` es `true` por defecto, el resultado se guarda y se reutiliza. En el ejemplo, `DailyWodFactoryBean` decide el WOD del día: pides `"dailyWod"` y recibes un `Amrap`; pides `"&dailyWod"` y recibes la fábrica.

> [!spring]
> Muchas integraciones funcionan así por dentro: construyen un objeto complejo (un cliente, una sesión, un proxy) detrás de un bean con un nombre sencillo.
@describe: Dentro del contexto de Spring, DailyWodFactoryBean, resaltado, envía getObject() y entrega un Amrap.

## @step:recap — Resumen
Empezaste con un servicio que tenía un `switch` por formato y acabaste con:

- **Un producto**, `Workout`, con una clase por formato.
- **Un creador**, `WodPlanner`, cuyo `plan()` usa un método fábrica abstracto.
- **Un creador concreto por formato**, como bean, que decide qué construir.
- **`FactoryBean`**, cuando quieres que el propio contenedor llame a tu fábrica.

> [!key-idea]
> Cuando "qué clase crear" depende del caso, saca esa decisión a un método que las subclases puedan redefinir.
@describe: Vista final: el coach, el controlador, WodService, los tres planificadores implementando WodPlanner y sus productos, todo dentro del contexto de Spring.
