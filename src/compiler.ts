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
export function compile_state_init_with_add_value_cb<T>(cb: CompileCallback<T>, addValue: AddValueCallback): CompileState<T> {
  return [
    [],
    cb,
    addValue,
    [],
    0
  ];
}

// eslint-disable-next-line
export function compile_state_create_add_value_cb(keys: string[], values: any[]): AddValueCallback {
  return (val: any) => {
    // eslint-disable-next-line
    const id = 'f' + keys.length;
    keys.push(id);
    values.push(val);
    return id;
  };
}

// eslint-disable-next-line
export function compile_state_init<T>(cb: CompileCallback<T>, keys: string[], values: any[]): CompileState<T> {
  return compile_state_init_with_add_value_cb(cb, compile_state_create_add_value_cb(keys, values));
}

// eslint-disable-next-line
export function compile_state_derive<T>(state: CompileState<T>): CompileState<T> {
  return [[] as string[], state[1], state[2], state[3], state[4]];
}

// eslint-disable-next-line
export function compile_state_sync<T>(target: CompileState<T>, source: CompileState<T>): void {
  target[4] = source[4];
}

// eslint-disable-next-line
export function compile_state_result<T>(state: CompileState<T>): string {
  return state[0].join('');
}

// eslint-disable-next-line
export function compile_state_decls<T>(state: CompileState<T>): string {
  return state[3].join('');
}
