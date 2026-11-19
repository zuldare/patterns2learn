---
title: Singleton
summary: Un único catálogo de WODs para toda la app. Mira por qué el Singleton clásico se queda corto y cómo Spring te da uno sin escribir ni una línea de patrón.
minutes: 10
level: beginner
recap:
  intent: Garantiza que una clase tenga una sola instancia y que todo el que la necesite use esa misma, a través de un punto de acceso conocido.
  participants:
    - Singleton (WodCatalog), la clase de la que solo debe existir una instancia
    - Punto de acceso, que en el GoF es getInstance() y en Spring es la inyección del bean
    - Clientes (WodController, BookingService), que usan la instancia compartida sin crearla
  pros:
    - Una sola fuente de verdad, porque todos ven los mismos datos
    - El trabajo caro (cargar el catálogo) se hace una vez
    - Con Spring no escribes nada del patrón, y sigues pudiendo sustituir el bean en los tests
  cons:
    - El estado compartido se usa desde varios hilos a la vez, así que tiene que ser seguro
    - En su versión clásica es un global disfrazado, que acopla y ensucia los tests
    - Es fácil abusar de él y meter en un singleton cosas que tienen estado por petición
  related:
    - Factory Method
    - Facade
    - Flyweight
quiz:
  - q: Si no pones ninguna anotación de scope, ¿cuántas instancias de WodCatalog crea Spring?
    options:
      - Una por cada clase que la inyecta
      - Una para todo el contenedor, compartida por todos
      - Una por petición HTTP
      - Ninguna hasta que alguien llama a getInstance()
    answer: 1
    explain: El scope por defecto de un bean es singleton, es decir, una instancia por contenedor. Todos los que lo inyectan reciben ese mismo objeto.
  - q: ¿Cuál es el principal problema del Singleton clásico con getInstance()?
    options:
      - Que no funciona con varios hilos
      - Que es más lento que crear objetos con new
      - Que Java no permite constructores privados
      - Que es un estado global oculto, difícil de sustituir en tests y que arrastra cambios entre ellos
    answer: 3
    explain: Cualquier clase puede llamar a getInstance() sin declararlo en su constructor. La dependencia queda escondida, no puedes pasar un doble de test y el estado que deja un test lo ve el siguiente.
  - q: Dos coaches añaden WODs a la vez al mismo WodCatalog. ¿Qué lo hace seguro?
    options:
      - Un ConcurrentHashMap con putIfAbsent, que comprueba e inserta en un único paso atómico
      - Que Spring crea un WodCatalog por cada hilo
      - Marcar la clase con @Component
      - Nada, los beans singleton nunca se usan desde varios hilos
    answer: 0
    explain: Spring no hace seguro tu bean, solo lo comparte. Como todas las peticiones usan la misma instancia, el estado mutable tiene que protegerse; aquí lo hace el mapa concurrente.
  - q: ¿Cuándo usarías @Scope("prototype") en lugar del singleton por defecto?
    options:
      - Siempre que el bean tenga algún campo
      - Para que el bean arranque más rápido
      - Cuando cada uso necesita su propio estado, como el cronómetro de cada sesión de entreno
      - Nunca, prototype está obsoleto
    answer: 2
    explain: Con prototype, Spring crea un objeto nuevo cada vez que se lo pides. Encaja con objetos con estado propio y de vida corta, como un WodTimer por sesión de entreno. Ojo, si lo inyectas en un singleton, se crea una sola vez; para uno nuevo cada vez, pídelo con ObjectProvider<WodTimer>. Lo que se comparte, como el catálogo, se queda en singleton.
---
## @step:problem — Cada uno con su catálogo
La app del box tiene un catálogo de WODs: Fran, Cindy y los que vaya añadiendo el coach. Lo usan dos partes de la app. `WodController` los lista y deja añadir nuevos, y `BookingService` comprueba que el WOD existe antes de reservar plaza.

La versión ingenua: cada una hace `new NaiveWodCatalog()` en su propio campo.

> [!problem]
> Hay **dos** catálogos. Cada `new` vuelve a cargar los datos (imagina que lee un fichero grande o va a la base de datos) y cada copia vive su propia vida.
@describe: El coach habla con WodController y el atleta con BookingService. Cada uno tiene al lado su propia copia de WodCatalog, las dos resaltadas.

## @step:smell — Murph no aparece
El coach añade **Murph** para el Memorial Day. `WodController` lo guarda en *su* catálogo y la lista lo muestra.

Un atleta intenta reservar Murph y `BookingService` le dice que no existe. Es lógico, porque está mirando la otra copia.

> [!warning]
> Dos copias de algo que debería ser único acaban desincronizadas. El test del ejemplo lo demuestra: Murph está en la lista, pero `canBook("Murph")` devuelve `false`.
@describe: Un paquete con el texto Murph viaja del coach a WodController y de ahí a la copia número 1 del catálogo. La copia número 2, al lado de BookingService, queda resaltada porque no se entera.

## @step:classic — El Singleton de libro
La receta clásica del GoF: que la propia clase impida que haya más de una instancia.

- Un constructor **privado**, para que nadie pueda hacer `new`.
- Una instancia **estática** guardada en la propia clase. Aquí va en una clase interna `Holder`, que la JVM inicializa la primera vez que se usa y de forma segura entre hilos.
- Un método `getInstance()` que siempre devuelve esa instancia.

Ahora el controlador y el servicio llaman a `ClassicWodCatalog.getInstance()` y ven lo mismo. Murph ya se puede reservar.

