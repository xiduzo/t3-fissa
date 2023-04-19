export type MutationCallbacks<T extends (...args: any) => any> =
  Parameters<T>[0];

 export enum RefetchInterval {
    Fast = 1000,
    Normal = 3000,
    Lazy = 10000,
  }
  