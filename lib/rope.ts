type MapBranch = {
  left?: MapRepresentation,
  right?: MapRepresentation,
  size: number,
  kind: 'branch'
}

type MapLeaf = {
  text: string,
  kind: 'leaf'
}

type MapRepresentation = MapBranch | MapLeaf

interface IRope {
  toString: () => string,
  size: () => number,
  height: () => number,
  toMap: () => MapRepresentation,
  isBalanced: () => Boolean
}

export class RopeLeaf implements IRope {
  text: string;

  constructor(text: string) {
    this.text = text;
  }

  toString(): string {
    return this.text
  }

  size() {
    return this.text.length;
  }

  height() {
    return 1;
  }

  toMap(): MapLeaf {
    return {
      text: this.text,
      kind: 'leaf'
    }
  }

  isBalanced() {
    return true;
  }
}

export class RopeBranch implements IRope {
  left: IRope;
  right: IRope;
  cachedSize: number;

  constructor(left: IRope, right: IRope) {
    this.left = left;
    this.right = right;
    // Unlike in wikipedia article, this contains the size of the whole tree, not just the left branch
    this.cachedSize = (left ? left.size() : 0) + (right ? right.size() : 0)
  }

  size() {
    return this.cachedSize;
  }

  // how deep the tree is (I.e. the maximum depth of children)
  height(): number {
    return 1 + Math.max(this.leftHeight(), this.rightHeight())
  }

  /*
    Whether the rope is balanced, i.e. whether any subtrees have branches
    which differ by more than one in height. 
  */
  isBalanced(): boolean {
    const leftBalanced = this.left ? this.left.isBalanced() : true
    const rightBalanced = this.right ? this.right.isBalanced() : true

    return leftBalanced && rightBalanced
      && Math.abs(this.leftHeight() - this.rightHeight()) < 2
  }

  leftHeight(): number {
    if (!this.left) return 0
    return this.left.height()
  }

  rightHeight(): number {
    if (!this.right) return 0
    return this.right.height()
  }

  // Helper method which converts the rope into an associative array
  // Only used for debugging, this has no functional purpose
  toMap(): MapBranch {
    const mapVersion: MapBranch = {
      size: this.size(),
      kind: 'branch'
    }
    if (this.right) mapVersion.right = this.right.toMap()
    if (this.left) mapVersion.left = this.left.toMap()
    return mapVersion
  }
  // Convert the whole tree to a plain string
  toString(): string {
    return (this.left ? this.left.toString() : '') + (this.right ? this.right.toString() : '')
  }
}

export function createRopeFromMap(map: MapRepresentation): IRope {
  if (map.kind == 'leaf') {
    return new RopeLeaf(map.text)
  }

  let left, right = null;
  if (map.left) left = createRopeFromMap(map.left)
  if (map.right) right = createRopeFromMap(map.right)
  return new RopeBranch(left, right);
}

// Split the rope at a position
function splitAt(rope: IRope, position: number): { left: IRope, right: IRope } {
    const map = rope.toMap();
    const list: MapRepresentation[] = [];

    const left = createRopeFromMap(splitHelper(map, position, list));
    const right = createRopeFromMap(concatenateMapList(list));

    return {left, right};
}

function splitHelper(map: MapRepresentation, position: number, list: MapRepresentation[]): MapRepresentation {
  if(map.kind === "leaf") {
    const leftLeafNode: MapLeaf = {
      text: map.text.substring(0, position + 1),
      kind: "leaf"
    }

    const rightLeafNode: MapLeaf = {
      text: map.text.substring(position+1),
      kind: "leaf"
    }

    const mapBranchNode: MapBranch = {
      left: leftLeafNode,
      size: leftLeafNode.text.length,
      kind: "branch"
    }
    list.push(rightLeafNode);

    return mapBranchNode;

  }

  const leftSize = getSize(map.left);

  if (leftSize === position + 1) {

    list.push(map.right);
    map.size = map.size - getSize(map.right);
    map.right = undefined;
    return map;
  } else if (leftSize > position + 1) {

    const leftSubtreeAns = splitHelper(map.left, position, list);
    map.left = leftSubtreeAns;
    list.push(map.right);
    map.size = getSize(map.left);
    map.right = undefined;
    return map;
  } else {
    const rightSubtreeAns = splitHelper(map.right, position - getSize(map.left), list);
    map.right = rightSubtreeAns;
    map.size = getSize(map.right);
    return map;
  }
}

// Returns the size of the map
function getSize(map: MapRepresentation): number {
  if(map.kind === "leaf") return map.text.length;

  return map.size;
}

function concatenateTwoMaps(map1: MapRepresentation, map2: MapRepresentation): MapRepresentation {
  const newBranch: MapRepresentation = {
    left: map1,
    right: map2,
    size: getSize(map1) + getSize(map2),
    kind: "branch"
  }

  return newBranch;

}

function concatenateMapList(list: MapRepresentation[]): MapRepresentation {
  let leftTree: MapRepresentation = list[0];
  for(let i = 1; i < list.length; i++) {
      leftTree = concatenateTwoMaps(leftTree, list[i]);
  }

  return leftTree;
}

export function insert(rope: IRope, text: string, location: number): IRope {
  const textRope = new RopeLeaf(text);

  if(location === 0) {
    return createRopeFromMap(concatenateTwoMaps(textRope.toMap(), rope.toMap()));
  }

  const {left, right} = splitAt(rope, location - 1);

  const list = [left.toMap(), textRope.toMap(), right.toMap()];
  const constructedMap = concatenateMapList(list);

  return createRopeFromMap(constructedMap);

}

export function deleteRange(rope: IRope, start: number, end: number): IRope {
  // TODO
}

export function rebalance(rope: IRope): IRope {
  // TODO
}
