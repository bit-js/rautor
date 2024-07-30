import type { CompileCallback, CompileState } from './compiler';
import { method_trees_compile, method_trees_init, method_trees_register, method_trees_register_all, type MethodTrees } from './method-trees';
import { tree_compile, type Tree } from './tree';

export type RequestMatcher<T> = [
  methodTrees: MethodTrees<T>,
  compile: CompileCallback<T>
];

// eslint-disable-next-line
export function request_matcher_init<T>(compile: CompileCallback<T>): RequestMatcher<T> {
  return [method_trees_init(), compile];
}

// eslint-disable-next-line
export function request_matcher_register<T>(matcher: RequestMatcher<T>, method: string, path: string, store: T): void {
  method_trees_register(matcher[0], method, path, store);
}

// eslint-disable-next-line
export function request_matcher_register_all<T>(matcher: RequestMatcher<T>, path: string, store: T): void {
  method_trees_register_all(matcher[0], path, store);
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
export function request_matcher_compile<T>(matcher: RequestMatcher<T>, state: CompileState<T>): void {
  state[0].push('const m=r.method;');
  method_trees_compile(matcher[0], state, request_matcher_compile_tree);
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
export function node_request_matcher_compile<T>(matcher: RequestMatcher<T>, state: CompileState<T>): void {
  state[0].push('const m=r.method;');
  method_trees_compile(matcher[0], state, node_request_matcher_compile_tree);
}

