---
title: Prototype
summary: El coach no programa cada semana desde cero, sino que copia una plantilla y cambia un día. Haz que cada objeto sepa copiarse entero, para que editar la copia nunca toque el original.
minutes: 9
level: beginner
recap:
  intent: Crea objetos nuevos copiando uno que ya existe y sirve de modelo, y deja que sea el propio objeto quien sepa copiarse.
  participants:
    - Prototype (WeekProgram, DayPlan), que declaran copy() y saben copiarse
    - Prototype registry (ProgramLibrary), que guarda las plantillas con nombre y solo entrega copias
    - Client (WeekService), que pide una copia y la personaliza
  pros:
    - Crear una semana parecida a otra es copiar y cambiar lo que difiere
    - Cada clase sabe copiarse; nadie de fuera necesita conocer sus campos
    - Las plantillas no se estropean, porque solo salen copias
  cons:
    - Copiar en profundidad exige que cada pieza mutable sepa copiarse, y es fácil dejarse una
    - Con referencias cruzadas o ciclos, copiar bien se complica
    - El clone() de Java es superficial y torpe; casi siempre conviene un copy() propio
  related:
    - Abstract Factory
    - Memento
    - Composite
quiz:
  - q: Con ShallowCopyService, ¿por qué al editar el miércoles de Week 47 cambiaba también la semana anterior?
    options:
      - Porque WeekProgram guardaba los días en un campo estático
      - Porque Spring inyectaba la misma semana en los dos sitios
      - Porque la lista era nueva, pero los días de dentro eran los mismos objetos
      - Porque rename() modificaba también la semana original
    answer: 2
    explain: new ArrayList<>(lastWeek.days()) copia la lista, no los DayPlan que contiene. Las dos semanas apuntaban al mismo miércoles.
  - q: ¿Quién sabe cómo se copia un DayPlan?
    options:
      - El propio DayPlan, con su método copy()
      - ProgramLibrary, que conoce los campos de cada día
      - El controlador, que recibe el JSON con los movimientos
      - WeekService, que es quien guarda las semanas
    answer: 0
    explain: Cada clase se copia a sí misma. WeekProgram.copy() pide a cada día su copia, así que si DayPlan gana un campo, solo cambia DayPlan.
  - q: ¿Qué hace el scope prototype de Spring cada vez que pides el bean?
    options:
      - Clona la última instancia que entregó
      - Devuelve siempre la misma instancia, como un singleton
      - Copia el objeto original con Object.clone()
      - Crea un objeto nuevo a partir de la definición del bean
    answer: 3
    explain: A pesar del nombre, no copia ningún objeto. Construye uno nuevo cada vez, con su constructor y sus dependencias, a partir de la definición.
  - q: Si WeekProgram y DayPlan fueran inmutables, ¿qué pasaría con copy()?
    options:
      - Habría que hacerla todavía más profunda
      - Dejaría de hacer falta, porque compartir lo que no cambia es seguro
      - Habría que implementar Cloneable obligatoriamente
      - Habría que declarar las dos clases con scope prototype
    answer: 1
    explain: El problema de la copia superficial es que alguien cambia algo compartido. Si nada se puede cambiar, compartir es gratis y seguro; "cambiar" sería crear un objeto nuevo.
---
## @step:problem — Copiar la semana pasada
Cada semana, el coach parte de una plantilla ("Strength block") o de la semana anterior y cambia algún día. La primera versión, `ShallowCopyService`, copia la semana desde fuera: crea una semana nueva con una **lista nueva de días**.

Pero los días de esa lista son **los mismos objetos**. Cuando el coach cambia el miércoles de Week 47 por sentadilla frontal, el miércoles de la semana anterior también cambia. El test `ShallowCopyServiceTest` lo demuestra.

> [!problem]
> Una copia superficial crea un contenedor nuevo con las mismas piezas dentro. Editar una pieza afecta a las dos copias.
@describe: ShallowCopyService, resaltado en rojo, crea Week 47 con una lista nueva pero los mismos días; al editar el miércoles desde Week 47 se edita el de la plantilla, también resaltado.

## @step:smell — Copiar desde fuera
Además, quien copia tiene que saber cómo es la semana por dentro: qué campos tiene y cuáles hay que copiar en profundidad. Si mañana `DayPlan` gana un campo mutable (las notas del coach, por ejemplo), hay que acordarse de tocar cada sitio que copie semanas.

> [!warning]
> Si para copiar un objeto hay que conocer sus tripas, la copia debería ser trabajo del propio objeto.
@describe: El diagrama no cambia: ShallowCopyService sigue resaltado en rojo, copiando desde fuera.

