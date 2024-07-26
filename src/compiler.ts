import type { Node } from './node';
import type { Tree } from './tree';

export type Counter = [];

export type AddValueCallback = (value: any) => string;
export type CompileCallback<T> = (item: T, addValue: AddValueCallback) => string;

export type CompileState<T> = [
  builder: string[],
  compile: CompileCallback<T>,
  addValue: AddValueCallback
];

// p is the path
// a is the params
// l is the path length
// eslint-disable-next-line
export function node_compile<T>(
  node: Node<T>, state: CompileState<T>,

  // Store previous path
  pathLenNum: number,
  pathLenPrefix: string,

  // Whether an index tracker has been defined
  isChildParam: boolean,
  isNestedChildParam: boolean
): void {
  const builder = state[0];
  const compileCallback = state[1];
  const addValue = state[2];

  // Part stuff
  const part = node[4];
  const partLen = part.length;

  const isNotRoot = partLen !== 1;
  if (isNotRoot) {
    // Skip the first character since it has already
    // been checked by the previous iteration
    for (let i = 1; i < partLen; ++i) builder.push(`if(p.charCodeAt(${pathLenPrefix}${pathLenNum++})===${part.charCodeAt(i)})`);

    builder.push('{');
  }

  // Check the current node store
  const nodeStore = node[0];
  if (nodeStore !== null)
    builder.push(`if(l===${pathLenPrefix}${pathLenNum})return ${compileCallback(nodeStore, addValue)};`);

  // Check for children
  if (node[3] !== null) {
    const children = node[3];
    const childKeys = Object.keys(children);

    const newPathLenNum = pathLenNum + 1;

    if (childKeys.length === 1) {
      builder.push(`if(p.charCodeAt(${pathLenPrefix}${pathLenNum})===${childKeys[0]}){`);

      // @ts-expect-error key always exist
      // eslint-disable-next-line
      node_compile(children[childKeys[0]], state, newPathLenNum, pathLenPrefix, isChildParam, isNestedChildParam);

      builder.push('}');
    } else {
      builder.push(`switch(p.charCodeAt(${pathLenPrefix}${pathLenNum})){`);

      for (const key in children) {
        builder.push(`case ${key}:`);

        node_compile(children[key], state, newPathLenNum, pathLenPrefix, isChildParam, isNestedChildParam);

        builder.push('break;');
      }

      builder.push('}');
    }
  }

  // Check for params
  if (node[2] !== null) {
    const params = node[2];

    // Declare a variable to save previous param index
    // if current parameter is the second one
    if (isChildParam)
      builder.push(`${isNestedChildParam ? '' : 'let '}h=${pathLenPrefix}${pathLenNum};`);

    const paramHasStore = params[0] !== null;
    const paramHasInert = params[1] !== null;

    const prevIndex = isChildParam ? 'h' : pathLenPrefix + pathLenNum;
    const nextSlashIdx = `p.indexOf('/',${prevIndex})`;

    // Declare the current param index variable if inert is found
    if (!paramHasStore || paramHasInert)
      builder.push(`${isChildParam ? '' : 'let '}i=${nextSlashIdx};`);

    // Check slash index and get the parameter value if store is found
    if (paramHasStore)
      // eslint-disable-next-line
      builder.push(`if(${paramHasInert ? 'i' : nextSlashIdx}===-1){a.push(p.substring(${prevIndex}));return ${compileCallback(params[0]!, addValue)}}`);

    if (paramHasInert) {
      builder.push(`if(${paramHasStore ? '' : 'i!==-1&&'}i!==${prevIndex}){a.push(p.substring(${prevIndex},i));`);

      node_compile(
        // eslint-disable-next-line
        params[1]!, state, 1, 'i+',
        // eslint-disable-next-line
        // If this is the first parameter children this will be false
        true, isChildParam
      );

      builder.push('}');
    }
  }

  // Check for wildcard
  if (node[1] !== null) {
    const noStore = nodeStore === null;

    // Wildcard should not match static case
    if (noStore) builder.push(`if(l!==${pathLenPrefix}${pathLenNum}){`);

    // Add to params and return
    builder.push(`a.push(p.substring(${pathLenPrefix}${pathLenNum}));return ${compileCallback(node[1], addValue)};`);

    // Close bracket for the previous if
    if (noStore) builder.push('}');
  }

  // Close bracket
  if (isNotRoot)
    builder.push('}');
}

// eslint-disable-next-line
export function tree_compile<T>(tree: Tree<T>, compile: CompileCallback<T>): [CompileState<T>, keys: string[], values: any[]] {
  const keys: string[] = [];
  const values: any[] = [];

  const state: CompileState<T> = [
    [], compile, (val) => {
      const id = `f${keys.length}`;
      keys.push(id);
      values.push(val);
      return id;
    }
  ];

  // eslint-disable-next-line
  node_compile(tree[0]!, state, 1, '', false, false);
  return [state, keys, values];
}
