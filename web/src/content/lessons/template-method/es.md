---
title: Template Method
summary: Importar resultados desde CSV o desde la app de un partner son el mismo proceso con un paso distinto. Fija el esqueleto una vez y deja que cada formato rellene solo su parte.
minutes: 11
level: beginner
recap:
  intent: Define el esqueleto de un algoritmo en un método y deja que las subclases redefinan solo algunos pasos, sin cambiar el orden ni el resto.
  participants:
    - AbstractClass (ResultImporter), con el método plantilla importAll() y los pasos comunes
    - Pasos abstractos (parse), que cada subclase está obligada a implementar
    - Hooks (afterImport), pasos opcionales que no hacen nada por defecto
    - ConcreteClass (CsvResultImporter, JsonResultImporter), que solo rellenan lo que cambia
  pros:
    - Las reglas comunes (validar, guardar, informar) se escriben una vez
    - Un formato nuevo es una subclase con un solo método obligatorio
    - El orden de los pasos está garantizado, porque el método plantilla es final
  cons:
    - Usa herencia, así que la subclase queda atada a la clase base
    - Con muchos hooks, cuesta seguir qué se ejecuta y cuándo
    - Si la variación crece mucho, una estrategia o un callback suelen encajar mejor
  related:
    - Strategy
    - Factory Method
quiz:
  - q: ¿Por qué importAll() está marcado como final?
    options:
      - Porque Java no deja sobrescribir métodos públicos
      - Para que sea más rápido
      - Porque Spring no puede crear beans de clases con métodos sobrescribibles
      - Para que ninguna subclase pueda saltarse la validación o cambiar el orden de los pasos
    answer: 3
    explain: El valor del patrón es que el esqueleto no cambia. Con final, una subclase solo puede tocar los pasos que la clase base le ofrece (parse y el hook), nunca el algoritmo en sí.
  - q: Cuando usas JdbcTemplate.query(), ¿qué parte escribes tú?
    options:
      - La conexión, el statement y el cierre de recursos
      - La consulta SQL y cómo convertir una fila en un objeto (el RowMapper)
      - La traducción de SQLException a excepciones de Spring
      - El bucle que recorre el ResultSet
    answer: 1
    explain: JdbcTemplate fija todo lo repetitivo (abrir, ejecutar, recorrer, cerrar, traducir errores) y te pide solo la parte variable. Es la idea del Template Method, pero el paso variable llega como callback en lugar de por herencia.
  - q: ¿Qué es un hook en el Template Method?
    options:
      - Un paso con una implementación por defecto (a menudo vacía) que las subclases pueden sobrescribir si lo necesitan
      - Un paso abstracto que todas las subclases deben implementar
      - Un listener de eventos de Spring
      - El método final que define el orden
    answer: 0
    explain: El hook es opcional. Aquí afterImport() no hace nada por defecto; JsonResultImporter lo sobrescribe para guardar el último informe del partner, y CsvResultImporter ni se entera.
  - q: ¿En qué se diferencia el Template Method de Strategy?
    options:
      - Template Method solo sirve para importar ficheros
      - Strategy necesita clases abstractas y Template Method interfaces
      - Template Method varía pasos de un algoritmo mediante herencia; Strategy cambia el algoritmo entero mediante composición
      - No se diferencian
    answer: 2
    explain: En Template Method la clase base controla el flujo y la subclase rellena huecos. En Strategy el objeto delega el algoritmo completo en otro objeto que puedes cambiar en tiempo de ejecución.
---
## @step:problem — Dos importadores, el mismo código
El box recibe resultados de dos sitios. Los coaches suben un CSV después de cada clase, y una app de un partner los envía en JSON.

Cada formato tiene su importador, escrito de principio a fin: leer, convertir cada fila en un `Result`, validar, guardar y contar. Fíjate en que **solo el primer paso** depende del formato; el resto es idéntico.

> [!problem]
> El mismo proceso está copiado en dos clases. Cada cambio en las reglas hay que hacerlo dos veces.
@describe: El coach envía results.csv a ResultImportController. Al lado están CopyPasteCsvImporter y CopyPasteJsonImporter, los dos resaltados, y los dos guardan en ResultRepository.

## @step:smell — El arreglo que solo llegó a una copia
Alguien añadió una regla: una puntuación tiene que ser mayor que 0. La metió en el importador de CSV… y se olvidó del de JSON.

El partner envía un resultado con `score: 0`. El importador de JSON no lo comprueba y solo lo frena la restricción `CHECK` de la base de datos, con un error feo en lugar de un rechazo claro.

> [!warning]
> El código duplicado no solo es más largo: diverge. Tarde o temprano, una copia tiene un arreglo que la otra no tiene.
@describe: La app del partner envía score: 0 al controlador, que lo pasa a CopyPasteJsonImporter, resaltado; el INSERT hacia ResultRepository falla.

## @step:template — Un esqueleto que no se toca
El Template Method saca el proceso a una clase base, `ResultImporter`, con un método `importAll()` que fija los pasos y su orden:

1. `parse(payload)`, que es lo que **cambia** según el formato.
2. Validar cada resultado, con la regla escrita **una sola vez**.
3. Guardar los válidos y apuntar los rechazados.
4. `afterImport(report)`, un paso opcional.

`importAll()` es `final`: ninguna subclase puede saltarse la validación ni cambiar el orden. Y el bucle de guardado va dentro de un `TransactionTemplate`: o se guardan todas las filas válidas, o ninguna.

