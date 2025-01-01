import { IRepo } from './repo.interface.js';

export function getPinsSortedByTheirProbablePopularity(fetchedReposWithPins: {
  repo: IRepo;
  pin: string;
}[]) {
  const aggParam = (agg: 'min' | 'max', param: 'star' | 'fork') =>
    Math[agg](...fetchedReposWithPins.map(_ => _.repo[`${param}Count`]))

  const maxStars = aggParam('max', 'star');
  const minStars = aggParam('min', 'star');
  const maxForks = aggParam('max', 'fork');
  const minForks = aggParam('min', 'fork');

  return fetchedReposWithPins
    .map(({ repo: r, pin }) => {
      const normalizedStarsFactor = (r.starCount - minStars) / (maxStars - minStars);
      const normalizedForksFactorWithAdjustedValue = (r.forkCount - minForks) / (maxForks - minForks) * 0.25;
      const publicityFactor = normalizedStarsFactor
        + normalizedForksFactorWithAdjustedValue;
      // publicityFactor: min=0, max=1.25
      // Five popularity classes
      // 0 ... 0.25, 0.25 ... 0.5, 0.5 ... 0.75, 0.75 ... 0.1, 1 ... 1.25;
      return {
        pin: pin,
        templateFactor: +r.isTemplate,
        boilerplateFactor: +r.name.includes('boiler'),
        archiveFactor: +r.isItArchived,
        hackathonFactor: +r.name.includes('hackathon'),
        experimentFactor: +r.name.includes('experiment'),
        pushRecencyFactor: Number(r.lastTimeBeenPushedInto),
        publicityClassFactor:
            publicityFactor > 1  ? 5 :
          publicityFactor > 0.75 ? 4 :
          publicityFactor > 0.5  ? 3 :
          publicityFactor > 0.25 ? 2 :
          1
      }
    })
    .sort((a, b) => {
      // `extends infer K` needed to run type distribution
      type Factor = keyof typeof a extends infer K ? K extends `${infer U}Factor` ? U : never : never;
      const smallestFirst = (f: Factor) => a[`${f}Factor`] - b[`${f}Factor`];
      const biggestFirst = (f: Factor) => -smallestFirst(f);
      let _: any;

      if (_ =  biggestFirst('template'      )) return _;
      if (_ =  biggestFirst('boilerplate'   )) return _;
      if (_ = smallestFirst('archive'       )) return _;
      if (_ = smallestFirst('hackathon'     )) return _;
      if (_ = smallestFirst('experiment'    )) return _;
      if (_ =  biggestFirst('publicityClass')) return _;
      if (_ =  biggestFirst('pushRecency'   )) return _; // if null goes to bottom

      return 0;
    })
    .map(_ => _.pin)
}
