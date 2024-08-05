import type { CompileState } from './compiler';
import { node_compile, node_init_root, node_insert, type Node } from './node';

export type Tree<T> = [
  root: Node<T> | null,
  staticMap: Record<string, T> | null
];

// eslint-disable-next-line
export function tree_init<T>(): Tree<T> {
  return [null, null];
}

// eslint-disable-next-line
export function tree_register<T>(tree: Tree<T>, path: string, store: T): void {
  if (path.includes('*'))
    node_insert(tree[0] ??= node_init_root(), path, store);
  else
    (tree[1] ??= {})[path] = store;
}

// p is the path (argument)
// a is the params
// l is the path length
// eslint-disable-next-line
export function tree_compile<T>(tree: Tree<T>, state: CompileState<T>): void {
  const builder = state[0];

  // Compile static entries
  if (tree[1] !== null) {
    const compileCallback = state[1];
    const entries = Object.entries(tree[1]);

    // First entry should check with 'if'
    const firstEntry = entries[0];
    builder.push(`if(p==='${firstEntry[0]}'){`);
    compileCallback(firstEntry[1], state, false);
    builder.push('}');

    // Others should check with 'else if'
    for (let i = 1, l = entries.length; i < l; ++i) {
      const entry = entries[i];
      builder.push(`else if(p==='${entry[0]}'){`);
      compileCallback(entry[1], state, false);
      builder.push('}');
    }
  }

  if (tree[0] !== null) {
    builder.push('const l=p.length,a=[];');
    node_compile(tree[0], state, 1, '', false, false);
  }
}

