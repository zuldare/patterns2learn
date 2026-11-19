package com.patterns2learn.box.iterator;

import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.function.BiFunction;

/**
 * The iterator: hands out results one by one and fetches the next page only when the current
 * one runs out. Pages are asked for "after the last result seen" (keyset), not by offset.
 */
class PagedResultIterator implements Iterator<Result> {
    private final int pageSize;
    private final BiFunction<Result, Integer, List<Result>> fetchAfter;
    private List<Result> page = List.of();
    private int next;
    private Result last;
    private boolean noMorePages;

    PagedResultIterator(int pageSize, BiFunction<Result, Integer, List<Result>> fetchAfter) {
        this.pageSize = pageSize;
        this.fetchAfter = fetchAfter;
    }

    // @step:iterator
    @Override
    public boolean hasNext() {
        if (next < page.size()) return true;              // still something in this page
        if (noMorePages) return false;
        page = fetchAfter.apply(last, pageSize);          // fetch the next page only now
        next = 0;
        noMorePages = page.size() < pageSize;             // a short page is the last one
        return !page.isEmpty();
    }

    @Override
    public Result next() {
        if (!hasNext()) throw new NoSuchElementException();
        last = page.get(next++);
        return last;
    }
    // @end
}
