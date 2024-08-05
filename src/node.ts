import type { CompileState } from './compiler';

export type ParamNode<T> = [
  store: T | null,
  child: Node<T> | null
];

export type Node<T> = [
  store: T | null,
  wildcardStore: T | null,

  params: ParamNode<T> | null,
  children: Record<number, Node<T>> | null,

  part: string
];

// eslint-disable-next-line
export function node_attach_param<T>(node: Node<T>): ParamNode<T> {
  // eslint-disable-next-line
  return node[2] ??= [null, null] as ParamNode<T>;
}

// eslint-disable-next-line
export function node_init<T>(part: string): Node<T> {
  return [null, null, null, null, part];
}

// eslint-disable-next-line
export function node_init_root<T>(): Node<T> {
  return [null, null, null, null, '/'];
}

// eslint-disable-next-line
export function node_slice_part_from<T>(node: Node<T>, idx: number): Node<T> {
  return [node[0], node[1], node[2], node[3], node[4].substring(idx)];
}

// eslint-disable-next-line
export function node_split_from<T>(node: Node<T>, idx: number) {
  const nextNode = node_slice_part_from(node, idx);
  node_reset(node, node[4].substring(0, idx));
  node_add_child_force(node, nextNode);
}

// eslint-disable-next-line
export function node_add_child_force<T>(node: Node<T>, child: Node<T>): void {
  (node[3] ??= {})[child[4].charCodeAt(0)] = child;
}

// eslint-disable-next-line
export function node_reset<T>(node: Node<T>, newPart: string): void {
  node[0] = node[1] = node[2] = node[3] = null;
  node[4] = newPart;
}

// eslint-disable-next-line
export function node_insert<T>(node: Node<T>, path: string, store: T): T {
  const pathLen = path.length;

  const hasEndParam = path.charCodeAt(pathLen - 1) === 42;
  const isWildcard = hasEndParam && path.charCodeAt(pathLen - 2) === 42;

  // Split path by param separator
  const parts = (
    hasEndParam
      ? path.substring(0, pathLen - (isWildcard ? 2 : 1))
      : path
  ).split('*');

  for (let i = 0, { length } = parts; i < length; ++i) {
    // Set param node
    if (i !== 0) {
      const params = node_attach_param(node);

      if (params[1] === null) {
        node = params[1] = node_init<T>(parts[i]);
        continue;
      }

      node = params[1];
    }

    for (let j = 0, pathPart = parts[i]; ; ++j) {
      if (j === pathPart.length) {
        if (j < node[4].length) {
          const nextNode = node_slice_part_from(node, j);
          node_reset(node, pathPart);
          node_add_child_force(node, nextNode);
        }

        break;
      }

      // Add static child
      if (j === node[4].length) {
        if (node[3] === null) node[3] = {};
        else {
          const nextNode = node[3][pathPart.charCodeAt(j)];

          // Re-run loop with existing static node
          if (typeof nextNode !== 'undefined') {
            node = nextNode;
            pathPart = pathPart.substring(j);
            j = 0;
            continue;
          }
        }

        // Create and add new node
        const nextNode = node_init<T>(pathPart.substring(j));
        node_add_child_force(node, nextNode);
        node = nextNode;

        break;
      }

      // Split the node if the two paths don't match
      if (pathPart[j] !== node[4][j]) {
        const nextNode = node_init<T>(pathPart.substring(j));
        node_split_from(node, j);
        node_add_child_force(node, nextNode);

        node = nextNode;
        break;
      }
    }
  }

  if (isWildcard)
    // eslint-disable-next-line
    return node[1] ??= store;

  else if (hasEndParam)
    // eslint-disable-next-line
    return node_attach_param(node)[0] ??= store;

  else
    // eslint-disable-next-line
    return node[0] ??= store;
}

