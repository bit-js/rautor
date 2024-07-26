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
  node_add_child(node, nextNode);
}

// eslint-disable-next-line
export function node_add_child<T>(node: Node<T>, child: Node<T>): void {
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

      // eslint-disable-next-line
      node = params[1];
    }

    for (let j = 0, pathPart = parts[i]; ; ++j) {
      if (j === pathPart.length) {
        if (j < node[4].length) {
          const nextNode = node_slice_part_from(node, j);
          node_reset(node, pathPart);
          node_add_child(node, nextNode);
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
        node_add_child(node, nextNode);
        node = nextNode;

        break;
      }

      // Split the node if the two paths don't match
      if (pathPart[j] !== node[4][j]) {
        const nextNode = node_init<T>(pathPart.substring(j));
        node_split_from(node, j);
        node_add_child(node, nextNode);

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
