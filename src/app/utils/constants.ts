// eslint-disable-next-line
const AsyncFunction = async function () { }.constructor;

export function isAsync(fn: any): fn is (...args: any[]) => Promise<any> {
  return fn instanceof AsyncFunction;
}