// Node merging
// eslint-disable-next-line
export function node_merge<T>(target: Node<T>, source: Node<T>): void {
  if (target[4] === source[4])
    // Two parts are the same
    node_merge_properties(target, source);
  else {
    const targetPart = target[4];
    const sourcePart = source[4];

    const targetLen = targetPart.length;
    const sourceLen = sourcePart.length;

    // Slightly faster branching
    if (targetLen === sourceLen) {
      for (let i = 0; i < targetLen; ++i) {
        // Two parts are different
        if (targetPart[i] !== sourcePart[i]) {
          node_split_from(target, i);
          node_add_child_force(target, node_slice_part_from(source, i));
          break;
        }
      }
    } else {
      for (let i = 0; ; ++i) {
        if (i === targetLen)
          // Target part ends first
          node_add_child_safe(target, node_slice_part_from(source, i));
        if (i === sourceLen) {
          // Source part ends first
          const newTargetPart = node_slice_part_from(target, i);

          node_reset(target, targetPart.substring(0, i));
          node_merge_properties(target, source);

          // Set the newTargetPart as children
          node_add_child_safe(target, newTargetPart);
        } else if (targetPart[i] !== sourcePart[i]) {
          // Two parts are different
          node_split_from(target, i);
          node_add_child_force(target, node_slice_part_from(source, i));
        } else
          continue;

        break;
      }
    }
  }
}

// eslint-disable-next-line
export function node_add_child_safe<T>(parent: Node<T>, child: Node<T>): void {
  const code = child[4].charCodeAt(0);

  if (parent[3] === null)
    (parent[3] = {} as Record<number, Node<T>>)[code] = child;
  else {
    const children = parent[3];

    if (typeof children[code] === 'undefined')
      children[code] = child;
    else
      node_merge(children[code], child);
  }
}

// eslint-disable-next-line
export function node_merge_properties<T>(target: Node<T>, source: Node<T>): void {
  // Overwrite store
  if (source[0] !== null) target[0] = source[0];

  // Merge static children
  if (source[3] !== null) {
    if (target[3] === null) target[3] = source[3];
    else {
      const targetChildren = target[3];
      const sourceChildren = source[3];

      for (const id in sourceChildren) {
        if (typeof targetChildren[id] === 'undefined')
          targetChildren[id] = sourceChildren[id];
        else
          node_merge(targetChildren[id], sourceChildren[id]);
      }
    }
  }

  // Merge parameters
  if (source[2] !== null) {
    if (target[2] === null) target[2] = source[2];
    else {
      const targetParam = target[2];
      const sourceParam = source[2];

      // Overwrite store
      if (sourceParam[0] !== null) targetParam[0] = sourceParam[0];

      // Check children
      if (sourceParam[1] !== null) {
        if (targetParam[1] === null)
          targetParam[1] = sourceParam[1];
        else
          node_merge(targetParam[1], sourceParam[1]);
      }
    }
  }

  // Merge wildcard
  if (source[1] !== null) source[0] = source[1];
}

// p is the path (argument)
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
  if (nodeStore !== null) {
    builder.push(`if(l===${pathLenPrefix}${pathLenNum}){`);
    compileCallback(nodeStore, state, true);
    builder.push('}');
  }

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
    if (paramHasStore) {
      builder.push(`if(${paramHasInert ? 'i' : nextSlashIdx}===-1){a.push(p.slice(${prevIndex}));`);
      // eslint-disable-next-line
      compileCallback(params[0]!, state, true);
      builder.push('}');
    }

    if (paramHasInert) {
      builder.push(`if(${paramHasStore ? '' : 'i!==-1&&'}i!==${prevIndex}){a.push(p.substring(${prevIndex},i));`);

      node_compile(
        // Skip the '/' (i + 1)
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
    builder.push(`a.push(p.slice(${pathLenPrefix}${pathLenNum}));`);
    compileCallback(node[1], state, true);

    // Close bracket for the previous if
    if (noStore) builder.push('}');
  }

  // Close bracket
  if (isNotRoot)
    builder.push('}');
}