> [!key-idea]
> La clase base decide *qué* pasa y *en qué orden*; las subclases solo deciden *cómo* se hace el paso que les toca.

> [!warning]
> ¿Por qué no `@Transactional` en `importAll()`? Porque es `final`, y como viste en la lección de Proxy, el proxy de Spring no puede interceptar un método `final`. La llamada se ejecutaría sobre el propio proxy, cuyos campos están vacíos, y acabaría en un `NullPointerException`. `TransactionTemplate` hace el mismo trabajo desde dentro, sin proxy.
@describe: Aparece la clase abstracta ResultImporter, resaltada, que guarda en ResultRepository. Los importadores copiados han desaparecido.

## @step:steps — Cada formato rellena su hueco
Ahora cada formato es una subclase con **un único método obligatorio**:

- `CsvResultImporter.parse()` comprueba la cabecera, se la salta y parte cada línea por comas.
- `JsonResultImporter.parse()` deja que Jackson convierta el JSON en una lista de `Result`.

Ninguna de las dos valida ni guarda nada: eso ya lo hace la clase base. La regla del `score > 0` vale ahora para los dos formatos, y para el siguiente que llegue.

> [!key-idea]
> Añadir un formato nuevo, por ejemplo Excel, es escribir una subclase con su `parse()`. Nada más.
@describe: CsvResultImporter y JsonResultImporter aparecen resaltados, los dos con flechas de herencia hacia ResultImporter.

## @step:spring-wiring — Dos beans, un endpoint
Las dos subclases son beans normales (`@Component`). El controlador las recibe por constructor y tiene un método por formato; Spring MVC elige cuál llamar según el `Content-Type` de la petición (el atributo `consumes`):

- `text/csv` va a `csv.importAll(...)`.
- `application/json` va a `json.importAll(...)`.

Las dos llamadas son al **mismo** método plantilla; lo único que cambia es qué subclase rellena el paso de `parse`.

> [!spring]
> Si una línea del CSV viene mal formada, `parse()` lanza una `IllegalArgumentException` con el número de línea y un `@RestControllerAdvice` la convierte en un 400. Un `Content-Type` que no es ni CSV ni JSON recibe un 415.
@describe: Aparece el contexto de Spring bajo todo el diagrama; el controlador está resaltado junto al contexto, conectado a los dos importadores.

## @step:request — Un CSV de principio a fin
El coach sube el CSV de la clase de las 18:00 con tres filas: Ana con 185, Leo con 0 y Mia con 21.

1. El controlador llama a `importAll()` en `CsvResultImporter`.
2. `parse()` convierte las líneas en tres `Result`.
3. El paso común de validación rechaza a Leo: `score must be > 0`.
4. Se guardan Ana y Mia, y la API devuelve `{imported: 2, rejected: ["Leo/Fran: score must be > 0"]}`.

> [!key-idea]
> El rechazo es idéntico venga de CSV o de JSON, porque la regla vive en un solo sitio.
@describe: results.csv viaja del coach al controlador, importAll() del controlador a CsvResultImporter y save ×2 de ResultImporter, resaltado, a ResultRepository.

## @step:hook — Un paso opcional
Solo la integración del partner necesita algo extra: guardar el último informe para que su app pueda consultarlo con `GET /api/results/import/partner/last`. Para eso está el **hook** `afterImport()`. En la clase base no hace nada, y `JsonResultImporter` lo sobrescribe.

> [!warning]
> El Template Method se basa en la herencia, así que cada subclase queda atada a la clase base. Si empiezas a acumular hooks o a sobrescribir medio comportamiento, es señal de que una estrategia o un callback encajan mejor. Eso es justo lo que hace Spring en el siguiente paso.
@describe: La app del partner envía JSON al controlador, que llama a importAll() en JsonResultImporter, resaltado.

## @step:spring-does-it — Spring ya lo hace por ti
`JdbcTemplate` es un Template Method enorme. Él fija la parte de siempre: pedir la conexión, preparar la sentencia, ejecutarla, recorrer el `ResultSet`, cerrar todo y traducir los errores SQL a excepciones de Spring.

Tú solo pones lo que cambia: el SQL y un `RowMapper`, que dice cómo convertir **una** fila en un `Result`. Pero no heredas de nada: el paso variable llega como una lambda. Es la versión "callback" del mismo patrón.

> [!spring]
> La misma idea está en `TransactionTemplate` (el que usa nuestro `importAll()`), `JmsTemplate` o `RestClient`, que fija cómo se envía la petición y te deja enchufar con lambdas qué hacer con los errores o con la respuesta. Y en `AbstractController` o `OncePerRequestFilter` la ves en su forma clásica: heredas y rellenas un método.
@describe: Dentro del contexto de Spring quedan ResultRepository y JdbcTemplate, resaltado; el repositorio le envía query(sql, rowMapper).

## @step:recap — Resumen
Empezaste con dos importadores copiados que ya no coincidían y acabaste con:

- **Un esqueleto**, `importAll()`, `final` y escrito una vez.
- **Un paso abstracto**, `parse()`, que cada formato implementa.
- **Un hook**, `afterImport()`, para quien necesite algo extra.
- **Las reglas comunes**, en un solo sitio, para todos los formatos.

> [!key-idea]
> Cuando varias clases hacen "lo mismo salvo un paso", saca el proceso a una plantilla y deja que cada una rellene solo su paso.
@describe: Vista final: el coach y el partner, el controlador, los dos importadores heredando de ResultImporter y el repositorio, todo dentro del contexto de Spring.
