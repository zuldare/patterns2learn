---
title: Command
summary: En recepción, "apúntame", "bórrame" o "pásame a la de las siete" son acciones que a veces hay que deshacer. Convierte cada una en un objeto que se pueda ejecutar, deshacer y apuntar en un historial.
minutes: 11
level: intermediate
recap:
  intent: Mete una acción y sus datos en un objeto, para que quien la lanza no tenga que saber cómo se hace y se pueda guardar, encolar, registrar o deshacer.
  participants:
    - Command (Command), la interfaz con execute(), undo() y describe()
    - ConcreteCommand (BookCommand, CancelCommand, MoveCommand), cada acción con sus datos y su forma de deshacerse
    - Receiver (ClassRoster), quien sabe hacer el trabajo de verdad
    - Invoker (FrontDesk), que ejecuta los comandos, guarda el historial y deshace
    - Client (DeskController con DeskCommands), que crea cada comando con su receptor y sus datos
  pros:
    - Deshacer, registrar o encolar acciones sale casi gratis
    - Quien ejecuta no conoce ninguna acción concreta, así que añadir una no lo toca
    - Cada acción y su forma de deshacerse viven juntas, en una clase pequeña
  cons:
    - Una clase por acción, que puede ser mucho para cosas sencillas
    - Deshacer bien exige guardar lo necesario (el puesto, la clase de origen…) y es fácil olvidar algo
    - Si otros cambian el estado por fuera del historial, deshacer puede dejar de tener sentido
  related:
    - Memento
    - Strategy
    - Chain of Responsibility
quiz:
  - q: ¿Por qué CancelCommand guarda el puesto que tenía el atleta?
    options:
      - Para que el registro muestre en qué posición estaba apuntado
      - Para que undo() lo devuelva exactamente al mismo puesto de la lista
      - Porque ClassRoster no permite cancelar sin indicar una posición
      - Para que FrontDesk pueda ordenar el historial por posición
    answer: 1
    explain: Deshacer una cancelación no es solo volver a apuntar. Si Leo era el segundo, tiene que volver a ser el segundo. El comando guarda en execute() lo que undo() va a necesitar.
  - q: ¿Qué sabe FrontDesk de cada comando que ejecuta?
    options:
      - Qué método de ClassRoster tiene que llamar para cada tipo
      - Cómo se deshace una reserva y cómo se deshace una cancelación
      - En qué clase está apuntado cada atleta en ese momento
      - Solo que se puede ejecutar, deshacer y describir
    answer: 3
    explain: El invoker trabaja contra la interfaz Command. Por eso un comando nuevo, como "pasar a lista de espera", no cambia ni una línea de FrontDesk.
  - q: Un comando falla al ejecutarse porque la clase está llena. ¿Qué pasa con el historial?
    options:
      - No cambia, porque run() solo lo guarda si execute() termina bien
      - Se guarda igualmente, para poder deshacerlo más adelante
      - Se vacía entero, porque el estado ya no es fiable
      - Se guarda marcado como fallido y undo() se lo salta
    answer: 0
    explain: Si se guardara, el siguiente undo() intentaría deshacer algo que nunca pasó. Por eso run() llama primero a execute() y solo después lo apila.
  - q: ¿En qué se parece un Runnable que pasas a un TaskExecutor a un Command?
    options:
      - En que los dos guardan lo necesario para deshacerse con undo()
      - En que los dos se ejecutan en el mismo hilo que los ha creado
      - En que es una acción metida en un objeto que otro ejecuta cuando le toca
      - En que Spring guarda un historial con todos los que ya ha ejecutado
    answer: 2
    explain: Runnable no tiene undo(), pero es la misma idea básica. Quien lo crea no lo ejecuta; lo entrega, y el executor decide cuándo y en qué hilo.
