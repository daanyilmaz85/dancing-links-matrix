export class Node {
  /** @type {Node|null} */ left;
  /** @type {Node|null} */ right;
  /** @type {Node|null} */ up;
  /** @type {Node|null} */ down;
  /** @type {ColumnHeader|null} */ column;
  /** @type {number} */ row;
  constructor() {
    this.left = null;
    this.right = null;
    this.up = null;
    this.down = null;
    this.column = null;
    this.row = -1;
  }
}

export class ColumnHeader extends Node {
  /** @type {number} */ size;
  /** @type {number} */ index;
  constructor(index) {
    super();
    this.size = 0;
    this.index = index;
  }
}

export class DancingLinksMatrix {
  constructor(numCols) {
    if (!Number.isInteger(numCols) || numCols <= 0) {
      throw new TypeError('numCols must be a positive integer');
    }
    this.numCols = numCols;
    this.root = new ColumnHeader(-1);
    this.root.left = this.root;
    this.root.right = this.root;
    this.root.up = this.root;
    this.root.down = this.root;
    this.root.column = this.root;

    this.columns = [];
    let prev = this.root;
    for (let i = 0; i < numCols; i++) {
      const col = new ColumnHeader(i);
      col.left = prev;
      col.right = this.root;
      col.up = col;
      col.down = col;
      col.column = col;
      prev.right = col;
      this.root.left = col;
      prev = col;
      this.columns.push(col);
    }
    this.numRows = 0;
  }

  addRow(ones) {
    if (!Array.isArray(ones)) {
      throw new TypeError('ones must be an array of integers');
    }
    for (const c of ones) {
      if (!Number.isInteger(c) || c < 0 || c >= this.numCols) {
        throw new RangeError(`column index ${c} out of range [0, ${this.numCols})`);
      }
    }
    const seen = new Set();
    for (const c of ones) {
      if (seen.has(c)) {
        throw new RangeError(`duplicate column index ${c} in row`);
      }
      seen.add(c);
    }
    const rowIndex = this.numRows;
    this.numRows++;

    if (ones.length === 0) {
      return rowIndex;
    }

    const nodes = [];
    for (const c of ones) {
      const col = this.columns[c];
      const node = new Node();
      node.row = rowIndex;
      node.column = col;
      nodes.push(node);
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const left = nodes[(i - 1 + nodes.length) % nodes.length];
      const right = nodes[(i + 1) % nodes.length];
      n.left = left;
      n.right = right;
    }

    for (const n of nodes) {
      const col = n.column;
      n.down = col;
      n.up = col.up;
      col.up.down = n;
      col.up = n;
      col.size++;
    }

    return rowIndex;
  }

  cover(col) {
    if (!(col instanceof ColumnHeader)) {
      throw new TypeError('cover expects a ColumnHeader');
    }
    const r = this.root;
    col.right.left = col.left;
    col.left.right = col.right;

    let i = col.down;
    while (i !== col) {
      let j = i.right;
      while (j !== i) {
        j.down.up = j.up;
        j.up.down = j.down;
        j.column.size--;
        j = j.right;
      }
      i = i.down;
    }
  }

  uncover(col) {
    if (!(col instanceof ColumnHeader)) {
      throw new TypeError('uncover expects a ColumnHeader');
    }
    let i = col.up;
    while (i !== col) {
      let j = i.left;
      while (j !== i) {
        j.column.size++;
        j.down.up = j;
        j.up.down = j;
        j = j.left;
      }
      i = i.up;
    }
    col.right.left = col;
    col.left.right = col;
  }

  chooseColumn() {
    const root = this.root;
    if (root.right === root) {
      return null;
    }
    let best = null;
    let bestSize = Infinity;
    let c = root.right;
    while (c !== root) {
      if (c.size < bestSize) {
        best = c;
        bestSize = c.size;
        if (bestSize === 0) {
          return best;
        }
      }
      c = c.right;
    }
    return best;
  }

  isEmpty() {
    return this.root.right === this.root;
  }

  *rowsInColumn(col) {
    if (!(col instanceof ColumnHeader)) {
      throw new TypeError('rowsInColumn expects a ColumnHeader');
    }
    let node = col.down;
    while (node !== col) {
      yield node;
      node = node.down;
    }
  }

  *columnIndicesInRow(node) {
    if (!node || !node.column) {
      throw new TypeError('columnIndicesInRow expects a matrix Node');
    }
    yield node.column.index;
    let j = node.right;
    while (j !== node) {
      yield j.column.index;
      j = j.right;
    }
  }
}
