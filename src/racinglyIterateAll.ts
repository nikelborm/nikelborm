export async function* racinglyIterateAll<
  U extends Array<Promise<unknown>> | [Promise<unknown>]
>(promises: U, failLate?: boolean) {
  const mapOfIndexToNotYetYieldedRacer = new Map(
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

  const errors: RacingIterationError[] = [];

  while (mapOfIndexToNotYetYieldedRacer.size > 0) {
    const racer = await Promise.race(mapOfIndexToNotYetYieldedRacer.values());

    if (racer.status === 'error') {
      const racingIterationError = new RacingIterationError(
        racer.index,
        racer.error
      );
      if (failLate) {
        errors.push(racingIterationError);
      } else {
        for (const key of mapOfIndexToNotYetYieldedRacer.keys()) {
          // call according signal.abort()
          mapOfIndexToNotYetYieldedRacer.delete(key);
        };
        throw racingIterationError;
      }
    } else {
      mapOfIndexToNotYetYieldedRacer.delete(racer.index);
      yield {
        index: racer.index,
        result: racer.result,
      };
    }
  }

  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new RacingIterationAggregateError(errors);
}

class RacingIterationAggregateError extends Error {
  constructor(public readonly errors?: RacingIterationError[]) {
    super("Few of the racing promises failed");
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
