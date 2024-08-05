import type { CompileState } from './compiler';
import { type tree_compile, tree_init, tree_register, type Tree } from './tree';

export type MethodTrees<T> = [Record<string, Tree<T>> | null, Tree<T> | null];

// eslint-disable-next-line
export function method_trees_init<T>(): MethodTrees<T> {
  return [null, null];
}

// eslint-disable-next-line
export function method_trees_register<T>(trees: MethodTrees<T>, method: string, path: string, store: T): void {
  tree_register((trees[0] ??= {})[method] ??= tree_init<T>(), path, store);
}

// eslint-disable-next-line
export function method_trees_register_all<T>(trees: MethodTrees<T>, path: string, store: T): void {
  tree_register(trees[1] ??= tree_init<T>(), path, store);
}

// p is the path
// a is the params
// l is the path length
// m is the method (argument)
// eslint-disable-next-line
export function method_trees_compile<T>(trees: MethodTrees<T>, state: CompileState<T>, compileTree: typeof tree_compile): void {
  const builder = state[0];

  if (trees[0] === null) {
    if (trees[1] !== null)
      compileTree(trees[1], state);
  } else {
    const entries = Object.entries(trees[0]);

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

    // Handle other methods
    if (trees[1] !== null) {
      builder.push('else{');
      compileTree(trees[1], state);
      builder.push('}');
    }
  }
}
