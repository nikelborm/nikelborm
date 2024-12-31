import { z } from "zod";

export const RepoZodSchema = z.object({
  name: z.string(),
  isItArchived: z.boolean(),
  isTemplate: z.boolean(),
  lastTimeBeenPushedInto: z.union([z.coerce.date(), z.null()]),
  owner: z.string()
}).strict();

export type IRepo = z.infer<typeof RepoZodSchema>;
