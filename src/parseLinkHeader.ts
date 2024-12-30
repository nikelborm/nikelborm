import parseLinkHeaderToObject from 'parse-link-header';
import { ILinkHeader, LinkHeaderZodSchema } from './linkHeaderZodSchema.js';
import { ZodError } from 'zod';

export function parseLinkHeader(linkHeader: string | undefined | null) {
  try {
    return LinkHeaderZodSchema.parse(
      parseLinkHeaderToObject(linkHeader)
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.log((error as ZodError<ILinkHeader>).format());
    }
    throw new Error(
      `Failed to parse Link header of the response:\n"${linkHeader}"`,
      { cause: error }
    );
  }
}
