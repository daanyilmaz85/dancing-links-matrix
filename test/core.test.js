import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DancingLinksMatrix } from '../src/index.js';

function buildSudokuLikeMatrix() {
  const m = new DancingLinksMatrix(7);
  m.addRow([0, 3, 6]);
  m.addRow([1, 4]);
  m.addRow([2, 5]);
  m.addRow([0, 2]);
  m.addRow([1, 6]);
  m.addRow([3, 5]);
  return m;
}

test('constructor creates the right number of columns', () => {
  const m = new DancingLinksMatrix(3);
  assert.equal(m.numCols, 3);
  assert.equal(m.numRows, 0);
  assert.equal(m.isEmpty(), false);
  let count = 0;
  let c = m.root.right;
  while (c !== m.root) {
    count++;
    c = c.right;
  }
  assert.equal(count, 3);
});

test('constructor rejects invalid column counts', () => {
  assert.throws(() => new DancingLinksMatrix(0), TypeError);
  assert.throws(() => new DancingLinksMatrix(-1), TypeError);
  assert.throws(() => new DancingLinksMatrix(2.5), TypeError);
  assert.throws(() => new DancingLinksMatrix('x'), TypeError);
});

test('addRow links the node vertically into its column', () => {
  const m = new DancingLinksMatrix(3);
  m.addRow([0, 2]);
  const col0 = m.columns[0];
  assert.equal(col0.size, 1);
  const n = col0.down;
  assert.equal(n.row, 0);
  assert.equal(n.up, col0);
  assert.equal(n.down, col0);
  assert.equal(n.column, col0);
});

test('addRow links multiple rows in the same column as a vertical list', () => {
  const m = new DancingLinksMatrix(3);
  m.addRow([0]);
  m.addRow([0, 1]);
  m.addRow([0]);
  const col0 = m.columns[0];
  assert.equal(col0.size, 3);
  const first = col0.down;
  const second = first.down;
  const third = second.down;
  assert.equal(first.row, 0);
  assert.equal(second.row, 1);
  assert.equal(third.row, 2);
  assert.equal(third.down, col0);
});

test('addRow links nodes horizontally in a circular list', () => {
  const m = new DancingLinksMatrix(5);
  m.addRow([1, 3, 4]);
  const col1 = m.columns[1];
  const n = col1.down;
  const right = n.right;
  const farRight = right.right;
  assert.equal(right.column.index, 3);
  assert.equal(farRight.column.index, 4);
  assert.equal(farRight.right, n);
});

test('addRow validates column indices', () => {
  const m = new DancingLinksMatrix(3);
  assert.throws(() => m.addRow([3]), RangeError);
  assert.throws(() => m.addRow([-1]), RangeError);
  assert.throws(() => m.addRow([1.5]), RangeError);
});

test('addRow rejects duplicate column indices in a row', () => {
  const m = new DancingLinksMatrix(5);
  assert.throws(() => m.addRow([1, 1, 2]), RangeError);
});

test('addRow allows an empty row (it contributes no ones)', () => {
  const m = new DancingLinksMatrix(3);
  const r = m.addRow([]);
  assert.equal(r, 0);
  assert.equal(m.numRows, 1);
  for (const col of m.columns) {
    assert.equal(col.size, 0);
  }
});

test('cover removes the column from the header list and decrements sizes', () => {
  const m = buildSudokuLikeMatrix();
  const col0 = m.columns[0];
  assert.equal(col0.size, 2);
  m.cover(col0);
  assert.equal(m.root.right.index, 1);
  assert.equal(m.columns[3].size, 1);
  assert.equal(m.columns[6].size, 1);
});

test('uncover restores the exact prior state', () => {
  const m = buildSudokuLikeMatrix();
  const col0 = m.columns[0];
  const size0Before = col0.size;
  const size3Before = m.columns[3].size;
  const size6Before = m.columns[6].size;
  m.cover(col0);
  m.uncover(col0);
  assert.equal(col0.size, size0Before);
  assert.equal(m.columns[3].size, size3Before);
  assert.equal(m.columns[6].size, size6Before);
  assert.equal(m.root.right, col0);
});

