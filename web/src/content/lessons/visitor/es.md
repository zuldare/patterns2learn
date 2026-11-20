---
title: Visitor
summary: Un WOD mezcla levantamientos, gimnásticos y cardio, y cada poco aparece una pregunta nueva sobre él (material, calorías, escalado…). Pon cada operación en su propio objeto, sin tocar las clases de los elementos.
minutes: 11
level: advanced
recap:
  intent: Saca las operaciones de un grupo de clases estable a objetos aparte, para poder añadir operaciones nuevas sin tocar esas clases.
  participants:
    - Visitor (WorkoutVisitor), con un método visit por cada tipo de elemento
    - ConcreteVisitor (EquipmentVisitor, CalorieVisitor), una operación cada uno
    - Element (WorkoutElement), que acepta visitantes con accept()
    - ConcreteElement (Lift, Gymnastics, Cardio), que llaman al visit de su tipo
    - Object structure (Workout), que recorre sus elementos para cualquier visitante
  pros:
    - Una operación nueva es una clase nueva; los elementos no cambian
    - Todo el código de una operación está junto, no repartido por los elementos
    - El visitante puede ir acumulando un resultado mientras recorre
  cons:
    - Un tipo de elemento nuevo obliga a tocar la interfaz y todos los visitantes
    - accept() y la doble llamada cuestan de leer la primera vez
    - Los elementos tienen que exponer lo que los visitantes necesitan
  related:
    - Composite
    - Iterator
    - Strategy
quiz:
  - q: Quieres añadir una operación nueva, el escalado de cada elemento. ¿Qué cambias?
    options:
      - Un método scaling() en Lift, Gymnastics y Cardio
      - Un instanceof más en cada análisis que ya existe
      - Una clase ScalingVisitor nueva; los elementos no cambian
      - El controlador, para que calcule el escalado él mismo
    answer: 2
    explain: Cada operación es un visitante. ScalingVisitor implementa los tres visit y ni Lift, ni Gymnastics, ni Cardio se enteran.
  - q: ¿Y si lo que añades es un tipo de elemento nuevo, Rest?
    options:
      - Hay que añadir visitRest a WorkoutVisitor y a cada visitante
      - Solo hay que crear la clase Rest con su accept()
      - Hay que tocar el controlador y nada más
      - Spring lo registra solo, como un visitante más
    answer: 0
    explain: Es el precio del patrón. Añadir operaciones es fácil; añadir tipos de elemento obliga a tocar todos los visitantes. Por eso encaja cuando los tipos cambian poco.
  - q: ¿Para qué sirve accept() en cada elemento?
    options:
      - Para validar los datos del elemento antes de usarlo
      - Para que el elemento guarde el resultado de la operación
      - Para copiar el elemento antes de que lo visiten
      - Para llamar al visit de su propio tipo, sin instanceof
    answer: 3
    explain: Lift.accept(v) llama a v.visitLift(this). Java elige el accept según la clase real del elemento y el visit según el visitante; es la doble llamada que sustituye al instanceof.
  - q: Con una interfaz sealed y un switch sin default, ¿qué pasa si añades Rest?
    options:
      - Funciona igual, y Rest suma cero calorías
      - El switch deja de compilar hasta que añades el caso de Rest
      - Salta una excepción la primera vez que llega un Rest
      - Hay que reiniciar la aplicación para que lo tenga en cuenta
    answer: 1
    explain: El compilador sabe todos los tipos posibles de un sealed y comprueba que el switch los cubre. Es la misma red de seguridad que da Visitor, con menos ceremonia.
---
## @step:problem — Preguntas sobre un WOD
Un WOD tiene elementos de tres tipos: **levantamientos** (peso muerto, 100 kg × 15), **gimnásticos** (30 burpees) y **cardio** (1000 m de remo). Y el box le hace cada vez más preguntas: qué material hay que sacar, cuántas calorías se gastan, cómo se escala…

La primera versión, `InstanceofAnalyzer`, responde cada pregunta con su propia cadena de `instanceof`: "¿es un levantamiento? ¿es un gimnástico?…".

> [!problem]
> Cada operación vuelve a preguntar a cada elemento qué es, y lo hace a su manera.
@describe: InstanceofAnalyzer, resaltado en rojo, pregunta a cada elemento si es un Lift o un Gymnastics.

## @step:smell — El cardio se quedó fuera
El cardio llegó después. Se añadió a la lista de material, pero a la cadena de calorías **nadie se acordó** de añadirlo: 1000 m de remo cuentan como 0 kcal, sin error ni aviso. El test `InstanceofAnalyzerTest` lo deja a la vista.

Con cada operación nueva hay una cadena más que mantener al día, y el compilador no avisa cuando falta un caso.

> [!warning]
> Cuando varias operaciones repiten el mismo `instanceof` sobre la misma familia de clases, olvidar un caso es solo cuestión de tiempo.
@describe: InstanceofAnalyzer y Cardio, resaltados en rojo: las calorías del cardio salen 0 porque su caso no existe.

## @step:visitor — Un método por tipo
Visitor define una interfaz con **un método por tipo de elemento**: `visitLift`, `visitGymnastics`, `visitCardio`, y `result()` para recoger el resultado.

Cada operación es una clase que la implementa. Y como hay que implementar los tres métodos, el compilador ya no deja olvidarse de ninguno.

