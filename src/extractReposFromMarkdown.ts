import { z } from 'zod';

const MarkdownRepoBadgeZodSchema = z.object({
  repo_name: z.string().min(1),
  repo_preview_picture_url: z.string().min(50).url(),
  repo_url: z.string().min(22).url()
}).strict().array()

export function extractReposFromMarkdown(markdownText: string) {
  const markdownRepoBadges = [
    ...markdownText.matchAll(
      /\[!\[(?<repo_name>[^[\]()]+) repo\]\((?<repo_preview_picture_url>https:\/\/github-readme-stats\.vercel\.app\/[^[\]()]+)\)\]\((?<repo_url>[^[\]()]+)\)/g
    )
  ].map(({ groups }) => groups);

  return MarkdownRepoBadgeZodSchema.parse(markdownRepoBadges);
}
