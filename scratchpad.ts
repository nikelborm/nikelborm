import { Console, Effect, Either, flow, ParseResult, Schema } from 'effect';
import { dir } from 'effect/Console';
import { flatMap, runSync, tap, tapError } from 'effect/Effect';
import {
  decodeUnknown,
  decodeUnknownEither,
  Literal,
  NonEmptyTrimmedString,
  NumberFromString,
  optional,
  Record,
  Struct,
  URL,
  URLFromSelf,
} from 'effect/Schema';
import parseLinkHeaderToObject from 'parse-link-header';

export const LogObjectPretty = (item: unknown) =>
  dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });

export const LogSuccessObjectPretty = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  tap(self, LogObjectPretty);

export const LogErrorObjectPretty = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  tapError(self, LogObjectPretty);

export const TapLogBoth = flow(LogSuccessObjectPretty, LogErrorObjectPretty);

export const logObjectPretty = (item: unknown) =>
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });

// =============================================================================

const LinkSchema = Struct(
  {
    url: Schema.URL,
    rel: NonEmptyTrimmedString,
  },
  {
    key: NonEmptyTrimmedString,
    value: NonEmptyTrimmedString,
  },
);

const LinksSchema = Record({
  key: NonEmptyTrimmedString,
  value: LinkSchema,
}).pipe(
  Schema.filter(
    s =>
      Object.entries(s).every(
        ([relAsKey, { rel: relAsValue }]) => relAsKey === relAsValue,
      ) || `Object should follow rule { [A: string]: { rel: B } } => A === B`,
  ),
);

const decodeLinks = decodeUnknown(LinksSchema);
runSync(
  decodeLinks({
    asd: {
      url: 'https://effec.com',
      rel: 'asd',
      asd: 'sadsdaasd',
    },
  }).pipe(TapLogBoth),
);

console.log(
  parseLinkHeaderToObject(
    '<https://api.example.com/issues?page=2>; rel="prev", <https://api.example.com/issues?page=4>; rel="next", <https://api.example.com/issues?page=10>; rel="last", <https://api.example.com/issues?page=1>; rel="first"',
  ),
);
