import { IRepo } from './repo.interface.js';
import { z } from 'zod';

export function renderRepoToMarkdownBadge(
  { owner, name }: IRepo,
  /**
   * [Available Themes](https://github.com/anuraghazra/github-readme-stats/blob/master/themes/README.md)
   */
  // theme: string
) {
  const repoPreviewSvgImageURL = new URL(
    'api/pin',
    'https://github-readme-stats.vercel.app',
  );

  repoPreviewSvgImageURL.search = '?' + new URLSearchParams({
    username: owner,
    repo: name,
    // tests
    // title_color: '008088',
    // text_color: '880800',
    // icon_color: '444000',
    // border_color: '202644',
    // bg_color: '202020',
    // serious
    title_color: 'af7aff',
    text_color: 'e4e4e4',
    icon_color: 'af7aff',
    bg_color: '010101',
  })

  // border color
  // var(--borderColor-default,var(--color-border-default,#30363d))

  const repoURL = `https://github.com/${owner}/${name}`;

  return `[![${name} repo](${repoPreviewSvgImageURL})](${repoURL})`;
}


const MarkdownRepoBadgeZodSchema = z.object({
  repoName: z.string().min(1),
  repoPreviewSvgImageURL: z.string().min(50).url(),
  repoURL: z.string().min(22).url()
}).strict().array()


export function extractReposFromMarkdown(markdownText: string) {
  const markdownRepoBadges = [
    ...markdownText.matchAll(
      /\[!\[(?<repoName>[^[\]()]+) repo\]\((?<repoPreviewSvgImageURL>https:\/\/github-readme-stats\.vercel\.app\/api\/pin[^[\]()]+)\)\]\((?<repoURL>[^[\]()]+)\)/g
    )
  ].map(({ groups }) => groups);

  return MarkdownRepoBadgeZodSchema.parse(markdownRepoBadges);
}
