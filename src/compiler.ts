export type AddValueCallback = (value: any) => string;
export type DefineCallback = (literal: string) => string;
export type CompileCallback<T> = (item: T, state: CompileState<T>, hasParam: boolean) => void;

export type CompileState<T> = [
  builder: string[],
  define: (literal: string) => string,
  addValue: AddValueCallback,
  compile: CompileCallback<T>
];

// eslint-disable-next-line
export function compile_state_init<T>(cb: CompileCallback<T>, keys: string[], values: any[], decls: string[]): CompileState<T> {
  return [
    [],
    (literal: string) => {
      // eslint-disable-next-line
      const key = '_' + decls.length;
      decls.push(`const ${key}=${literal};`);
      return key;
    },
    (val: any) => {
      const id = `f${keys.length}`;
      keys.push(id);
      values.push(val);
      return id;
    },
    cb
  ];
}

// eslint-disable-next-line
export function compile_state_result<T>(state: CompileState<T>): string {
  return state[0].join('');
}