> [!key-idea]
> El problema de las dos copias desaparece porque solo existe una instancia y todos llegan a ella por el mismo punto de acceso.
@describe: Las dos copias desaparecen. En el centro queda ClassicWodCatalog, resaltado, y tanto WodController como BookingService lo llaman.

## @step:classic-cons — El precio de un global
Funciona, pero has creado una variable global con otro nombre:

- **Dependencia oculta.** Quien usa el catálogo no lo pide en su constructor: lo saca de `getInstance()` desde dentro de un método, así que solo lo descubres leyendo el código.
- **Tests que se contaminan.** El estado sobrevive entre tests. Si uno añade "Grace", el siguiente se la encuentra.
- **Imposible de sustituir.** No puedes pasarle un catálogo falso a un test sin trucos de reflexión.

> [!warning]
> El Singleton clásico mezcla dos responsabilidades: lo que hace la clase (gestionar WODs) y cuántas instancias hay de ella. Lo segundo no debería ser cosa suya.
@describe: El diagrama no cambia. ClassicWodCatalog sigue resaltado, con su aspecto de código problemático, mientras los dos clientes dependen de él.

## @step:spring-bean — Que se encargue el contenedor
En Spring, cuántas instancias hay lo decide el **contenedor**, no la clase. `WodCatalog` es una clase normal con un constructor público y la anotación `@Component`.

Spring la crea **una vez** al arrancar y se la pasa por constructor a quien la pida: `WodController(WodCatalog catalog)` y `BookingService(WodCatalog catalog)`.

> [!spring]
> El scope por defecto de un bean es `singleton`: una instancia por contenedor. Tienes la garantía del patrón sin constructor privado, sin `getInstance()` y sin estado estático.
@describe: Aparece la plataforma del contexto de Spring. En el centro está WodCatalog, resaltado junto al contexto, y WodController y BookingService están unidos a él con enlaces de inyección.

## @step:shared — Una sola fuente de verdad
Repetimos la historia de Murph:

1. El coach hace `POST /api/wods` con Murph y `WodController` lo añade al catálogo.
2. Un atleta hace `POST /api/bookings?wod=Murph` y `BookingService` busca en el **mismo** catálogo.
3. La reserva se crea con un 201.

Y lo de los tests también se arregla. Como la dependencia entra por el constructor, en un test unitario haces `new BookingService(catalogoDePrueba)` y listo.

> [!key-idea]
> Compartido no significa global: el catálogo es único, pero cada clase dice explícitamente que lo necesita.
@describe: El coach envía POST Murph a WodController, que lo añade al catálogo; el atleta envía book Murph a BookingService, que envía find Murph al mismo WodCatalog, resaltado en el centro.

## @step:threads — Ojo: compartido entre hilos
Un bean singleton lo usan **todas** las peticiones a la vez, cada una en su hilo. Mientras un coach añade Murph, cien atletas pueden estar buscando Fran.

Por eso el catálogo guarda los WODs en un `ConcurrentHashMap` y usa `putIfAbsent`, que comprueba si el nombre existe y lo inserta en un solo paso atómico. Si el WOD ya existe, la API responde con un 409 y no machaca el anterior.

> [!warning]
> Spring comparte tu bean, pero no lo hace seguro. La regla práctica es que un singleton sea sin estado o con estado inmutable o protegido. Nada de guardar en un campo "el atleta de la petición actual".
@describe: Dos paquetes llegan a la vez a WodCatalog, add Murph desde WodController y find Fran desde BookingService. El catálogo está resaltado.

## @step:spring-does-it — Spring ya lo hace por ti
Llevas usando singletons desde tu primer `@Service`. Todos tus controladores, servicios y repositorios son beans singleton, y por eso un contexto con cientos de beans arranca una vez y no vuelve a crear nada en cada petición.

Cuando necesitas lo contrario, lo pides: `@Scope("prototype")` crea un objeto **nuevo** cada vez que se lo pides al contenedor. El `WodTimer` del ejemplo es así, porque cada sesión de entreno necesita su propio cronómetro.

> [!warning]
> Un prototype inyectado en el constructor de un singleton se crea **una sola vez**, cuando se crea el singleton, y a partir de ahí es tan compartido como él. Si quieres uno nuevo en cada uso, inyecta un `ObjectProvider<WodTimer>` y llama a `getObject()` cada vez.

> [!spring]
> El test del ejemplo lo comprueba: dos `getBean(WodCatalog.class)` devuelven el mismo objeto y dos `getBean(WodTimer.class)` devuelven objetos distintos. Hay más scopes (`request`, `session`), pero el que usarás el 95 % de las veces es el singleton por defecto.
@describe: Dentro del contexto de Spring quedan el WodCatalog único y dos WodTimer distintos, resaltados, uno para cada sesión de entreno.

## @step:recap — Resumen
Empezaste con dos catálogos desincronizados, probaste el Singleton de libro y acabaste dejando que Spring gestione la instancia:

- **Una instancia**, creada por el contenedor y compartida por inyección.
- **Dependencias visibles** en el constructor y fáciles de sustituir en tests.
- **Estado seguro entre hilos**, porque compartido significa concurrente.
- **`prototype`** cuando cada uso necesita su propia copia.

> [!key-idea]
> En Spring casi nunca escribes un Singleton: declaras un bean y el contenedor garantiza que sea único.
@describe: Vista final: el coach y el atleta, WodController y BookingService dentro del contexto de Spring, los dos inyectando el mismo WodCatalog.
