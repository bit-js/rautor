export const identifierRegex = /[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*/u;

export function chainProperty(source: string, prop: string): string {
  return identifierRegex.test(prop) ? `${source}.${prop}` : `${source}[${JSON.stringify(prop)}]`;
}
