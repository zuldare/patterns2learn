---
title: Builder
summary: Una clase del box tiene nombre, hora, duración, plazas, coach y varias opciones. Constrúyela paso a paso con nombres claros y obtén al final un objeto inmutable que siempre es válido.
minutes: 10
level: beginner
recap:
  intent: Separa la construcción de un objeto complejo de su representación, para montarlo paso a paso y que el mismo proceso pueda dar resultados distintos.
  participants:
    - Builder (ClassSession.Builder), que recoge las piezas paso a paso
    - Product (ClassSession), el objeto terminado, inmutable y válido
    - Director (SessionTemplates), que conoce las recetas habituales y llama a los pasos en orden
    - Client (ScheduleService), que usa el builder directamente para las peticiones a medida y delega en el director las recetas fijas
  pros:
    - Cada opción tiene nombre, así que la llamada se lee sola
    - Los valores por defecto viven en un sitio y solo cambias lo que necesitas
    - El objeto no existe hasta build(), y build() lo valida en un único sitio
  cons:
    - Más código, una clase extra por cada producto
    - Si el objeto tiene dos o tres campos, un constructor basta
    - Un campo obligatorio olvidado solo salta al llamar a build(), no al compilar (salvo que lo pidas al crear el builder)
  related:
    - Abstract Factory
    - Composite
    - Factory Method
quiz:
  - q: ¿Cuál es el problema real de new TelescopingSession("Hyrox prep", LocalTime.of(18, 0), 60, 12, "Ana", true, false)?
    options:
      - Que es más lento que un builder
      - Que puedes intercambiar true y false (o 60 y 12) y sigue compilando, pero creas otra sesión distinta
      - Que los records no permiten constructores con tantos parámetros
      - Que Spring no puede inyectar objetos creados con new
    answer: 1
    explain: Los parámetros del mismo tipo seguidos no dicen qué significan. El compilador no se queja si los cambias de sitio, y nadie lo nota hasta que la clase se llena de principiantes.
  - q: ¿Dónde están las reglas, como "capacidad entre 1 y 30" o "una clase para principiantes necesita coach"?
    options:
      - En cada método del builder, por separado
      - En el controlador, antes de llamar al servicio
      - En el constructor compacto del record, al que llama build(), así que nadie puede saltárselas
      - En SessionTemplates
    answer: 2
    explain: build() llama al constructor del record, y es ese constructor el que valida. Así las reglas están en un solo sitio y también se aplican si alguien crea un ClassSession sin pasar por el builder.
  - q: Inyectas RestClient.Builder en dos servicios y uno le pone un baseUrl. ¿Le afecta al otro?
    options:
      - No. Spring Boot lo declara con scope prototype, así que cada punto de inyección recibe su propio builder ya configurado
      - Sí, porque todos los beans son singleton
      - Solo si el bean está marcado con @Primary
      - Spring Boot no ofrece un RestClient.Builder, hay que crearlo con new
    answer: 0
    explain: Es un builder ya preparado (conversores de mensajes, customizers) y nuevo para cada uno. Lo terminas a tu gusto y llamas a build() sin pisar a nadie.
  - q: ¿Qué papel tiene SessionTemplates en el ejemplo?
    options:
      - Es el producto
      - Es el builder
      - Es el cliente que recibe la petición HTTP
      - Es el director, que conoce recetas como "beginner" u "open-gym" y llama a los pasos del builder en orden
    answer: 3
    explain: El director no sabe cómo se guarda cada campo, solo qué pasos tocan para cada tipo de clase. Si cambia la receta del box, cambia el director y el builder sigue igual.
---
## @step:problem — Siete argumentos seguidos
El coach programa una clase nueva: Hyrox prep a las 18:00, 60 minutos, 12 plazas, con Ana, apta para principiantes y sin lista de espera.

La primera versión usa un **constructor telescópico**: uno con dos parámetros, que llama a otro con tres, que llama a otro con cuatro… hasta el que los tiene todos. Y la llamada acaba así: `new TelescopingSession("Hyrox prep", LocalTime.of(18, 0), 60, 12, "Ana", true, false)`.

> [!problem]
> ¿Qué es `60` y qué es `12`? ¿Qué `true` es "principiantes" y cuál "lista de espera"? Si los intercambias, compila igual.
@describe: El coach envía la clase a SessionController, que llama a new TelescopingSession con siete argumentos, resaltado en rojo.

## @step:smell — La alternativa de los setters
La otra opción habitual es un objeto vacío que vas rellenando: `new MutableSession()` y después `setName(...)`, `setStartsAt(...)`, `setCoach(...)`…

Se lee mejor, pero el objeto **existe antes de estar terminado**. Entre una línea y otra no tiene hora, y si se te olvida una, nadie se entera. Además, `setCapacity(0)` lo acepta sin rechistar y cualquiera puede cambiarlo después.

> [!warning]
> Un objeto que puede estar a medias o en un estado imposible obliga a comprobarlo en cada sitio donde se usa.
@describe: SessionController llama a MutableSession y le va pasando setName, setCoach y el resto, resaltado en rojo.

## @step:builder — Un objeto que construye el objeto
Builder pone a alguien en medio: `ClassSession.Builder`.

- Lo creas con lo **imprescindible**: `ClassSession.builder("Hyrox prep", LocalTime.of(18, 0))`.
- El resto son métodos con nombre (`minutes()`, `capacity()`, `coach()`…) que guardan el valor y devuelven el propio builder para seguir encadenando.
- Los valores por defecto (60 minutos, 12 plazas) viven en el builder.
- `build()` entrega el `ClassSession` terminado, un record **inmutable**.

