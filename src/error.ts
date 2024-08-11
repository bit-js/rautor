export type StaticError = [symbol: typeof errorSymbol, id: number];
export type ErrorPayload<Payload> = [...StaticError, payload: Payload];
export type GenericError = StaticError | ErrorPayload<unknown>;

let currentErrorId = 0;
export const errorSymbol: [] = [];

class ErrorType<Payload> {
  public readonly id: number;

  public constructor() {
    this.id = currentErrorId++;
  }

  public init(payload: Payload): ErrorPayload<Payload> {
    return [errorSymbol, this.id, payload];
  }
}

/**
 * Create an error type with no payload
 */
export function staticError(): StaticError {
  return [errorSymbol, currentErrorId++];
}

/**
 * Create an error type with payload
 */
export function dynamicError<Payload>(): ErrorType<Payload> {
  return new ErrorType();
}

/**
 * Check whether the object is an error object
 */
export function isError(x: unknown): x is GenericError {
  // @ts-expect-error Check the error symbol
  return x?.[0] === errorSymbol;
}
