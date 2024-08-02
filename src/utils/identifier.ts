export const regex = /[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*/u;

export function chainProperty(source: string, prop: string): string {
  return regex.test(prop) ? `${source}.${prop}` : `${source}[${JSON.stringify(prop)}]`;
}
