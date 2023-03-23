export type MutationCallbacks<T extends (...args: any) => any> =
  Parameters<T>[0];
