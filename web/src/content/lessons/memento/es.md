---
title: Memento
summary: La coach prepara el WOD de la pizarra y a veces borra lo que no debía. Guarda instantáneas del borrador sin abrir sus campos a nadie, y deshaz volviendo a la última.
minutes: 9
level: intermediate
recap:
  intent: Guarda el estado de un objeto en una instantánea cerrada para poder volver a él más tarde, sin que quien la guarda tenga que conocer ni tocar los detalles internos.
  participants:
    - Originator (WhiteboardDraft), crea la instantánea y sabe restaurarse desde ella
    - Memento (WhiteboardDraft.Snapshot), la copia congelada; solo el originador lee lo que hay dentro
    - Caretaker (DraftHistory), guarda instantáneas y las devuelve sin mirar dentro
  pros:
    - El borrador sigue con sus campos privados; nadie más necesita getters ni setters
    - Un campo nuevo entra en la instantánea en un solo sitio, sin tocar el historial
    - Deshacer cualquier cambio, incluso los que no tienen operación inversa (borrar la pizarra)
  cons:
    - Cada instantánea es una copia; con estados grandes o muchos pasos, cuesta memoria
    - Hay que acotar el historial y decidir cuándo guardar
    - Si el objeto apunta a otros objetos mutables, la copia tiene que ser profunda o compartir solo cosas inmutables
  related:
    - Command
    - Prototype
    - Iterator
quiz:
  - q: ¿Quién puede leer los campos de una Snapshot?
    options:
      - Solo WhiteboardDraft
      - DraftHistory, para elegir cuál devolver
      - Cualquier clase del mismo paquete
      - El controlador, para enseñarla en la API
    answer: 0
    explain: Los campos y el constructor de Snapshot son privados, y Java deja que la clase que la contiene (WhiteboardDraft) los lea. El historial solo la guarda y la devuelve.
  - q: Añades un campo "escalado" al borrador. ¿Qué tienes que tocar para que deshacer lo recupere?
    options:
      - DraftHistory, para que también guarde el escalado
      - El controlador, para que copie el escalado antes de editar
      - Snapshot, snapshot() y restore(), dentro de WhiteboardDraft
      - Nada; Java copia los campos nuevos por su cuenta
    answer: 2
    explain: La instantánea es cosa del originador. En la versión anterior era el editor el que tenía que acordarse de cada campo, y se olvidó del tiempo límite.
  - q: ¿Por qué DraftService hace la instantánea antes de editar pero la guarda después?
    options:
      - Porque el historial no admite instantáneas antes de la edición
      - Para que una edición rechazada no deje un paso que no deshace nada
      - Porque snapshot() solo funciona sobre un borrador ya validado
      - Para que la instantánea incluya ya los cambios de la edición
    answer: 1
    explain: Si edit() lanza una InvalidDraftException, no se llega a save() y el historial no cambia. Deshacer después no "deshace" algo que nunca pasó.
  - q: ¿En qué se parece un savepoint de una transacción a un Memento?
    options:
      - En que guarda una copia de la conexión de la transacción
      - En que permite leer las filas que había en ese momento
      - En que copia la tabla entera a memoria antes de cambiarla
      - En que es una marca opaca que solo sirve para volver a ella
    answer: 3
    explain: createSavepoint() devuelve algo tipado como Object, así que tu código no está pensado para mirar dentro; solo se lo devuelves a rollbackToSavepoint(). Quien sabe qué significa es la base de datos.
---
## @step:problem — Deshacer desde fuera
La coach prepara el WOD del día en un borrador: título, movimientos y tiempo límite. Si se equivoca y borra la pizarra, quiere deshacer.

La primera versión abre todos los campos del borrador con getters y setters, y es `ExposedDraftEditor` quien, antes de borrar, copia en sus propias variables lo que cree que hace falta.

> [!problem]
> Para guardar el estado desde fuera, el borrador tiene que enseñar sus tripas, y quien guarda tiene que conocerlas todas.
@describe: ExposedDraftEditor lee getTitle() y getMovements() de ExposedDraft, que expone todos sus campos; los dos aparecen resaltados.

## @step:smell — El campo que nadie copió
El editor copió el título y los movimientos… pero no el tiempo límite. Borrar deja la pizarra en blanco con el tiempo por defecto, 20 minutos, y al deshacer vuelven "Fran" y sus movimientos… con 20 minutos en lugar de 10. El test `ExposedDraftEditorTest` lo demuestra.

Y cada campo nuevo del borrador es otro sitio donde acordarse, fuera de la clase que lo tiene.

> [!warning]
> Cuando el estado de un objeto lo copian otros, cada campo nuevo es una ocasión de olvidar uno.
@describe: ExposedDraftEditor, resaltado: guarda el título y los movimientos, pero el tiempo límite se queda sin copiar.

## @step:memento — La instantánea, cerrada
Con Memento, quien copia el estado es el propio borrador. `snapshot()` crea una `Snapshot` con todos los campos, y `restore()` los vuelve a poner.

`Snapshot` es una clase anidada con los campos y el constructor **privados**: nadie fuera de `WhiteboardDraft` puede crearla ni leerla. La lista se copia con `List.copyOf`, así que la instantánea no cambia aunque el borrador siga cambiando.

