export const paths = [
  '/',
  '/about',
  '/login',
  '/api',
  '/api/*',
  '/api/*/*',
  '/api/*/*/inspect',
  '/api/*/info',
  '/api/*/comment/*',
  '/api/*/comment/*/inspect',
  '/*',
  '/*/view',
  '/*/view/id',
  '/*/view/user',
  '/*/info',
  '/*/comment/*',
  '/*/comment/*/inspect',
  '/**',
  '/search/cats/**',
  '/search/names/**',
  '/search/*/comment/*',
  '/search/*/comment/user/*/**'
];

export const pathsCount = paths.length;

export function generatePath(pattern: string): string {
  return pattern.endsWith('**') ? `${pattern.slice(0, -2)}1/2` : pattern;
}
