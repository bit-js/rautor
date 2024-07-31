export type AddValueCallback = (value: any) => string;
export type DefineCallback = (literal: string) => string;
export type CompileCallback<T> = (item: T, state: CompileState<T>, hasParam: boolean) => void;

export type CompileState<T> = [
  builder: string[],
  compile: CompileCallback<T>,
  addValue: AddValueCallback,
  delcs: string[],
  declsCount: number
];

// eslint-disable-next-line
export function compile_state_init<T>(cb: CompileCallback<T>, keys: string[], values: any[]): CompileState<T> {
  return [
    [],
    cb,
    (val: any) => {
      // eslint-disable-next-line
      const id = 'f' + keys.length;
      keys.push(id);
      values.push(val);
      return id;
    },
    [],
    0
  ];
}

// eslint-disable-next-line
export function compile_state_result<T>(state: CompileState<T>): string {
  return state[0].join('');
}

// eslint-disable-next-line
export function compile_state_decls<T>(state: CompileState<T>): string {
  return state[3].join('');
}
