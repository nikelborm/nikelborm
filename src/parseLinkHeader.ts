import { Effect, Either, ParseResult, Schema } from 'effect';
import {
  Literal,
  NonEmptyTrimmedString,
  NumberFromString,
  optional,
  Record,
  Struct,
  URLFromSelf,
} from 'effect/Schema';
import parseLinkHeaderToObject from 'parse-link-header';

export const LinkHeaderSchema = Struct({
  ...getLinkFieldShapeObject('prev'),
  ...getLinkFieldShapeObject('next'),
  ...getLinkFieldShapeObject('last'),
  ...getLinkFieldShapeObject('first'),
});

export type ILinkHeader = (typeof LinkHeaderSchema)['Type'];

export const NumberFromString = Schema.transformOrFail(
  // Source schema: accepts any string
  Schema.String,
  // Target schema: expects a number
  Schema.Number,
  {
    // optional but you get better error messages from TypeScript
    strict: true,
    decode: (input, options, ast) => {



try {
  parseLinkHeaderToObject(input);
} catch (error) {
  return ParseResult.fail(
    // Create a Type Mismatch error
    new ParseResult.Type(
      // Provide the schema's abstract syntax tree for context
      ast,
      // Include the problematic input
      input,
      // Optional custom error message
      "Failed to convert string representation of link header to object"
    )
  )
}

const LinkSchema = Struct({
  url: NonEmptyTrimmedString,
  rel: NonEmptyTrimmedString,
}, {
  key: NonEmptyTrimmedString,
  value: NonEmptyTrimmedString
})

const LinksSchema = Record({
  key: NonEmptyTrimmedString,
  value: LinkSchema
})






      const parsed = parseFloat(input)
      // If parsing fails (NaN), return a ParseError with a custom error
      if (isNaN(parsed)) {
        return ParseResult.fail(
          // Create a Type Mismatch error
          new ParseResult.Type(
            // Provide the schema's abstract syntax tree for context
            ast,
            // Include the problematic input
            input,
            // Optional custom error message
            "Failed to convert string to number"
          )
        )
      }
      return ParseResult.succeed(parsed)
    },
    encode: (input, options, ast) => ParseResult.succeed(input.toString())
  }
)


export function parseLinkHeader(linkHeader: string | undefined | null) {

  try {
    Either.try({
      try
    })
    return LinkHeaderSchema.parse(parseLinkHeaderToObject(linkHeader));
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(
        (error as ZodError<z.infer<typeof LinkHeaderSchema>>).format(),
      );
    }
    throw new Error(
      `Failed to parse Link header of the response:\n"${linkHeader}"`,
      { cause: error },
    );
  }
}

function getLinkFieldShapeObject<const T extends string>(name: T) {
  const FieldSchema = Struct({
    per_page: NumberFromString,
    page: NumberFromString,
    rel: Literal(name),
    direction: Literal('asc', 'desc'),
    sort: Literal('updated', 'created'),
    url: Schema.URL,
  }).pipe(optional);

  return { [name]: FieldSchema } as { [k in T]: typeof FieldSchema };
}
