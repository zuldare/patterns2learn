---
title: Abstract Factory
summary: Fran no es igual para Rx, Scaled o Teens. El peso, la variante de dominada y la etiqueta de la pizarra tienen que ir siempre a juego. Pide las tres piezas a una sola fábrica por categoría y no se mezclarán.
minutes: 10
level: intermediate
recap:
  intent: Ofrece una forma de crear varias piezas que van juntas sin decir de qué clase es cada una, para que quien las usa reciba siempre una familia coherente.
  participants:
    - AbstractFactory (DivisionKit), la interfaz con un método por cada pieza de la familia
    - ConcreteFactory (RxKit, ScaledKit, TeensKit), una por familia
    - AbstractProduct (Barbell, PullVariant, Scorecard), las piezas que la familia necesita
    - Client (FranPlanner), que monta el WOD con la fábrica que le den
  pros:
    - Las piezas de una familia nunca se mezclan con las de otra
    - El cliente no conoce ninguna categoría concreta
    - Una familia nueva es una clase más, sin tocar al cliente
  cons:
    - Una pieza nueva en la familia obliga a tocar la interfaz y todas las fábricas
    - Si solo varía una pieza, es más estructura de la necesaria
    - Hay más tipos que seguir para entender de dónde sale cada cosa
  related:
    - Factory Method
    - Builder
    - Prototype
quiz:
  - q: ¿Qué evita que FranPlanner reciba un DivisionKit entero en lugar de tres parámetros sueltos?
    options:
      - Que el planificador tenga que conocer la base de datos de las categorías
      - Que haya que declarar un bean distinto para cada WOD del box
      - Que se mezclen piezas de familias distintas, como pesos Rx con etiqueta Scaled
      - Que la respuesta en JSON acabe siendo demasiado grande
    answer: 2
    explain: Las tres piezas salen del mismo kit, así que siempre son de la misma categoría. Con tres parámetros sueltos, nada impediría pasar una barra de Rx con una tarjeta de Scaled.
  - q: El box abre la categoría Masters. ¿Qué añades?
    options:
      - Una clase MastersKit con @Component("masters") que implemente DivisionKit
      - Un if más en FranPlanner para los pesos y la etiqueta de Masters
      - Un método mastersBarbell() en la interfaz DivisionKit
      - Un parámetro division en el constructor de cada producto
    answer: 0
    explain: WodService recibe todos los DivisionKit del contexto por su nombre de bean. Una fábrica nueva aparece sola en el mapa, y ni el planificador ni el controlador cambian.
  - q: ¿En qué se diferencia Abstract Factory de Factory Method?
    options:
      - Abstract Factory solo se puede escribir con interfaces y Factory Method solo con clases
      - Factory Method crea familias enteras de piezas y Abstract Factory un solo objeto
      - En nada, son dos nombres para el mismo patrón según el libro que leas
      - Abstract Factory crea una familia de piezas; Factory Method, una pieza mediante un método redefinido
    answer: 3
    explain: Una fábrica abstracta es un objeto con varios métodos de creación que van juntos. A menudo cada uno de esos métodos es, a su vez, un factory method.
  - q: Con Spring Boot y H2, ¿qué devuelve connection.createStatement()?
    options:
      - Un Statement genérico de Java que vale para cualquier base de datos
      - Un Statement del driver de H2, envuelto por el pool de conexiones
      - Null, hasta que se ejecute la primera consulta en esa conexión
      - Un objeto de Spring que traduce el SQL al dialecto de cada base de datos
    answer: 1
    explain: Cada Connection fabrica statements de su propio driver. HikariCP los envuelve (un Proxy), pero debajo hay un JdbcStatement de H2, y isWrapperFor lo confirma.
---
## @step:problem — Fran para cada categoría
En el box, cada atleta hace Fran en su categoría. La pizarra le pone a cada uno lo suyo:

- **Rx**: thrusters con 43 kg, dominadas, 10 minutos de límite.
- **Scaled**: 29 kg, dominadas con salto, 12 minutos.
- **Teens**: 20 kg, remo en anillas, 12 minutos.

La primera versión, `IfElseFranPlanner`, decide cada pieza por su cuenta: un `if` para el peso, otro para la dominada y otro para la etiqueta.

> [!problem]
> Las tres piezas tienen que ir a juego, pero cada una decide la categoría por separado.
@describe: El coach pide Fran para rx; WodService llama a IfElseFranPlanner, resaltado en rojo, con plan("rx").

## @step:smell — Una tarjeta mezclada
El `if` del peso compara sin distinguir mayúsculas y el de la etiqueta no. Basta con que alguien envíe `"RX"`: la tarjeta sale con **pesos de Rx y la etiqueta de Scaled**, y en el ranking aparece como escalado alguien que hizo el WOD completo. El test `IfElseFranPlannerTest` lo demuestra.

Y cada categoría nueva (Masters, adaptado) son tres `if` más, en tres sitios.

> [!warning]
> Cuando varias piezas tienen que ser de la misma familia, decidir la familia en cada pieza por separado es pedir que algún día se mezclen.
@describe: El diagrama no cambia: IfElseFranPlanner sigue resaltado en rojo; con plan("RX") sale una tarjeta con piezas de dos categorías.