---
## @step:problem — "Era Lea, no Leo"
En recepción se apunta, se borra y se cambia de clase a la gente todo el rato. Y a veces alguien se equivoca: apunta a Leo en la clase de las 18:00 cuando era Lea.

La primera versión, `FrontDeskService`, tiene un método por acción (`book`, `cancel`, `move`). Para poder deshacer, cada método **apunta a mano** qué acaba de hacer: `lastAction`, `lastSession`, `lastAthlete`, `lastSpot`… Y `undoLast()` hace un `switch` sobre `lastAction` para saber cómo revertirlo.

> [!problem]
> Cómo deshacer cada acción vive lejos de la acción, en un `switch` que hay que mantener a la par.
@describe: Recepción pide deshacer a DeskController, que llama a undoLast() en FrontDeskService, resaltado en rojo; este cancela a Leo en ClassRoster.

## @step:smell — Solo una vez, y no todo
Mira los límites de `undoLast()`:

- Solo recuerda **la última** acción. Si te equivocas dos veces seguidas, la primera ya no se puede deshacer.
- Para cambiar de clase haría falta guardar también la clase de origen: otro campo más. Mientras tanto, `move` cae en el `default` y no se puede deshacer.
- Y si mañana se puede pasar a alguien a la lista de espera, toca añadir otro caso al `switch`.

> [!warning]
> Cuando para deshacer necesitas recordar "qué fue lo último y con qué datos", lo que quieres guardar es la acción entera.
@describe: El diagrama no cambia: FrontDeskService sigue resaltado en rojo y undoLast() falla con una acción que no sabe deshacer.

## @step:command — Cada acción, un objeto
Command convierte cada acción en un **objeto** con tres métodos:

- `execute()`, hacerla;
- `undo()`, deshacerla;
- `describe()`, contarla en una línea para el registro.

Un objeto se puede guardar en una lista, pasar a otro, ejecutar más tarde o deshacer. Un método no.

> [!key-idea]
> Lo que antes era una llamada ahora es una cosa: se puede guardar, contar y deshacer.
@describe: Aparece la interfaz Command, resaltada, con tres comandos que la implementan: BookCommand, CancelCommand y MoveCommand.

## @step:concrete — Cada comando sabe deshacerse
`BookCommand` guarda sus datos (clase y atleta) y sabe hacer y deshacer:

- `execute()` apunta al atleta en `ClassRoster`;
- `undo()` lo borra;
- `describe()` dice "book Leo into 18:00 WOD".

`ClassRoster` es el **receptor**: sabe apuntar y borrar, pero no sabe nada de historiales ni de deshacer.
@describe: BookCommand, resaltado, llama a book() o cancel() en ClassRoster.

## @step:memory — Lo que hace falta para volver atrás
Deshacer una cancelación no es solo volver a apuntar. Si Leo era el segundo de la lista, debe volver a ser el segundo. Por eso `CancelCommand` **guarda el puesto** cuando se ejecuta, y `undo()` lo usa para devolverlo al mismo sitio.

`MoveCommand` hace lo mismo con dos clases: apunta en la nueva, borra de la vieja guardando el puesto, y al deshacer lo invierte.

> [!warning]
> Un comando que se puede deshacer tiene que guardar en `execute()` todo lo que `undo()` va a necesitar. Si falta algo, lo descubrirás al deshacer.
@describe: CancelCommand, resaltado, borra a Leo en ClassRoster y se queda con su puesto, el 2.

## @step:invoker — Quien ejecuta no sabe qué ejecuta
`FrontDesk` es el **invoker**:

- `run(comando)` lo ejecuta y, si sale bien, lo apila en el historial y lo apunta en el registro;
- `undo()` saca el último del historial y le pide que se deshaga.

No sabe si el comando reserva, cancela o mueve. Por eso puede deshacer cualquier número de pasos hacia atrás, y un comando nuevo no le cambia ni una línea. El historial guarda los 50 últimos.

