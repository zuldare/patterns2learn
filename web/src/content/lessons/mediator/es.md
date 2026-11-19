---
title: Mediator
summary: Durante la clase, el cronómetro, la línea de meta, la música y la pantalla tienen que ir a la par. Haz que se avisen a través de una sola pieza que decide qué hace cada uno, en lugar de que todos se conozcan entre sí.
minutes: 10
level: intermediate
recap:
  intent: Pon a un intermediario en medio de un grupo de objetos que necesitan coordinarse, para que cada uno solo hable con él y las reglas de cómo colaboran vivan en un solo sitio.
  participants:
    - Mediator (FloorMediator), la interfaz con lo que los aparatos pueden avisar
    - ConcreteMediator (ClassFloor), que conoce a todos y decide qué hace cada uno
    - Colleagues (WodTimer y FinishLine le avisan; Music y Screen reciben sus órdenes), que no se conocen entre sí. En el GoF un colega suele hacer las dos cosas; aquí cada aparato hace solo una
  pros:
    - Ningún aparato conoce a los demás, así que se pueden cambiar o probar por separado
    - Las reglas de la clase (cuándo suena la música, qué muestra la pantalla) están juntas
    - Añadir un aparato nuevo toca el mediador, no a todos los demás
  cons:
    - El mediador puede crecer hasta saberlo todo de todos
    - Seguir qué pasa al pulsar un botón obliga a pasar siempre por él
    - Si la coordinación es mínima, es una clase más sin mucho que hacer
  related:
    - Observer
    - Facade
    - Command
quiz:
  - q: ¿Qué sabe WodTimer de la música y de la pantalla?
    options:
      - Cómo subir el volumen y qué tiene que mostrar al empezar
      - Nada, solo avisa a ClassFloor de que ha empezado o de que llegó el límite
      - Que existen, porque las recibe en su constructor
      - Lo mismo que FinishLine, porque comparten una clase base
    answer: 1
    explain: WodTimer solo conoce la interfaz FloorMediator. Qué pasa con la música y la pantalla al empezar lo decide ClassFloor.
  - q: El box añade unas luces que se ponen rojas al llegar el límite. ¿Qué cambias?
    options:
      - WodTimer, para que encienda las luces cuando llegue el límite
      - FinishLine y WodTimer, porque los dos tienen que avisar a las luces
      - Screen, para que avise a las luces cuando muestre los resultados
      - Un aparato Lights que ClassFloor enciende desde capReached()
    answer: 3
    explain: El cronómetro sigue avisando igual. Es el mediador el que decide que, al llegar el límite, además de parar la música y mostrar resultados, se encienden las luces.
  - q: ¿En qué se diferencia Mediator de Observer?
    options:
      - En Mediator un objeto decide por todos; en Observer cada uno reacciona solo
      - En Observer un sujeto avisa a muchos; en Mediator muchos avisan a uno
      - En Mediator los colegas conocen la interfaz de los demás; en Observer no
      - Observer reparte eventos por tipo; Mediator los reparte por orden de llegada
    answer: 0
    explain: Con Observer, quien avisa no sabe quién escucha ni qué hará. Con Mediator hay una pieza que tiene la lógica de coordinación y da órdenes concretas a cada uno.
  - q: ¿Qué papel cumple el DispatcherServlet en Spring MVC?
    options:
      - Es el punto de entrada y además pinta él mismo las vistas
      - Decide el código de estado HTTP de cada respuesta
      - Coordina piezas como HandlerMapping o HandlerAdapter, que no se conocen
      - Busca el controlador y lo llama directamente por reflexión
    answer: 2
    explain: El HandlerMapping no sabe nada del HandlerAdapter ni de los que resuelven excepciones. El DispatcherServlet los consulta en orden y pasa el resultado de uno al siguiente.
---
## @step:problem — Aparatos que se conocen
En la clase hay cuatro aparatos: el **cronómetro**, la **línea de meta** donde cada atleta marca su tiempo, la **música** y la **pantalla**. Tienen que ir a la par: al empezar sube la música y la pantalla pone el reloj; cuando alguien termina, sale su tiempo y suena la campana; al llegar al límite, la música para y salen los resultados.

En la primera versión, cada aparato llama a los otros. `WiredFinishLine`, al registrar un tiempo, pregunta al cronómetro si está en marcha, escribe en la pantalla y le pide la campana a la música.

> [!problem]
> Cada aparato conoce a los demás y sabe qué deben hacer. Las reglas de la clase están repartidas entre todos.
@describe: WiredFinishLine, resaltado en rojo, pregunta isRunning() a WiredTimer, llama a showFinish() en la pantalla y a cue("bell") en la música.

## @step:smell — Una red de dependencias
Y el cronómetro, al llegar el límite, le pide los resultados a la línea de meta para pasárselos a la pantalla: los dos se conocen mutuamente. Entre los cuatro aparatos ya hay seis llamadas directas, y cada aparato nuevo (unas luces, un marcador por equipos) añade más con los que tenga que coordinarse.

Para probar la línea de meta necesitas un cronómetro, un equipo de música y una pantalla. Y para cambiar qué pasa al terminar, hay que buscar en qué aparato está escrito.

> [!warning]
> Cuando cada pieza necesita a casi todas las demás, cualquier cambio se reparte por todas.
@describe: WiredTimer y WiredFinishLine, resaltados en rojo, se llaman entre sí y cada uno llama además a la música y a la pantalla.

## @step:mediator — Uno en medio
Mediator pone una pieza en medio: `FloorMediator`. Los aparatos solo le **avisan** de lo que ha pasado:

- `timerStarted()`, el cronómetro ha empezado;
- `athleteFinished(...)`, alguien ha cruzado la meta;
- `capReached()`, se acabó el tiempo.

Qué tiene que hacer cada uno después lo decide el mediador.

> [!key-idea]
> Los aparatos cuentan qué ha pasado; el mediador decide qué se hace.
@describe: Aparece ClassFloor, resaltado, en medio de los cuatro aparatos.

## @step:colleagues — Los aparatos solo avisan
`WodTimer` ya no conoce la música ni la pantalla. `start()` hace una sola cosa: avisar al mediador. `FinishLine` igual: valida el tiempo y avisa con `athleteFinished(...)`.

`Music` y `Screen` hacen lo que se les dice (sonar, mostrar) y no saben que existe un cronómetro. El cronómetro y la meta se prueban con un mediador de mentira (lo hace `DevicesTest`), y la música y la pantalla, sin ningún mediador.
@describe: WodTimer y FinishLine, resaltados, avisan a ClassFloor con timerStarted() y athleteFinished().

## @step:floor — Las reglas, juntas
`ClassFloor` es el mediador concreto. En un solo sitio están todas las reglas de la clase:

- al empezar: música a 8 y reloj en pantalla;
- al terminar alguien: comprueba que el WOD está en marcha y que esa persona no había terminado ya, muestra su tiempo y suena la campana;
- al llegar el límite: para la música y muestra los resultados ordenados.

Si mañana cambia una regla, sabes dónde está.
@describe: ClassFloor, resaltado, manda a la música play, cue o stop, y a la pantalla el reloj, cada tiempo o los resultados.

## @step:flow — Una clase completa
El test hace una clase entera: empieza el cronómetro, Ana termina en 3:05, Leo en 2:52 y llega el límite. Al final, la música ha sonado, ha tocado dos campanas y ha parado, y la pantalla muestra "1. Leo 2:52" y "2. Ana 3:05".

Ni el cronómetro ni la línea de meta saben nada de eso. Solo han avisado.
@describe: FinishLine avisa de Ana 185 s a ClassFloor, resaltado junto a la pantalla; ClassFloor muestra Ana 3:05 en la pantalla y pide la campana a la música.

## @step:request — Desde la tablet del coach
Cada botón de la tablet habla con un aparato: `POST /api/floor/start` con el cronómetro, `POST /api/floor/finish` con la línea de meta y `POST /api/floor/cap` otra vez con el cronómetro. `GET /api/floor/screen` lee la pantalla.

En Spring, `ClassFloor` es un bean que recibe la música y la pantalla, y el cronómetro y la meta reciben `FloorMediator`. Los avisos van en un solo sentido, hacia el mediador, así que no hay dependencias circulares. Si un aparato tuviera que avisar y también recibir órdenes, habría que romper el ciclo, por ejemplo registrándolo en el mediador después de crearlo.

Si alguien registra un tiempo antes de empezar, la respuesta es 409 con el motivo que da el mediador.
@describe: POST /api/floor/finish viaja del coach al controlador, finish("Ana", 185) a FinishLine, athleteFinished() a ClassFloor, resaltado, y Ana 3:05 a la pantalla.

## @step:spring-does-it — Spring ya lo hace por ti
Hacia fuera, el `DispatcherServlet` es un *front controller*: la única puerta de entrada de las peticiones. Hacia dentro, hace de mediador entre las piezas de Spring MVC, que no se conocen entre sí:

- un `HandlerMapping` dice qué handler atiende la URL;
- un `HandlerAdapter` sabe cómo llamarlo;
- si falla, un `HandlerExceptionResolver` decide la respuesta (aquí, `ExceptionHandlerExceptionResolver`, que llama a nuestro `@RestControllerAdvice`).

El `DispatcherServlet` los consulta en orden y pasa el resultado de uno al siguiente. El test comprueba cada paso: qué handler se eligió, qué método se llamó, qué excepción recibió el resolver y la respuesta final, un 400.

> [!spring]
> Por eso puedes añadir un `HandlerMapping` o un resolver de excepciones propio sin tocar los demás: solo el `DispatcherServlet` sabe cómo encajan.
@describe: Dentro del contexto de Spring, DispatcherServlet, resaltado, pregunta al HandlerMapping qué handler toca, pide al HandlerAdapter que llame a finish() y, al fallar, el HandlerExceptionResolver responde 400.

## @step:recap — Resumen
Empezaste con aparatos que se llamaban entre sí y acabaste con:

- **Un mediador**, `ClassFloor`, con todas las reglas de la clase.
- **Aparatos que solo avisan** (cronómetro, meta) o solo obedecen (música, pantalla).
- **Ninguna dependencia entre aparatos**: cada uno se prueba por separado.

No lo confundas con sus vecinos: con **Observer**, quien avisa no sabe quién escucha ni qué hará, y no hay nadie que coordine; aquí el mediador tiene esa lógica. Una **Facade** simplifica el acceso a varias piezas desde fuera, pero esas piezas no la usan para hablar entre ellas.

Y cuándo no hace falta: si solo hay dos piezas que se hablan, que se conozcan es más sencillo; si los aparatos solo anuncian "ha pasado algo" y no hay reglas que crucen unos con otros, bastan Observer o los eventos de Spring; y vigila que el mediador no acabe sabiendo hacer el trabajo de todos.

> [!key-idea]
> Cuando varias piezas tienen que coordinarse, que hablen con una sola que conozca las reglas, no entre ellas.
@describe: Vista final: el coach, el controlador, el cronómetro, la meta, ClassFloor, la música y la pantalla, todo dentro del contexto de Spring.
