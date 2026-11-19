---
title: Decorator
summary: Fisio, nutrición, open gym, descuento de estudiante… Si cada combinación de extras es una clase, el código explota. Envuelve el plan base en capas que se suman y deja que Spring las ordene.
minutes: 11
level: intermediate
recap:
  intent: Añade responsabilidades a un objeto envolviéndolo en otros con su misma interfaz, en lugar de crear una subclase para cada combinación.
  participants:
    - Component (Membership), la interfaz común de planes y extras
    - ConcreteComponent (BasicMembership), el plan base que todo el mundo envuelve
    - Decorator (MembershipDecorator), que guarda el objeto envuelto y delega en él
    - ConcreteDecorator (PhysioAddOn, NutritionAddOn, OpenGymAddOn, StudentDiscount), que añaden su parte
  pros:
    - Las combinaciones se arman en tiempo de ejecución, sin una clase por combinación
    - Cada extra vive en una clase pequeña y se prueba por separado
    - El cliente sigue viendo un Membership, venga sin capas o con las cuatro
  cons:
    - Si un decorador no es puramente aditivo, el orden de las capas cambia el resultado
    - Muchas capas pequeñas cuestan más de depurar que una clase
    - Quien pregunte por el tipo concreto (instanceof) ve el decorador de fuera, no el plan base
  related:
    - Proxy
    - Composite
    - Chain of Responsibility
quiz:
  - q: Con 4 extras que se pueden combinar libremente, ¿cuántas clases necesitas con una subclase por combinación? ¿Y con decoradores?
    options:
      - 4 y 4
      - 16 y 5 (el plan base más un decorador por extra)
      - 8 y 8
      - 16 y 16
    answer: 1
    explain: Cada extra puede estar o no estar, así que hay 2⁴ = 16 combinaciones, cada una una subclase. Con decoradores basta el plan base y una clase por extra (sin contar la interfaz ni la clase abstracta que comparten), y las combinaciones se arman al vuelo.
  - q: StudentDiscount resta un 20 % a lo que envuelve. ¿Por qué tiene que ser la capa de fuera?
    options:
      - Porque Java no permite otro orden
      - Porque así se ejecuta más rápido
      - Por nada, el resultado es el mismo en cualquier orden
      - Porque si va dentro, el descuento solo se aplica al plan base y los extras que lo envuelven se cobran enteros
    answer: 3
    explain: Los extras suman y el descuento multiplica, así que el orden importa. (59 + 25) × 0,8 = 67,20 €, pero 59 × 0,8 + 25 = 72,20 €. Por eso el bean del descuento lleva @Order(LOWEST_PRECEDENCE).
  - q: ¿Qué hace que MembershipQuoter reciba los AddOn en un orden concreto?
    options:
      - La anotación @Order de cada bean; Spring ordena así las listas inyectadas
      - El orden alfabético de los nombres de los beans
      - El orden en que el cliente los pide en la URL
      - Nada, una List inyectada no tiene orden garantizado
    answer: 0
    explain: Cuando inyectas una List de beans, Spring la ordena por @Order (o por la interfaz Ordered). Así el quoter aplica siempre los extras primero y el descuento al final, pida el cliente lo que pida.
  - q: ¿En qué se diferencia un Decorator de un Proxy?
    options:
      - El Decorator no puede llamar al objeto envuelto
      - Solo el Proxy implementa la misma interfaz
      - El Decorator añade comportamiento que el cliente ve y compone a propósito; el Proxy controla el acceso y suele ser transparente
      - Son el mismo patrón con distinto nombre
    answer: 2
    explain: La forma es la misma, envolver un objeto con su misma interfaz. Cambia la intención. Aquí cada capa cambia el precio y la descripción a la vista del cliente; un proxy de @Transactional no cambia lo que devuelves, solo ejecuta la llamada dentro de una transacción.
---
## @step:problem — Una clase por combinación
El plan básico del box cuesta 59 € al mes. Encima, cada atleta puede añadir extras: **fisio** (+25 €) y **nutrición** (+15 €).

La primera versión crea una subclase por cada combinación: `BasicWithPhysio`, `BasicWithNutrition`, `BasicWithPhysioAndNutrition`… Una atleta pide fisio y nutrición, y el controlador tiene que encontrar la clase exacta para esa combinación.

> [!problem]
> El precio de cada extra está copiado a mano en todas las clases que lo incluyen: 59 + 25 + 15, escrito como 99.00.
@describe: El atleta envía physio + nutrition al controlador, que está unido a tres clases de plan; BasicWithPhysioAndNutrition está resaltada en rojo.

## @step:smell — Y llega el open gym
Con 2 extras ya hay 4 clases. Añade el **open gym** (+10 €) y son 8. Con el descuento de estudiante, 16. Cada extra nuevo **duplica** las clases.

Y si fisio sube de precio, toca encontrar y cambiar todas las clases que lo incluyen. Basta saltarse una para cobrar mal.

> [!warning]
> La herencia sirve para "es un tipo de". Para "lleva además", combina objetos.
@describe: Las tres clases de combinación aparecen resaltadas: cada extra nuevo duplicaría su número.

## @step:decorator — Un extra que envuelve
El patrón Decorator cambia la herencia por **envoltorios**:

- `Membership` es la interfaz: `description()` y `monthlyFee()`.
- `BasicMembership` es el plan base.
- `PhysioAddOn` también es un `Membership`, pero guarda **otro** `Membership` dentro (`inner`). Cuando le preguntas el precio, pregunta a `inner` y le suma 25 €.

Fisio no sabe ni le importa qué hay dentro: un plan básico, otro extra o diez.