> [!key-idea]
> Si un comando falla al ejecutarse, nunca llega al historial. Así `undo()` no intenta deshacer algo que no pasó.
@describe: FrontDesk, resaltado junto al historial, envía execute() al comando y push() al historial.

## @step:client — El controlador solo crea comandos
En Spring, `DeskController` es el **cliente**: con `DeskCommands` crea el comando adecuado, ya validado y unido a `ClassRoster`, y se lo pasa a `FrontDesk`.

`POST /api/desk/bookings` crea un `BookCommand`; `DELETE`, un `CancelCommand`; `/moves`, un `MoveCommand`. Y `POST /api/desk/undo` no crea nada: le pide a la recepción que deshaga lo último.
@describe: Aparece el contexto de Spring. DeskController, resaltado, envía run(commands.book(…)) a FrontDesk, que trabaja con los comandos, el historial y ClassRoster.

## @step:request — Leo fuera, Lea dentro
1. `POST /api/desk/bookings` con Leo en la clase 1: 201 y "done: book Leo into 18:00 WOD" en el registro.
2. `POST /api/desk/undo`: `FrontDesk` saca el `BookCommand` del historial y lo deshace; `ClassRoster` borra a Leo.
3. La respuesta dice qué se deshizo: "book Leo into 18:00 WOD".

Si no queda nada que deshacer, la respuesta es 409 "nothing to undo".
@describe: POST /api/desk/undo viaja de Recepción al controlador, undo() a FrontDesk, que hace pop() del historial; BookCommand, resaltado con FrontDesk, cancela a Leo en ClassRoster.

## @step:spring-does-it — Spring ya lo hace por ti
`Runnable` es la versión mínima de un comando: una acción metida en un objeto, sin `undo()`. Spring Boot configura un `TaskExecutor`, y cuando le pasas un `Runnable` decide él cuándo y en qué hilo ejecutarlo. Quien lo creó ya no tiene nada que ver con su ejecución.

Spring usa esa idea en muchos sitios: `@Async` envuelve la llamada a tu método en una tarea para ese mismo executor, `TransactionTemplate.execute(...)` recibe tu código como un callback para ejecutarlo dentro de una transacción, y `JdbcTemplate` recibe callbacks parecidos.

> [!spring]
> Cuando una API de Spring te pide un `Runnable`, un `Callable` o un callback, te está pidiendo un comando: "dime qué hay que hacer y ya lo ejecuto yo cuando toque".
@describe: Dentro del contexto de Spring, TaskExecutor, resaltado, ejecuta con run() el Runnable reminder, también resaltado, que apunta a Eva en ClassRoster desde otro hilo.

## @step:recap — Resumen
Empezaste con un `switch` que recordaba solo la última acción y acabaste con:

- **Comandos**, cada acción en un objeto que sabe hacerse, deshacerse y describirse.
- **Un receptor**, `ClassRoster`, que hace el trabajo y no sabe de historiales.
- **Un invoker**, `FrontDesk`, con historial, registro y deshacer de varios pasos.
- **Un cliente**, el controlador, que solo crea comandos.

No lo confundas con sus vecinos: **Strategy** también mete comportamiento en un objeto, pero es *cómo* hacer algo y se intercambia; un **Command** es *qué* hacer, con sus datos, para ejecutarlo ahora, luego o al revés. **Memento** deshace de otra manera: guarda una foto del estado en lugar de la operación contraria.

Y cuándo no hace falta: si nunca vas a deshacer, encolar ni registrar las acciones, una llamada a un método es más sencilla; y si solo necesitas pasar una acción a otro, una lambda (`Runnable`) suele bastar.

> [!key-idea]
> Cuando una acción necesita vivir más que la llamada (para deshacerla, repetirla o ejecutarla después), conviértela en un objeto.
@describe: Vista final: Recepción, el controlador, FrontDesk con su historial, los tres comandos y ClassRoster, todo dentro del contexto de Spring.
