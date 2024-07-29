import type { CompileState } from './compiler';
import { type tree_compile, tree_init, tree_register, type Tree } from './tree';

export type MethodTrees<T> = Record<string, Tree<T>>;

// eslint-disable-next-line
export function method_trees_init<T>(): MethodTrees<T> {
  return {};
}

// eslint-disable-next-line
export function method_trees_register<T>(trees: MethodTrees<T>, method: string, path: string, store: T) {
  tree_register(trees[method] ??= tree_init<T>(), path, store);
}

// p is the path
// a is the params
// l is the path length
// m is the method
// eslint-disable-next-line
export function method_trees_compile<T>(trees: MethodTrees<T>, state: CompileState<T>, compileTree: typeof tree_compile): void {
  const builder = state[0];
  const entries = Object.entries(trees);

  // First entry should check with 'if'
  const firstEntry = entries[0];
  builder.push(`if(m==='${firstEntry[0]}'){`);
  compileTree(firstEntry[1], state);
  builder.push('}');

  // Others should check with 'else if'
  for (let i = 1, l = entries.length; i < l; ++i) {
    const entry = entries[i];
    builder.push(`else if(m==='${entry[0]}'){`);
    compileTree(entry[1], state);
    builder.push('}');
  }
}