## @step:prototype — Cada objeto sabe copiarse
Prototype mete la copia dentro del objeto: `WeekProgram.copy()` crea una semana nueva y, para cada día, le pide **su** copia.

Quien necesite una semana parecida a otra solo hace `plantilla.copy()` y cambia lo que haga falta. No sabe qué campos tiene una semana ni qué hay que copiar en profundidad.

> [!key-idea]
> El objeto que sirve de modelo es el que sabe hacer copias de sí mismo.
@describe: La plantilla Strength block y Week 47, resaltadas: copy() crea la semana nueva a partir de la plantilla.

## @step:day-copy — La copia baja hasta el fondo
`DayPlan.copy()` crea un día nuevo con **su propia lista** de movimientos (el constructor la copia). Así la copia es profunda en todos los niveles: semana nueva, días nuevos, listas nuevas.

En Java existe `Object.clone()`, pero es superficial por defecto, obliga a implementar `Cloneable` y tiene reglas raras. Un método `copy()` (o un constructor de copia) es más claro.
@describe: El miércoles de Week 47, resaltado, tiene su propia lista de movimientos.

## @step:registry — Plantillas con nombre
`ProgramLibrary` guarda los **prototipos** con nombre: "strength-block" y "deload-week". Para crear una semana, copia la plantilla y le cambia el nombre: `prototype(template).copy().rename(name)`.

Las plantillas nunca salen de la biblioteca: incluso para enseñar una, entrega una copia. Así nadie puede estropearlas por accidente.
@describe: ProgramLibrary, resaltada, busca "strength-block" y crea Week 47 con copy().rename("Week 47").

## @step:deep — Editar la copia, sin miedo
El test hace lo que antes fallaba: crea Week 47 a partir de "strength-block", cambia su miércoles y comprueba que la plantilla sigue con la sentadilla trasera y Helen. Otros tests comprueban que cambiar una copia de la plantilla tampoco toca la original.
@describe: El miércoles de la plantilla y el de Week 47, resaltados, ya son objetos distintos: editar uno no cambia el otro.

## @step:request — Por la API
1. `POST /api/weeks` con `template: "strength-block"` y `name: "Week 47"`: 201 y la semana nueva.
2. `PUT /api/weeks/{id}/days/Wed` con los movimientos nuevos.
3. `GET /api/templates/strength-block`: la plantilla sigue igual.

Plantillas o semanas que no existen dan 404; un nombre vacío o un día sin movimientos, 400.
@describe: POST /api/weeks viaja del coach al controlador, create() a WeekService y newWeek() a ProgramLibrary, que copia la plantilla en Week 47; WeekService y Week 47 aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
Ojo con el nombre: el scope **`prototype`** de Spring no copia ningún objeto. Cada vez que pides el bean, crea uno **nuevo** a partir de su definición, con su constructor y sus dependencias.

Donde Spring sí usa la idea de Prototype es en las propias **definiciones de beans**: `cloneBeanDefinition()` devuelve una copia de una definición que puedes cambiar (por ejemplo, su scope) sin tocar la original. Y al combinar una definición hija con la de su padre, Spring parte de una copia de la del padre y le aplica los cambios de la hija.

> [!spring]
> El test del ejemplo hace las dos cosas: clona una definición y cambia su scope dejando la original intacta, y comprueba que un bean `prototype` se construye de nuevo cada vez en lugar de copiarse.
@describe: Dentro del contexto de Spring, una BeanDefinition singleton se clona con cloneBeanDefinition() en una copia con scope prototype, resaltada.

## @step:recap — Resumen
Empezaste con una copia superficial que compartía los días y acabaste con:

- **Objetos que saben copiarse**, `WeekProgram` y `DayPlan`, en profundidad.
- **Un registro de prototipos**, `ProgramLibrary`, que solo entrega copias.
- **Un cliente** que copia y personaliza sin conocer las tripas de una semana.

No lo confundas con sus vecinos: **Abstract Factory** crea familias de objetos con clases; Prototype crea objetos copiando un modelo, y a veces una fábrica guarda prototipos y los copia. **Memento** también copia estado, pero para poder volver atrás, no para crear objetos nuevos.

Y cuándo no hace falta: si los objetos son inmutables, compartirlos es seguro y no hay nada que copiar; y si construir uno desde cero es igual de fácil, un constructor o un builder bastan.

> [!key-idea]
> Cuando crear un objeto parecido a otro sea más fácil copiando que construyendo, deja que el original sepa copiarse, entero.
@describe: Vista final: el coach, el controlador, WeekService, ProgramLibrary, la plantilla y Week 47 con sus miércoles, todo dentro del contexto de Spring.
