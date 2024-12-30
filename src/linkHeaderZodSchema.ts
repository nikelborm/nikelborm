import { z } from 'zod';

const getLinkFieldShapeObject = <const T extends string>(name: T) => {
  const FieldSchema = z.object({
    per_page: z.coerce.number(),
    page: z.coerce.number(),
    rel: z.literal(name),
    direction: z.enum(['asc', 'desc']),
    sort: z.enum(['updated', 'created']),
    url: z.string().url()
  }).strict().optional();
  return {[name]: FieldSchema} as { [k in T]: typeof FieldSchema }
};

export const LinkHeaderZodSchema = z.object( {
  ...getLinkFieldShapeObject('prev'),
  ...getLinkFieldShapeObject('next'),
  ...getLinkFieldShapeObject('last'),
  ...getLinkFieldShapeObject('first')
})

export type ILinkHeader = z.infer<typeof LinkHeaderZodSchema>;
