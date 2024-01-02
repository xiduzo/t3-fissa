// TODO: use UseTRPCMutationOptions from trpc
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MutationCallbacks<T extends (...args: any[]) => unknown> = Parameters<T>[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryCallbacks<T extends (...args: any[]) => unknown> = Parameters<T>[1];

export enum RefetchInterval {
  Fast = 1000,
  Normal = 3000,
  Conservative = 5000,
  Lazy = 10000,
}