> [!key-idea]
> Cada operación pasa a ser un objeto, con un método para cada tipo de elemento.
@describe: Aparece la interfaz WorkoutVisitor, resaltada, con EquipmentVisitor y CalorieVisitor implementándola, junto a los tres tipos de elemento.

## @step:accept — Cada elemento llama a su método
¿Cómo sabe el visitante qué tipo de elemento tiene delante sin preguntar? No lo sabe: se lo dice el elemento. Cada uno implementa `accept(visitor)` llamando a su propio método: `Lift` llama a `visitLift(this)`.

Es una **doble llamada**: Java elige `accept` según la clase real del elemento, y el `visit` según el visitante. Juntas sustituyen al `instanceof`.
@describe: Lift, resaltado junto a EquipmentVisitor, le llama con visitLift(this).

## @step:equipment — Una operación, una clase
`EquipmentVisitor` reúne todo lo que hace falta saber sobre el material: barra y discos para los levantamientos, barra de dominadas si hay dominadas o toes-to-bar, remo, bici o ski según la máquina.

`Workout` recorre sus elementos y llama a `accept` con el visitante; al final pide `result()`.
@describe: Workout llama a accept(v) en cada elemento; Lift responde a EquipmentVisitor, resaltado, que apunta barra y discos.

## @step:new-operation — Otra operación, sin tocar nada
`CalorieVisitor` es otra clase con sus tres métodos. Para añadirla no se ha tocado `Lift`, ni `Gymnastics`, ni `Cardio`, ni `Workout`. Y el remo ya no puede quedarse fuera: sin `visitCardio`, no compila.

> [!key-idea]
> Con Visitor, añadir operaciones es barato. Añadir tipos de elemento es caro: cada visitante necesita su método nuevo.
@describe: CalorieVisitor, resaltado, recibe visitGymnastics y visitCardio de los elementos.

## @step:sealed — En Java moderno
Desde Java 21, una interfaz `sealed` y un `switch` con patrones dan una red de seguridad parecida con menos ceremonia: el compilador conoce todos los tipos posibles y, si el `switch` no tiene `default`, no compila hasta que cubres todos.

`PatternMatchingCalories` calcula lo mismo que `CalorieVisitor`, y un test lo comprueba. ¿Cuál usar? El `switch` es más directo para operaciones sencillas; el visitante encaja cuando la operación tiene estado propio, cuando quieres pasarla como objeto o cuando la jerarquía no es `sealed`.
@describe: Los tres tipos de elemento, resaltados: un switch sobre la interfaz sealed los cubre todos.

## @step:request — El análisis por la API
`POST /api/wods/analysis` con el WOD en JSON (un campo `type` por elemento):

1. Jackson crea `Lift`, `Cardio` y `Gymnastics`, que validan sus datos.
2. El controlador pasa por el `Workout` un `EquipmentVisitor` y un `CalorieVisitor` nuevos.
3. La respuesta trae el material (barra y discos, remo) y 102 kcal estimadas.

Un elemento que no cumple las reglas, como una máquina que no existe, devuelve 400 con el motivo.
@describe: POST /api/wods/analysis viaja del coach al controlador, que pasa dos visitantes por Workout; Cardio acepta y CalorieVisitor suma 60 kcal. Workout y los dos visitantes aparecen resaltados.

## @step:spring-does-it — Spring ya lo hace por ti
Una definición de bean tiene muchas partes: el nombre de la clase, las propiedades, los argumentos del constructor, beans y colecciones anidadas… `BeanDefinitionVisitor` las recorre todas y pasa cada valor de texto por un resolvedor.

Es lo que usa Spring para sustituir los `${...}` de las definiciones de beans (lo hace `PropertySourcesPlaceholderConfigurer`, a través de `PlaceholderConfigurerSupport`). En el test, `${coach}` pasa a ser "Ana" y `${city}`, "Madrid".

> [!spring]
> La operación (resolver placeholders) está fuera de la definición. Recorrer la estructura es cosa del visitante, y qué hacer con cada valor, del resolvedor que le pasas.
@describe: Dentro del contexto de Spring, BeanDefinitionVisitor, resaltado, recorre la definición: ${coach} pasa a Ana y ${city} a Madrid.

## @step:recap — Resumen
Empezaste con cadenas de `instanceof` que se olvidaban del cardio y acabaste con:

- **Un visitante por operación**, con un método para cada tipo de elemento.
- **`accept()` en cada elemento**, que llama a su método sin preguntar.
- **Operaciones nuevas sin tocar los elementos**, y casos olvidados que no compilan.
- **La alternativa moderna**: `sealed` y `switch` con patrones.

No lo confundas con sus vecinos: **Iterator** recorre los elementos; Visitor dice qué hacer con cada tipo. **Composite** organiza los elementos en árbol, y un visitante puede recorrerlo entero. Un **Strategy** cambia *cómo* se hace una operación; un visitante es una operación nueva sobre todos los tipos.

Y cuándo no hace falta: si los tipos de elemento cambian a menudo, cada tipo nuevo obliga a tocar todos los visitantes; y si las operaciones son pocas y sencillas, un método en cada elemento o un `switch` sobre un `sealed` es más directo.

> [!key-idea]
> Cuando los tipos son estables y las operaciones no paran de crecer, pon cada operación en su propio objeto.
@describe: Vista final: el coach, el controlador, Workout, los tres elementos, los dos visitantes y WorkoutVisitor, todo dentro del contexto de Spring.
