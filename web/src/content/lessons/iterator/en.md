---
title: Iterator
summary: The box keeps hundreds of results, more every month, and the podium only wants the three best athletes. Walk them one by one with a plain for loop, without loading everything into memory and without repeating the paging everywhere.
minutes: 10
level: beginner
recap:
  intent: Give a way to walk through a collection's elements one by one without showing how they're stored, so whoever walks them doesn't depend on those details.
  participants:
    - Iterator (Iterator<Result>), with hasNext() and next()
    - ConcreteIterator (PagedResultIterator), which knows how to ask for the next page when needed
    - Aggregate (Iterable<Result>), something that can be walked
    - ConcreteAggregate (ResultHistory), which hands out a new iterator for each walk
    - Client (Leaderboard), which walks with a for loop and stops when it has enough
  pros:
    - The client walks with a for loop, knowing nothing about pages or SQL
    - Only what's used is read; if the loop stops early, no more pages are fetched
    - The paging lives in one place instead of being copied into every report
  cons:
    - A long walk runs several queries and may see data that changes meanwhile
    - There's no direct access to a position, nor a total size, without walking it all
    - Getting hasNext() and next() right (without skipping or repeating elements) is trickier than it looks
  related:
    - Composite
    - Factory Method
    - Visitor
quiz:
  - q: How many pages does Leaderboard read for the Fran podium (top 3) with pages of 50?
    options:
      - Five, because it needs to see every result to sort them
      - Three, one for each athlete who makes the podium
      - One, because the loop stops at the third and the iterator asks for no more
      - None, because the results were already loaded in memory
    answer: 2
    explain: The database already returns the results sorted. The iterator only asks for the next page when the current one runs out, and the loop breaks out before that happens.
  - q: What does the client gain from getting an Iterable instead of a List with every result?
    options:
      - Walking them without loading them all into memory
      - Avoiding the N+1 queries a List would cause
      - Reaching any position directly, like with get(i)
      - Having the results cached between requests
    answer: 0
    explain: The client only sees hasNext() and next(). How the results are stored, and when they're fetched, is the iterator's business.
  - q: Why are pages fetched "after the last result seen" and not with an offset?
    options:
      - Because offset can return the pages out of order
      - Because that way every page always brings the same number of rows
      - Because offset needs the total row count first
      - Because offset makes the database read and discard the earlier rows on every page
    answer: 3
    explain: With offset 200, the database reads 200 rows only to throw them away. Asking for (seconds, id) > (the last one seen), it can use the index to start right there, and what was already handed out isn't repeated even if new results arrive.
  - q: What must you always do with the Stream that JdbcClient returns from stream()?
    options:
      - Nothing, Spring closes it at the end of the request
      - Close it, because it keeps the connection and the ResultSet open
      - Turn it into a list before using it for anything
      - Make it parallel() so it doesn't block the connection
    answer: 1
    explain: The stream reads rows as you consume it, so it needs the ResultSet open. A try-with-resources closes it even if you leave early.
---
## @step:problem — The Fran podium
The board shows the Fran podium: the three fastest **athletes**, each with their best time. There are 233 results stored, from about 90 athletes who repeat Fran often, and more every month.

The first version, `LoadEverythingLeaderboard`, loads **all** of them into a list, sorts them in memory and keeps the first ones. The test confirms it: it reads 233 rows to show 3.

> [!problem]
> To use three results, the app brings every one that exists into memory. The more there are, the worse it gets.
@describe: In the earlier version, the request for the Fran top 3 reaches LoadEverythingLeaderboard, highlighted in red, which brings all 233 rows from the table.

## @step:smell — The paging, copied
The usual alternative is paging: ask for 50, then another 50… But look at `OffsetLoopReport`: the paging loop is written by hand, with its `limit`, its `offset` and its exit condition. And every report that needs to walk the results writes it again.

On top of that, `offset 200` makes the database read and discard 200 rows on every page. And if a result arrives while you walk, a row is repeated; if one is deleted, another is lost.

> [!warning]
> When every client knows how the data is stored in order to walk it, changing the way it's stored means touching all of them.
@describe: OffsetLoopReport, highlighted in red, asks the table for limit 50 offset ? in a hand-written loop.

## @step:iterator — One by one
Iterator puts the walk inside an object with two questions:

- `hasNext()`: is there anything left?
- `next()`: give me the next one.

`PagedResultIterator` answers from a page in memory. When it runs out, it asks for the next one, and only then: "the next 50 **after the last one I handed out**", with `(seconds, id) > (?, ?)` so ties are settled by id. If a page comes back short, it knows it was the last; if it comes back full right at the end, one more, empty, query is needed to know.

