export default function serializeValue(value: any): any {
  switch (typeof value) {
    case 'object': return value === null
      ? null
      : value instanceof Map
        ? JSON.stringify(Object.fromEntries(value))
        : value instanceof Promise
          ? value.then(serializeValue)
          // eslint-disable-next-line
          : value.constructor === Object
            ? JSON.stringify(value)
            : value;
    case 'undefined': return null;
    // eslint-disable-next-line
    default: return '' + value;
  }
}
