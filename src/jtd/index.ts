import type { RootJTDSchema } from './types';

export function jtd<T extends RootJTDSchema>(schema: T): T {
  return schema;
}
