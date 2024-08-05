import type { CompileState } from './compiler';
import { method_trees_compile, type MethodTrees } from './method-trees';
import { tree_compile, type Tree } from './tree';

// p is the path
// a is the params
// l is the path length
// s is the path start
// e is the path end
// u is the full url
// m is the method
// r is the request object (argument)
// eslint-disable-next-line
export function request_matcher_compile_tree<T>(tree: Tree<T>, state: CompileState<T>): void {
  state[0].push("const u=r.url,s=u.indexOf('/',12),e=u.indexOf('?',s+1),p=e===-1?u.slice(s):u.substring(s,e);");
  tree_compile(tree, state);
}

// p is the path
// a is the params
// l is the path length
// s is the path start
// e is the path end
// u is the full url
// m is the method
// r is the request object (argument)
// eslint-disable-next-line
export function request_matcher_compile<T>(matcher: MethodTrees<T>, state: CompileState<T>): void {
  if (matcher[0] !== null)
    state[0].push('const m=r.method;');
  method_trees_compile(matcher, state, request_matcher_compile_tree);
}

// p is the path
// a is the params
// l is the path length
// e is the path end
// u is the full url
// r is the request object (argument)
// eslint-disable-next-line
export function node_request_matcher_compile_tree<T>(tree: Tree<T>, state: CompileState<T>): void {
  state[0].push("const u=r.url,e=u.indexOf('?',1),p=e===-1?u:u.substring(0,e);");
  tree_compile(tree, state);
}

// p is the path
// a is the params
// l is the path length
// e is the path end
// u is the full url
// m is the method
// r is the request object (argument)
// eslint-disable-next-line
export function node_request_matcher_compile<T>(matcher: MethodTrees<T>, state: CompileState<T>): void {
  if (matcher[0] !== null)
    state[0].push('const m=r.method;');
  method_trees_compile(matcher, state, node_request_matcher_compile_tree);
}

