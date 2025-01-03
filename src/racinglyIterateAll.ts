export async function* racinglyIterateAll<
  U extends Array<Promise<unknown>> | [Promise<unknown>]
>(promises: U) {
  let map = new Map(
    promises.map(
      (promise, index) => [
        index,
        (async () => {
          try {
            return {
              index,
              status: 'ok' as const,
              result: await promise as Awaited<U[number]>
            };
          } catch (error) {
            return {
              index,
              status: 'error' as const,
              error
            };
          }
        })()
      ]
    )
  );

  while (map.size > 0) {
    const racer = await Promise.race(map.values());

    if (racer.status === 'error') {
      for (const key of map.keys()) {
        map.delete(key);
      };
      throw new RacingIterationError(racer.index, racer.error);
    } else {
      map.delete(racer.index);
      yield {
        index: racer.index,
        result: racer.result,
      };
    }
  }
}

export class RacingIterationError extends Error {
  constructor(
    public readonly promiseIndex: number,
    public override readonly cause: unknown
  ) {
    super("One of the racing promises failed");
  }
}
