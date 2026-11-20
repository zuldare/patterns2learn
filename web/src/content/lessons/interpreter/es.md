---
title: Interpreter
summary: Las coaches escriben los WODs con una notación propia, como "3 x (10 burpees + 15 air-squats)". Convierte cada regla de esa notación en una clase y deja que el árbol se interprete solo.
minutes: 12
level: advanced
recap:
  intent: Para un lenguaje pequeño, representa cada regla de su gramática con una clase; una frase se convierte en un árbol de esos objetos, y cada uno sabe evaluarse a sí mismo.
  participants:
    - AbstractExpression (WodExpression), la operación interpret() que todas las reglas comparten
    - TerminalExpression (Movement), una regla que no contiene otras, como "10 burpees"
    - NonterminalExpression (Sequence, Repeat), reglas que contienen otras expresiones, como "a + b" o "3 x ( … )"
    - Context (Tally), donde las expresiones van dejando el resultado
    - Client (WodController, con WodParser), construye el árbol y le pide que se interprete
  pros:
    - Cada regla es una clase pequeña, fácil de leer y de probar
    - Añadir una regla nueva es añadir una clase (y un caso en el parser)
    - Funciona igual a cualquier profundidad, porque el árbol se recorre solo
  cons:
    - Con gramáticas grandes, son muchas clases; ahí compensa un generador de parsers como ANTLR
    - Una operación nueva (como validar o mostrar) obliga a tocar todas las clases
    - Recorrer un árbol de objetos es más lento que un intérprete optimizado
  related:
    - Composite
    - Visitor
    - Iterator
quiz:
  - q: En "2 x (5 pull-ups + 10 burpees)", ¿qué es una expresión terminal?
    options:
      - El "2 x ( … )" que repite las rondas
      - El "+" que une los dos movimientos
      - El "10 burpees", que no contiene nada más
      - El paréntesis que cierra la ronda
    answer: 2
    explain: Una terminal no contiene otras expresiones. Repeat y Sequence sí las contienen, así que son no terminales.
  - q: Las coaches quieren escribir "21-15-9 thrusters". ¿Qué cambias?
    options:
      - Un if más en interpret() de Movement
      - Una expresión nueva y su regla en el parser
      - El Tally, para que sepa contar escaleras
      - Nada, el parser lo entiende ya
    answer: 1
    explain: Cada regla de la gramática es una clase. Una escalera de repeticiones es una regla nueva, con su expresión y su método en el parser; las demás clases no cambian.
  - q: ¿Por qué Repeat pasa factor × times a su cuerpo en vez de sumar él?
    options:
      - Porque Repeat no tiene acceso al Tally
      - Porque así se ejecuta en paralelo
      - Porque el parser no le deja tocar el Tally
      - Para que las rondas anidadas se multipliquen solas
    answer: 3
    explain: Cada nivel multiplica el factor que recibe. "2 x (3 x (5 pull-ups))" llega a Movement con factor 6, sin que nadie cuente niveles.
  - q: ¿Qué tiene de Interpreter una expresión SpEL de Spring?
    options:
      - Se analiza a un árbol de nodos que se evalúan solos
      - Se compila a bytecode antes de cada llamada
      - Se traduce a SQL y se ejecuta en la base de datos
      - Se guarda como texto y se evalúa con expresiones regulares
    answer: 0
    explain: parseExpression() construye un árbol (OpPlus, OpMultiply, referencias a propiedades…), y cada nodo calcula su valor pidiéndoselo a sus hijos.
---
## @step:problem — Trucos con el texto
Las coaches escriben los WODs en una notación propia: "3 x (10 burpees + 15 air-squats)". La app tiene que saber cuántas repeticiones de cada movimiento salen en total.

La primera versión, `SplitCounter`, usa una expresión regular para quitar un "N x ( … )" y parte el resto por los "+". Con una ronda funciona: 30 burpees y 45 air-squats.

> [!problem]
> El texto tiene estructura (rondas dentro de rondas), pero el código lo trata como una cadena plana.
@describe: SplitCounter, resaltado en rojo, recibe "3 x (10 burpees + …)" del controlador y lo trocea con expresiones regulares.

## @step:smell — Lo anidado se pierde
"2 x (3 x (5 pull-ups) + 10 burpees)". La expresión regular quita la ronda de fuera, parte por "+" y se encuentra "3 x (5 pull-ups)", que no encaja con "N movimiento". Lo salta **sin avisar**: salen 20 burpees y ninguna dominada. El test `SplitCounterTest` lo demuestra.

Arreglarlo con más expresiones regulares no acaba nunca: cada nivel de anidamiento es otro caso.

> [!warning]
> Una notación con anidamiento es una gramática. Tratarla a base de trocear texto falla justo donde la gramática es recursiva.
@describe: La ronda anidada "3 x (5 pull-ups)", resaltada en rojo, no encaja con el patrón y se pierde; solo quedan los burpees.

## @step:expression — Una clase por regla
Interpreter convierte cada regla de la notación en una clase. Todas comparten la interfaz `WodExpression`, con un único método: `interpret(tally, factor)`.

La interfaz es `sealed`: las reglas son exactamente tres, `Movement`, `Sequence` y `Repeat`.