test('cover and uncover compose: deep sequence restores sizes', () => {
  const m = buildSudokuLikeMatrix();
  const originalSizes = m.columns.map(c => c.size);
  m.cover(m.columns[0]);
  m.cover(m.columns[1]);
  m.uncover(m.columns[1]);
  m.uncover(m.columns[0]);
  const restoredSizes = m.columns.map(c => c.size);
  assert.deepEqual(restoredSizes, originalSizes);
});

test('chooseColumn returns null when matrix is empty (all columns covered)', () => {
  const m = new DancingLinksMatrix(2);
  m.cover(m.columns[0]);
  m.cover(m.columns[1]);
  assert.equal(m.isEmpty(), true);
  assert.equal(m.chooseColumn(), null);
});

test('chooseColumn returns the column with the fewest rows', () => {
  const m = buildSudokuLikeMatrix();
  const chosen = m.chooseColumn();
  assert.ok(chosen);
  assert.equal(chosen.size, 1);
});

test('chooseColumn returns a zero-size column immediately (dead branch)', () => {
  const m = buildSudokuLikeMatrix();
  m.cover(m.columns[0]);
  m.cover(m.columns[1]);
  const chosen = m.chooseColumn();
  assert.ok(chosen);
  assert.equal(chosen.size, 0);
});

test('rowsInColumn yields nodes in vertical order', () => {
  const m = new DancingLinksMatrix(3);
  m.addRow([0]);
  m.addRow([0, 1]);
  m.addRow([0]);
  const rows = [];
  for (const n of m.rowsInColumn(m.columns[0])) {
    rows.push(n.row);
  }
  assert.deepEqual(rows, [0, 1, 2]);
});

test('columnIndicesInRow yields all columns of the node row', () => {
  const m = new DancingLinksMatrix(5);
  m.addRow([2, 0, 4]);
  const node = m.columns[2].down;
  const cols = [];
  for (const c of m.columnIndicesInRow(node)) {
    cols.push(c);
  }
  assert.deepEqual(cols, [2, 0, 4]);
});

test('full exact-cover search finds the expected solution', () => {
  const m = new DancingLinksMatrix(7);
  m.addRow([0, 3, 6]); // row 0
  m.addRow([1, 4]);    // row 1
  m.addRow([2, 5]);    // row 2
  m.addRow([0, 2]);    // row 3
  m.addRow([1, 6]);    // row 4
  m.addRow([3, 5]);    // row 5

  const solutions = [];
  function search(accumulator) {
    const col = m.chooseColumn();
    if (col === null) {
      solutions.push([...accumulator].sort((a, b) => a - b));
      return;
    }
    for (const rowNode of m.rowsInColumn(col)) {
      accumulator.push(rowNode.row);
      const covered = [];
      for (const ci of m.columnIndicesInRow(rowNode)) {
        const c = m.columns[ci];
        m.cover(c);
        covered.push(c);
      }
      search(accumulator);
      for (let i = covered.length - 1; i >= 0; i--) {
        m.uncover(covered[i]);
      }
      accumulator.pop();
    }
  }
  search([]);
  assert.deepEqual(solutions, [[0, 1, 2]]);
});

test('cover and uncover are reversible across a multi-level search', () => {
  const m = new DancingLinksMatrix(7);
  m.addRow([0, 3, 6]);
  m.addRow([1, 4]);
  m.addRow([2, 5]);
  m.addRow([0, 2]);
  m.addRow([1, 6]);
  m.addRow([3, 5]);

  const beforeSizes = m.columns.map(c => c.size);
  const accumulator = [];
  function probe() {
    const col = m.chooseColumn();
    if (col === null) {
      return;
    }
    for (const rowNode of m.rowsInColumn(col)) {
      accumulator.push(rowNode.row);
      const covered = [];
      for (const ci of m.columnIndicesInRow(rowNode)) {
        const c = m.columns[ci];
        m.cover(c);
        covered.push(c);
      }
      probe();
      for (let i = covered.length - 1; i >= 0; i--) {
        m.uncover(covered[i]);
      }
      accumulator.pop();
    }
  }
  probe();
  const afterSizes = m.columns.map(c => c.size);
  assert.deepEqual(afterSizes, beforeSizes);
});
