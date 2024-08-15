export type StaticError = [typeof errorSymbol, number];
export type DynamicErrorInstance<T> = [typeof errorSymbol, number, T];
export type GenericError = StaticError | DynamicErrorInstance<any>;

export const errorSymbol = [];
let currentId = 0;

export class DynamicError<T> {
  public declare readonly payloadInfer: T;
  public readonly id: number;

  public constructor() {
    this.id = currentId++;
  }

  /**
   * Create an error instance with payload
   */
  public create(payload: T): DynamicErrorInstance<T> {
    return [errorSymbol, this.id, payload];
  }
}

/**
 * Create a static error type
 */
export function staticError(): StaticError {
  return [errorSymbol, currentId++];
}

/**
 * Create a dynamic error type
 */
export function dynamicError<T>(): DynamicError<T> {
  return new DynamicError<T>();
}

/**
 * Check whether a value is an error
 */
export function isError(err: any): err is GenericError {
  return Array.isArray(err) && err[0] === errorSymbol;
}
