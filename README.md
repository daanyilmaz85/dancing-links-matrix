# dancing-links-matrix

Stores a sparse binary matrix using doubly-linked orthogonal lists (Knuth's Dancing Links technique), supporting reversible column and row deletion for exact-cover backtracking.

## Usage

```js
import { DancingLinksMatrix } from 'dancing-links-matrix';

const m = new DancingLinksMatrix(7);
m.addRow([0, 3, 6]); // returns the row index, here 0
m.addRow([1, 4]);
m.addRow([2, 5]);

const col = m.chooseColumn(); // picks the column with the fewest remaining 1s
m.cover(col);                 // removes col and every row that has a 1 in it
// ... recursive backtracking search here ...
m.uncover(col);               // restores everything cover removed, in reverse order
```

`rowsInColumn(col)` yields each `Node` currently in a column; `columnIndicesInRow(node)` yields the column indices in that node's row. These are the two primitives you need to drive a backtracking search: cover the columns of a chosen row, recurse, then uncover in reverse.

## Why this exists

Exact-cover problems (Sudoku, N-queens, polyomino packing) generate enormous search trees. A dense matrix is wasteful and mutation is hard to undo cleanly. Dancing Links keeps every 1 in a four-way doubly-linked ring, so `cover` and `uncover` are a handful of pointer reassignments and fully reversible without copying. This library provides the data structure only — it does not implement a solver. Callers write their own recursion using `chooseColumn`, `rowsInColumn`, `columnIndicesInRow`, `cover`, and `uncover`.

The trade-off: you manage the backtracking yourself. This keeps the library small (zero dependencies, no algorithmic opinions) and lets you integrate pruning, heuristics, or early termination as you see fit.

## Edge cases

- `addRow([])` is valid and returns a row index, but contributes no nodes. It will never be selected by `chooseColumn`. This is intentional: an empty row cannot be part of any exact cover.
- `chooseColumn` returns `null` when every column has been covered (the root's horizontal list is empty). Your search loop must check for this — it is the success signal.
- `chooseColumn` returns a column with `size === 0` when a dead branch is reached. Your search loop must treat this as failure (no rows to try) and backtrack.
- `cover` and `uncover` must be called in strict LIFO order. Uncovering in the wrong order corrupts the structure.

## Exported names

`DancingLinksMatrix`, `Node`, `ColumnHeader` from `src/index.js`.

Methods on `DancingLinksMatrix`: `addRow(ones)`, `cover(col)`, `uncover(col)`, `chooseColumn()`, `isEmpty()`, `rowsInColumn(col)` (generator), `columnIndicesInRow(node)` (generator).

Properties on `DancingLinksMatrix`: `root` (the sentinel `ColumnHeader`), `columns` (array of `ColumnHeader`), `numCols`, `numRows`.

Properties on `Node`: `left`, `right`, `up`, `down`, `column`, `row`.

Properties on `ColumnHeader` (extends `Node`): `size`, `index`.