## @step:abstract-factory — Una fábrica por familia
Abstract Factory reúne la creación de todas las piezas en un solo objeto. `DivisionKit` tiene un método por pieza:

- `barbell()`, el peso de la barra;
- `pull()`, la variante de dominada;
- `scorecard()`, la etiqueta y el límite de tiempo.

Quien tenga un `DivisionKit` puede pedirle las tres piezas, y las tres serán de la misma categoría.

> [!key-idea]
> La categoría se decide **una vez**, al elegir la fábrica. Después ya no hay nada que decidir.
@describe: Aparece la interfaz DivisionKit, resaltada, con tres fábricas que la implementan: RxKit, ScaledKit y TeensKit.

## @step:families — Cada fábrica, su familia
`RxKit` fabrica la barra de 43 kg, las dominadas y la tarjeta "Rx" de 10 minutos. `ScaledKit` y `TeensKit` hacen lo mismo con sus valores.

No hay ningún `if`: cada clase **es** una categoría, y no puede devolver una pieza de otra.
@describe: RxKit, resaltado, fabrica sus tres piezas: Barbell 43 kg con barbell(), pull-ups con pull() y Rx · 10' con scorecard().

## @step:client — El planificador no sabe qué categoría es
`FranPlanner` es el **cliente**: recibe un `DivisionKit` y le pide las tres piezas. Con ellas escribe la tarjeta.

No sabe si está escribiendo Fran para Rx o para Teens, y no le hace falta. Como las tres piezas salen del mismo kit, la tarjeta siempre es coherente.

> [!key-idea]
> El cliente depende de la interfaz de la fábrica y de las interfaces de las piezas, nunca de una familia concreta.
@describe: FranPlanner, resaltado, pide barbell(), pull() y scorecard() a DivisionKit.

## @step:spring-kits — Las fábricas son beans
En Spring, cada kit es un `@Component` con nombre: `"rx"`, `"scaled"`, `"teens"`. `WodService` recibe un `Map<String, DivisionKit>` con todos, indexados por ese nombre.

Al llegar una petición, normaliza la categoría, busca su kit en el mapa y se lo pasa al planificador. Si no existe, responde 400.

> [!spring]
> Inyectar un `Map<String, Interfaz>` es la forma más directa de elegir una fábrica por clave en Spring. Para elegir una sola familia para toda la aplicación (por ejemplo, según el entorno), también valen `@Profile` o `@ConditionalOnProperty`.
@describe: Aparece el contexto de Spring. WodService, resaltado junto al contexto, tiene todas las fábricas a mano; FranPlanner, DivisionKit, los tres kits y las piezas de Rx están dentro.

## @step:request — Fran Scaled
`GET /api/wods/fran?division=scaled`:

1. `WodService` busca el kit `"scaled"`.
2. `FranPlanner` le pide las tres piezas.
3. La tarjeta dice "Fran · Scaled", "thrusters 29 kg" y "jumping pull-ups", con 12 minutos de límite.

Sin `division`, se usa Rx. Con una categoría que no existe, la respuesta es 400 "unknown division".
@describe: GET /api/wods/fran?division=scaled viaja del coach al controlador, fran("scaled") al servicio y plan(scaledKit) a FranPlanner, que pide sus piezas a DivisionKit; FranPlanner y ScaledKit aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
JDBC es una fábrica abstracta que usas a diario. Spring Boot te da un `DataSource`, y cada `Connection` que sale de él fabrica las piezas de **su** base de datos:

- `createStatement()` y `prepareStatement(...)` devuelven statements del driver de H2;
- `getMetaData()` describe esa misma base de datos.

Tu código solo ve las interfaces de `java.sql`. Cambias el driver y la URL, y toda la familia cambia a la vez: nunca tendrás una `Connection` de PostgreSQL con statements de H2. El pool de conexiones (HikariCP) los envuelve, pero `isWrapperFor` confirma que debajo hay un `JdbcStatement` de H2.

> [!spring]
> `JdbcTemplate` se apoya en esta fábrica: pide la conexión al `DataSource` y crea con ella los statements que necesita.
@describe: Dentro del contexto de Spring, DataSource da una Connection de H2, resaltada, que fabrica su Statement, su PreparedStatement y su DatabaseMetaData.

## @step:recap — Resumen
Empezaste con tres `if` que podían discrepar y acabaste con:

- **Una fábrica abstracta**, `DivisionKit`, con un método por pieza.
- **Una fábrica concreta por familia**, como bean con nombre.
- **Un cliente**, `FranPlanner`, que monta la tarjeta sin saber la categoría.
- **Familias que no se mezclan**, porque se eligen una sola vez.

No lo confundas con sus vecinos: **Factory Method** crea *una* pieza con un método que una subclase redefine; **Abstract Factory** es un objeto que crea *varias* que van juntas. **Builder** monta *un* objeto complejo paso a paso, y **Prototype** crea piezas copiando un modelo.

Y cuándo no hace falta: si solo varía una pieza, basta con un Strategy o un Factory Method; y si las familias nunca van a cambiar, unas constantes son más sencillas.

> [!key-idea]
> Cuando varias piezas tienen que ir siempre a juego, que las fabrique el mismo objeto.
@describe: Vista final: el coach, el controlador, WodService, FranPlanner, DivisionKit con sus tres kits y las piezas de Rx, todo dentro del contexto de Spring.
