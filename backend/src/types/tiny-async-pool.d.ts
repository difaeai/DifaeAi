declare module 'tiny-async-pool' {
  export default function asyncPool<T, R>(
    concurrency: number,
    iterable: Iterable<T>,
    iteratorFn: (item: T, index?: number) => Promise<R>
  ): Promise<R[]>;
}
