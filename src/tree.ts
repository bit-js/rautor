import { node_init_root, node_insert, type Node } from './node';

export type Tree<T> = [
  root: Node<T> | null,
  staticMap: Record<string, T> | null
];

// eslint-disable-next-line
export function tree_init<T>(): Tree<T> {
  return [null, null];
}

// eslint-disable-next-line
export function tree_register<T>(tree: Tree<T>, path: string, store: T) {
  if (path.includes('*'))
    node_insert(tree[0] ??= node_init_root(), path, store);
  else
    (tree[1] ??= {})[path] = store;
}

