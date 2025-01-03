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
      throw racer.error;
    } else {
      map.delete(racer.index);
      yield racer.result;
    }
  }
}
