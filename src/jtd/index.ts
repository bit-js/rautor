import type { RootJTDSchema } from './types';

export default function jtd<T extends RootJTDSchema>(schema: T): T {
  return schema;
}