> [!key-idea]
> El producto no existe hasta `build()`. Mientras tanto, lo que está a medias es el builder, no la sesión.
@describe: Aparece ClassSession.Builder, resaltado, que con build() entrega un ClassSession.

## @step:fluent — La llamada se lee sola
Compara con el principio: `ClassSession.builder("Hyrox prep", LocalTime.of(18, 0))`, después `.coach("Ana")`, `.beginnerFriendly()` y, para terminar, `.build()`.

Cada opción dice lo que es, no hace falta escribir lo que va por defecto y el orden de las llamadas da igual. `beginnerFriendly()` no recibe un `true` que se pueda confundir con otro: llamarlo ya es la decisión.

> [!key-idea]
> Java no tiene argumentos con nombre. Un builder es la forma habitual de imitarlos.
@describe: El builder, con coach Ana y beginnerFriendly ya puestos, entrega el ClassSession con build(); los dos aparecen resaltados.

## @step:validate — Válido o no existe
¿Y si alguien pide `capacity(0)` o una clase para principiantes sin coach? `build()` llama al constructor del record, y ese constructor **comprueba todas las reglas en un único sitio**, en el momento de `build()`: duración de 15 a 120 minutos en tramos de 15, entre 1 y 30 plazas, coach obligatorio si es para principiantes.

Si algo falla, lanza una excepción con el motivo y no se crea nada. Como las reglas están en el constructor y no en el builder, tampoco se las salta quien haga `new ClassSession(...)` directamente.

> [!warning]
> Valida en `build()` (o en el constructor que llama), no en cada método del builder. Hay reglas que cruzan campos, como "principiantes necesita coach", y solo se pueden comprobar con todo el conjunto.
@describe: El builder intenta entregar un ClassSession con capacity 0 y ClassSession, resaltado, lo rechaza.

## @step:director — Recetas de la casa
El box repite siempre las mismas clases. `SessionTemplates` es el **director** del patrón: conoce las recetas y llama a los pasos del builder en orden.

- `"beginner"`: 75 minutos, 8 plazas, coach, apta para principiantes y con lista de espera.
- `"open-gym"`: 120 minutos, 20 plazas y sin coach.

En el GoF clásico, el director trabaja contra una **interfaz** de builder y puede usar varios builders concretos con la misma receta: uno que monta la clase y otro que genera, por ejemplo, el cartel para la pizarra. Allí es el cliente quien elige el builder concreto, se lo pasa al director y al final le pide el resultado al builder; aquí `SessionTemplates` crea el builder y devuelve la sesión, que es más sencillo. En Java lo más habitual es lo que ves aquí, un builder fluido dentro de la clase (el estilo de *Effective Java*), con o sin director.
@describe: SessionTemplates, resaltado, envía "beginner" al builder, que entrega el ClassSession con build().

## @step:request — Hyrox prep en la app
El coach envía `POST /api/sessions` con nombre, hora, coach y "para principiantes", pero sin duración ni plazas.

1. `SessionController` pasa la petición a `ScheduleService`.
2. El servicio crea el builder con lo imprescindible y solo llama a los métodos de los campos que vienen en la petición.
3. `build()` valida y el servicio guarda la clase con 60 minutos y 12 plazas, los valores por defecto.

> [!spring]
> Con campos opcionales en la petición, el builder encaja de forma natural: lo que no llega no se toca y se queda el valor por defecto, sin una cadena de `if` para decidir qué constructor llamar.
@describe: Hyrox prep · 18:00 viaja del coach al controlador, schedule() a ScheduleService y de ahí al builder, ambos resaltados, que entrega el ClassSession con build().

## @step:spring-does-it — Spring ya lo hace por ti
Spring está lleno de builders. El más útil en el día a día es `RestClient.Builder`: Spring Boot te lo **inyecta ya configurado** (conversores de mensajes, customizers) y con scope prototype, así que cada punto de inyección recibe uno nuevo. Le añades tu `baseUrl` y tus cabeceras, llamas a `build()` y tienes tu cliente.

Hay más en el propio ejemplo: el controlador monta la cabecera `Location` con `ServletUriComponentsBuilder` y responde con `ResponseEntity.created(location).body(...)`, que también es un builder. Y en los tests, el `MockHttpServletRequestBuilder` que devuelve `post(...)`.

> [!spring]
> Si usas Lombok, `@Builder` genera un builder parecido, aunque no igual: `builder()` no recibe los campos obligatorios, cada método recibe su valor (`beginnerFriendly(true)`) y los valores por defecto necesitan `@Builder.Default`. Escribirlo una vez a mano te enseña qué hace y dónde validar.
@describe: Dentro del contexto de Spring, RestClient.Builder, resaltado, recibe baseUrl y defaultHeader y entrega un RestClient con build().

## @step:recap — Resumen
Empezaste con siete argumentos seguidos y acabaste con:

- **Un builder** que se crea con lo imprescindible y guarda los valores por defecto.
- **Métodos con nombre** para cada opción, encadenables.
- **`build()`**, que entrega un objeto inmutable y validado.

Y cuándo no usarlo: si el objeto tiene tres o cuatro campos y casi todos son obligatorios, un record con su constructor (o un método estático con nombre) basta.
- **Un director** opcional para las recetas que se repiten.

> [!key-idea]
> Cuando un objeto tiene muchas opciones, deja que se construya paso a paso con nombres y que solo exista cuando está completo.
@describe: Vista final: el coach, el controlador, ScheduleService, SessionTemplates, el builder y el ClassSession, todo dentro del contexto de Spring.
