const namedSizes = Object.freeze({
  xs: '.75em',
  sm: '1em',
  md: '1.25em',
  lg: '1.5em',
  xl: '2em',
});

export function resolveSize(size) {
  if (size === undefined || size === null || size === '') return undefined;
  if (typeof size === 'number') return `${size}px`;
  return namedSizes[size] ?? (/^\d+(?:\.\d+)?$/.test(size) ? `${size}px` : size);
}
