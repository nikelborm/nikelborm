import { Octokit } from '@octokit/core';
import { parseLinkHeader } from './parseLinkHeader.js';
import { IRepo } from './repo.interface.js';


type Enumerate<
  SourceTuple extends unknown[],
  ResultEntriesTuple extends [number, unknown][] = []
> =
// ResultEntriesTuple['length'] extends 10 ? never :
  ResultEntriesTuple['length'] extends SourceTuple['length']
    ? ResultEntriesTuple
    : Enumerate<SourceTuple, [
      ...ResultEntriesTuple,
      [ResultEntriesTuple['length'], SourceTuple[ResultEntriesTuple['length']]]
    ]>;

type BundleBack<
  UnionOfEntries extends [number, unknown],
  ResultTuple extends unknown[] = []
> =
  [UnionOfEntries] extends [never]
    ? ResultTuple
    : BundleBack<
      Exclude<UnionOfEntries, [ResultTuple['length'], unknown]>,
      [
        ...ResultTuple,
        Extract<UnionOfEntries, [ResultTuple['length'], unknown]>[1]
      ]
    >;

export type Prettify<T> = { [P in keyof T]: T[P] } & {};

// TODO: respond to https://github.com/Microsoft/TypeScript/issues/26223#issuecomment-410847836 when I finish this

// TODO: implement "pop" | "push" | "concat" | "join" | "reverse" | "shift"
// | "slice" | "sort" | "splice" | "unshift" | "indexOf" | "lastIndexOf" |
// "every" | "some" | "forEach" | "filter" | "reduce" | "reduceRight" |
// "find" | "findIndex" | "fill" | "copyWithin" | "entries" | "keys" |
// "values" | "includes" | "flatMap" | "flat" | "at" | "findLast" |
// "findLastIndex" | "toReversed" | "toSorted" | "toSpliced" | "with"


// The list above inspired by type of asds
// `declare const asds: Prettify<Exclude<keyof [], 'map'>>;`

function asdd<G extends  [Promise<unknown>, Promise<unknown>] | [Promise<unknown>, Promise<unknown>, Promise<unknown>]>(p: G) {

  type asd = G extends any ? Enumerate<G> : never
  return [] as unknown as asd;
}

const tests = asdd([Promise.resolve('asd'), Promise.resolve(123)]);

class BetterTuple<
  const Tuple extends unknown[],
  // Enumeration extends Enumerate<Tuple> = Enumerate<Tuple>
> {
  constructor(private readonly source: Tuple) {}

  map<U extends [number, unknown]>(
    callbackfn: (
      valueWithIndex: Tuple extends any
        ? Enumerate<Tuple> extends infer T extends unknown[]
          ? T[number]
          : never
        : never,
      array: Tuple
    ) => U
  ) {
    const returns = []
    for (let index = 0; index < this.source.length; index++) {
      returns.push(
        callbackfn(
          [index, this.source[index]] as any,
          this.source
        )
      );
    }
    return new BetterTuple(returns as BundleBack<U>);
  }

  unwrap() {
    return this.source
  }

  get length() {
    return this.source.length as Tuple['length']
  }
}

raceAsyncIterator([
  Promise.resolve(234 as const),
  Promise.resolve(23444 as const)
]);





export function raceAsyncIterator<
  TU extends  Array<Promise<unknown>> | [Promise<unknown>]
>(promises: TU) {
  const asd = (new BetterTuple(promises))
    .map(<
      T extends [number, Promise<unknown>]
    >([index, value]: T) => [
      index,
      (async () => [index, await value])(),
    ] as (T extends [infer I extends number, Promise<infer V>]
      ? [I, Promise<[I, V]>]
      : never
    ))
    .unwrap();

  // const Promise.race

  return asd;

}