> [!key-idea]
> Un decorador tiene la misma cara que lo que envuelve, así que puede envolver a cualquiera, incluso a otro decorador.
@describe: Aparecen la interfaz Membership, PhysioAddOn, resaltado, y BasicMembership; PhysioAddOn envía monthlyFee() al plan básico que envuelve.

## @step:stacking — Capas que se suman
Para fisio y nutrición no hace falta ninguna clase nueva: se apilan las capas.

`new NutritionAddOn(new PhysioAddOn(new BasicMembership()))`

Al pedir el precio, cada capa pregunta a la de dentro y suma lo suyo: el básico da 59,00 €, fisio lo deja en 84,00 € y nutrición en **99,00 €**. La descripción se construye igual: "Basic + Physio + Nutrition".

> [!key-idea]
> 4 extras ya no son 16 clases, sino el plan base y 4 decoradores que se combinan como quieras.
@describe: Nutrition pregunta el precio a Physio, Physio al plan básico, y las respuestas vuelven: 59.00 de Basic a Physio y 84.00 de Physio a Nutrition. Los dos decoradores están resaltados.

## @step:spring-addons — Cada extra, un bean
En Spring, cada opción es un bean `AddOn`: un nombre (`physio`, `nutrition`, `open-gym`, `student`) y cómo envolver un plan. `MembershipQuoter` los recibe **todos** en una `List<AddOn>`.

Fíjate en el `@Order` de cada bean: Spring ordena la lista inyectada según él. Los extras van primero (10, 20, 30) y el descuento de estudiante, con `@Order(DISCOUNTS)`, que vale 1000, siempre el último. Los decoradores en sí no son beans: el quoter los crea en cada presupuesto, envolviendo el plan con cada opción pedida.

> [!spring]
> ¿Una opción nueva, por ejemplo una taquilla? Un `@Bean` más con su `@Order`. Ni el quoter ni el controlador cambian. Ponle siempre un orden explícito: un bean sin `@Order` iría al final, empatado con el descuento.
@describe: Aparece el contexto de Spring. MembershipQuoter, resaltado junto al contexto, está unido a la cadena de decoradores y a StudentDiscount.

## @step:request — Un presupuesto de principio a fin
Una atleta pide `GET /api/memberships/quote?addOns=physio,nutrition`:

1. El quoter comprueba que existen los dos y que no se repiten. Si no, la API responde con un 400.
2. Parte del plan básico y recorre la lista de `AddOn` en orden: envuelve con fisio y después con nutrición.
3. Pide el precio a la capa de fuera, que se lo pregunta a la de dentro, y esta al plan básico.
4. La API devuelve `{"description": "Basic + Physio + Nutrition", "monthlyFee": "99.00"}`.

> [!key-idea]
> El quoter no sabe sumar precios: solo apila capas. Cada capa sabe lo suyo.
@describe: physio + nutrition viaja del atleta al controlador, quote() al quoter y monthlyFee() baja por la cadena: NutritionAddOn, PhysioAddOn, resaltados, y BasicMembership.

## @step:order — Cuando el orden importa
Los extras suman, así que da igual en qué orden se apilen. El **descuento de estudiante** multiplica por 0,8, y ahí el orden sí cambia el precio:

- Descuento por fuera: (59 + 25) × 0,8 = **67,20 €**.
- Descuento por dentro: 59 × 0,8 + 25 = **72,20 €**, y el fisio se cobra sin descuento.

Gracias al `@Order`, el quoter siempre pone el descuento como capa exterior, y da igual si el cliente pide `student,physio` o `physio,student`.

> [!warning]
> En cuanto un decorador no es puramente aditivo, el orden de las capas forma parte de la lógica de negocio. Fíjalo en un único sitio y pruébalo.
@describe: El quoter pide el precio a StudentDiscount, resaltado, que se lo pregunta a PhysioAddOn; vuelven 84.00 de Physio y 67.20 del descuento.

## @step:spring-does-it — Spring ya lo hace por ti
Spring tiene un enganche para envolver beans: un `BeanPostProcessor` ve pasar cada bean recién creado y puede devolver **otro objeto** en su lugar. Si devuelves un decorador, eso es lo que se inyecta en todas partes… siempre que se pida por la interfaz `Membership`. Quien pida la clase concreta `BasicMembership` ya no la encontrará. Así es como Spring crea los proxies de la lección de Proxy: el creador de auto-proxies de AOP es un `BeanPostProcessor` que devuelve un envoltorio.

En el ejemplo, `AuditEveryMembership` envuelve cualquier `Membership` en un `AuditedMembership` que anota cada vez que alguien pregunta el precio.

> [!spring]
> La misma idea la verás con nombre propio. `TaskDecorator` envuelve cada tarea del executor en el que lo registras, por ejemplo el de `@Async`, para copiar el contexto de log. `ContentCachingRequestWrapper` envuelve la petición HTTP y guarda una copia de los bytes del cuerpo según se leen, para usarla después, por ejemplo en un log, con `getContentAsByteArray()`.
@describe: Dentro del contexto de Spring, BeanPostProcessor, resaltado, envuelve el plan en AuditedMembership, también resaltado, que pregunta el precio a BasicMembership.

## @step:recap — Resumen
Empezaste con una clase por cada combinación de extras y acabaste con:

- **Un plan base** y un **decorador por extra**, todos con la misma interfaz.
- **Combinaciones al vuelo**, apilando capas que suman su parte.
- **Beans `AddOn` con `@Order`**, para que el orden de las capas sea siempre el mismo.
- **El descuento por fuera**, porque multiplica.

> [!key-idea]
> Cuando tengas "X, opcionalmente con A, B o C", no hagas subclases: envuelve.
@describe: Vista final: el atleta, el controlador, el quoter y la cadena de decoradores, con StudentDiscount delante, todo dentro del contexto de Spring.