> [!key-idea]
> La gramática deja de estar escondida en el código que trocea texto: cada regla es un tipo.
@describe: Aparece la interfaz WodExpression, resaltada, y dos de las reglas que la implementan: Repeat y Movement.

## @step:terminal — La regla más pequeña
`Movement` es una **expresión terminal**: "10 burpees" no contiene otras expresiones. Al interpretarse, suma sus repeticiones, multiplicadas por el factor, en el `Tally`.

El `Tally` es el **contexto** del patrón: el sitio donde las expresiones dejan el resultado.
@describe: Las dos hojas del árbol, Movement 10 burpees y Movement 15 air-squats, resaltadas; la primera suma sus repeticiones al Tally.

## @step:repeat — Las reglas que contienen otras
`Repeat` ("3 x ( … )") y `Sequence` ("a + b") son **expresiones no terminales**: contienen otras. `Sequence` interpreta sus partes una tras otra. `Repeat` interpreta su cuerpo con el factor multiplicado por sus rondas.

Así, en "2 x (3 x (5 pull-ups))" el movimiento recibe factor 6 sin que nadie cuente niveles.
@describe: Repeat 3 x, resaltado, pasa a Sequence el factor multiplicado por 3.

## @step:tree — Una frase es un árbol
"3 x (10 burpees + 15 air-squats)" es este árbol: un `Repeat` de 3 con un `Sequence` dentro, y dos `Movement` como hojas. El test lo construye a mano y lo interpreta: 75 repeticiones.

La forma es la de un **Composite**: hojas y nodos que contienen nodos, todos con la misma operación.
@describe: El árbol entero resaltado: Repeat llama a Sequence con factor 3 y Sequence a sus dos movimientos.

## @step:parser — Del texto al árbol
Nadie escribe árboles a mano: `WodParser` convierte el texto en el árbol. Tiene un método por regla de la gramática (`sequence` y `term`), y cada uno se llama a sí mismo donde la gramática es recursiva.

Si el texto está mal, dice dónde: "expected ')' at position 15". Y pone límites: 200 caracteres, 5 niveles de rondas y 100.000 repeticiones.

Con el árbol, el caso que rompía la versión anterior funciona: "2 x (3 x (5 pull-ups) + 10 burpees)" da 30 dominadas y 20 burpees, y ninguna clase sabe a qué profundidad está.

> [!key-idea]
> El patrón original no incluye el parser: describe el árbol y cómo se interpreta. Construirlo es otro problema, aquí resuelto con un descenso recursivo de pocas líneas.
@describe: WodParser, resaltado, convierte "3 x (…)" en el árbol de expresiones.

## @step:request — Por HTTP
`POST /api/wods/totals` con el WOD anidado responde los totales por movimiento y las 50 repeticiones. Una notación mal escrita responde 400 con la posición del error.
@describe: POST /api/wods/totals viaja de la coach al controlador, que pasa el texto a WodParser e interpreta el árbol con un Tally nuevo; WodParser y Tally aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
SpEL, el lenguaje de expresiones de Spring (el de `@Value("#{...}")`, `@PreAuthorize` o `@Cacheable(condition = ...)`), es un Interpreter. `parseExpression("reps * rounds + 10")` construye un árbol de nodos: un `OpPlus` con un `OpMultiply` y un literal dentro. Al evaluar, cada nodo calcula su valor pidiéndoselo a sus hijos.

El test evalúa la expresión con `SimpleEvaluationContext`, que solo deja leer propiedades. Nunca evalúes SpEL que venga de fuera con el contexto completo: puede llamar a cualquier clase.

> [!spring]
> Cada vez que escribes `#{...}` en una anotación, Spring analiza el texto a un árbol de expresiones y lo interpreta. Es el mismo patrón, con una gramática mucho mayor.
@describe: El árbol de SpEL para "reps * rounds + 10": SpelExpressionParser crea OpPlus, resaltado, que contiene OpMultiply, también resaltado, con reps y rounds, y el literal 10.

## @step:recap — Resumen
Empezaste troceando texto con expresiones regulares y acabaste con:

- **Una expresión abstracta**, `WodExpression`, con `interpret()`.
- **Una terminal**, `Movement`, y **dos no terminales**, `Sequence` y `Repeat`.
- **Un contexto**, `Tally`, donde se acumula el resultado, y un parser que construye el árbol.

Sus vecinos: la estructura es un **Composite**; si necesitas muchas operaciones distintas sobre el árbol (contar, validar, mostrar), un **Visitor** las saca fuera de las clases. Y un **Iterator** puede recorrer el árbol sin interpretarlo.

Cuándo no usarlo: si la gramática es grande o cambia mucho, un generador de parsers (ANTLR) o un lenguaje ya hecho (SpEL, JSON con un esquema) te ahorran escribir decenas de clases. Y si no hay anidamiento, no hay gramática que modelar: basta con partir el texto.

> [!key-idea]
> Cuando un texto tiene reglas que se anidan, conviértelo en un árbol y deja que cada nodo sepa evaluarse.
@describe: Vista final: la coach, el controlador, WodParser, el árbol de Repeat, Sequence y los dos movimientos, y el Tally, todo dentro del contexto de Spring.