(Un matiz: en Java la privacidad es por clase, no por objeto, así que cualquier `WhiteboardDraft` podría leer la instantánea de otro. Aquí solo hay un borrador; si hubiera varios, la instantánea podría guardar quién la creó y comprobarlo.)

> [!key-idea]
> El objeto se guarda a sí mismo en una caja cerrada. Los demás pueden llevar la caja de un lado a otro, pero no abrirla.
@describe: WhiteboardDraft y una Snapshot, resaltados: el borrador llama a snapshot() y obtiene su copia congelada.

## @step:caretaker — El historial no mira dentro
`DraftHistory` es el **cuidador**: guarda instantáneas en una pila y devuelve la última al deshacer. Nunca mira lo que hay dentro, y no podría.

Tiene un tamaño máximo (20 por defecto): cuando se llena, la más antigua se cae. Sin historial, deshacer responde "nothing to undo". Aquí no hay rehacer: para eso haría falta una segunda pila con las instantáneas deshechas.
@describe: DraftHistory, resaltado, apila instantáneas con push() y devuelve la última con pop().

## @step:service — Cuándo se guarda
`DraftService` junta las dos piezas. Para editar, primero hace la instantánea, luego edita y solo entonces la guarda: si la edición no es válida, el historial no cambia.

Para deshacer, pide la última instantánea al historial y se la devuelve al borrador con `restore()`. El servicio va `synchronized` porque el borrador y el historial son estado compartido entre peticiones. (Una edición que no cambia nada también guarda un paso; se podría evitar comparando antes, pero aquí lo dejamos simple.)
@describe: DraftService, resaltado, llama a snapshot() y edit() en el borrador y a save() en el historial.

## @step:undo — Vuelve todo, también lo olvidado
El test hace lo mismo que la versión anterior: guarda, borra la pizarra y deshace. Esta vez vuelven el título, los movimientos **y** el tiempo límite de 10 minutos. `snapshot()` también podría olvidarse de un campo, claro; lo que cambia es que ahora el olvido estaría junto a los campos, en la misma clase, y no repartido por fuera.

Si mañana el borrador tiene un campo nuevo, se añade a `Snapshot`, `snapshot()` y `restore()`, los tres dentro de la misma clase. El historial no se entera.
@describe: WhiteboardDraft y la Snapshot, resaltados: restore() devuelve el borrador al estado guardado.

## @step:request — Deshacer por HTTP
`DELETE /api/draft` borra la pizarra, que queda en blanco con 20 minutos (y antes guarda la instantánea). `POST /api/draft/undo` la recupera: vuelve "Fran" con sus 10 minutos.

Una edición con un tiempo límite de 0 responde 400 y no guarda nada; deshacer sin historial responde 409 "nothing to undo".
@describe: POST /api/draft/undo viaja de la coach al controlador, luego undo() al servicio, que pide la instantánea al historial y la restaura en el borrador; DraftService y DraftHistory aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
Dentro de una transacción, `TransactionStatus.createSavepoint()` crea un **savepoint**: una marca de lo que tu transacción llevaba hecho hasta ese momento (no deshace lo que confirmen otras). Te lo devuelve tipado como `Object`, así que tu código no está pensado para mirar dentro; solo se lo devuelves a `rollbackToSavepoint()`.

En el test, Ana registra 70 kg, se crea el savepoint, alguien escribe 700 por error y se vuelve al savepoint: queda una sola fila, y la transacción sigue viva. Con un gestor de transacciones JDBC, es lo que usa por debajo `Propagation.NESTED`.

> [!spring]
> El savepoint es un memento: el cuidador (tu código) lo guarda y lo devuelve, y solo el originador (la base de datos, a través del gestor de transacciones) sabe qué significa.
@describe: TransactionStatus, resaltado, crea un savepoint, también resaltado, y luego vuelve a él tras una inserción equivocada en la tabla pr.

## @step:recap — Resumen
Empezaste con un editor que copiaba campos desde fuera y acabaste con:

- **Un originador**, `WhiteboardDraft`, que hace y restaura sus propias instantáneas.
- **Un memento**, `Snapshot`, cerrado: nadie más lo lee.
- **Un cuidador**, `DraftHistory`, que guarda y devuelve sin mirar.

Sus vecinos: un **Command** deshace con una operación inversa (devolver la plaza que reservaste); Memento sirve cuando esa inversa no existe o es complicada, y a menudo un comando guarda un memento para poder deshacerse. **Prototype** también copia un objeto, pero para crear otro, no para volver atrás. Y un **Iterator** puede usar un memento para recordar por dónde iba.

Cuándo no usarlo: si el estado es enorme y cambia poco, guardar solo los cambios (o la operación inversa) sale más barato que copiarlo entero. Y si el objeto ya es inmutable, no hace falta Memento: guardar la referencia es guardar la instantánea.

> [!key-idea]
> Que cada objeto se guarde a sí mismo. Los demás solo llevan la caja.
@describe: Vista final: la coach, el controlador, DraftService, el borrador y el historial con sus dos instantáneas, todo dentro del contexto de Spring.