> [!key-idea]
> The iterator remembers where it is. Whoever uses it only asks "is there more?" and "give me another".
@describe: PagedResultIterator appears, highlighted, asking the table for the next page only when the current one runs out.

## @step:aggregate — Something you can walk
`ResultHistory` doesn't return a list. It returns an `Iterable<Result>`: something that can hand out a new iterator every time someone starts walking it.

That's why two loops over the same `fastest("fran")` don't get in each other's way: each has its own iterator, starting from the beginning. `iterator()` is, in fact, a factory method: `ResultHistory` decides which concrete iterator gets created.
@describe: ResultHistory, highlighted, creates a new iterator for each walk.

## @step:client — A plain old for loop
`Leaderboard` walks with a plain `for` loop: under the hood, Java calls `iterator()`, `hasNext()` and `next()`. No pages, no SQL, no offsets.

It skips results from athletes already on the podium (each one appears once, with their best time) and, when it has what it needs, it leaves with `break`. It doesn't know in advance how many rows it'll need, and it doesn't have to: since the iterator only fetches pages on demand, leaving the loop also means reading stops.

> [!key-idea]
> The client decides how many it wants; the iterator decides how to get them.
@describe: Leaderboard, highlighted, asks ResultHistory for fastest("fran") and then the iterator for next().

## @step:lazy — Only what's used
The test counts it: for the podium, with pages of 50, **one** page is read. Walking all 233 results reads five (50 + 50 + 50 + 50 + 33), and the last one, coming back short, saves one more query.

With the version that loaded everything, the podium cost every row. Now it costs as many pages as it takes to find three different athletes, usually one, whether the box has 233 results or 50,000. Other tests check that ties across pages are neither repeated nor lost.
@describe: The iterator, highlighted together with the table, has read only page 1.

## @step:request — The podium through the API
`GET /api/leaderboard/fran?top=3`:

1. `LeaderboardController` calls `Leaderboard.top("fran", 3)`.
2. The `for` loop asks the iterator for three results, and it reads the first page.
3. The answer brings all three with their rank and time: first place, 2:31.

`top` goes from 1 to 100; outside that range, the answer is 400. A WOD with no results returns an empty list.
@describe: GET /api/leaderboard/fran?top=3 travels from the coach to the controller, top("fran", 3) to Leaderboard, which asks the iterator for next() three times; it reads page 1. Leaderboard and the iterator are highlighted.

## @step:spring-does-it — Spring already does it for you
`JdbcClient` can hand you the results as a `Stream`: `query(Result.class).stream()`. Rows are turned into objects as you consume the stream, so `limit(3)` stops the mapping early. Whether the driver also fetches them from the database bit by bit depends on it (its *fetch size*, whether there's a transaction…): some bring everything at once anyway. And the stream keeps the connection and the `ResultSet` open until you close it: always use it in a try-with-resources.

A detail: with `for` and `hasNext()` you drive the loop (external iteration); with a `Stream` and its operations, the library drives it (internal iteration).

In Spring Data, repositories return `Slice`, `Page` or `Stream`, and since version 3.1 they have `Window` and `WindowIterator`, which walk results page by page "from the last position", like our iterator.

> [!spring]
> Choose by case: a paging iterator to walk without keeping anything open between pages; a stream to read in one go without loading it all into memory.
@describe: Inside the Spring context, JdbcClient, highlighted, hands out a Stream<Result>, also highlighted, that turns the table's rows into objects as they're consumed.

## @step:recap — Recap
You started loading 230 rows to show 3 and ended up with:

- **An iterator** that hands out one at a time and fetches the next page only when needed.
- **An aggregate**, `ResultHistory`, that hands out a new iterator for each walk.
- **A client** that walks with a `for` loop and stops when it has enough.
- **Pages by key**, "after the last one seen", instead of an offset.

Don't mix it up with its neighbours: **Composite** describes *how the data is organised* (a tree), and Iterator *how to walk it* without knowing that; **Visitor** helps you do different operations on each element you walk.

And when you don't need it: if the data is small and already in memory, a `List` and its for loop are simpler; and if you know how many rows you want and the filter fits in SQL, a `LIMIT n` in the query beats any iterator. A paging iterator pays off when you don't know how many rows you'll need and bringing everything is expensive.

> [!key-idea]
> When someone needs to walk a collection, give them an iterator, not the collection: they can stop whenever they like and don't depend on how it's stored.
@describe: Final view: the coach, the controller, Leaderboard, ResultHistory, the iterator and the results table, all inside the Spring context.
