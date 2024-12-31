import { IRepo } from './repo.interface.js';
import { z } from 'zod';
import { request } from 'undici';
import { writeFile } from 'node:fs/promises';

export function renderMarkdownRepoBadges(allRepos: IRepo[]) {
  return Promise.all(allRepos.map(
    renderRepoToMarkdownBadge
  ));
}

export async function renderRepoToMarkdownBadge(
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
    title_color: '008088',
    text_color: '880800',
    icon_color: '444000',
    border_color: '202644',
    bg_color: '202020',
    // nice theme
    // title_color: 'af7aff',
    // text_color: 'e4e4e4',
    // icon_color: 'af7aff',
    // bg_color: '010101',
  });

  const { statusCode, body } = await request(repoPreviewSvgImageURL)

  if (statusCode !== 200)
    throw new Error(`failed to fetch repo image for ${repoPreviewSvgImageURL}`);

  const text = (await body.text())
    .replaceAll('008088', 'var(--fgColor-default, var(--color-fg-default))')
    .replaceAll('880800', 'var(--fgColor-default, var(--color-fg-default))')
    .replaceAll('444000', 'var(--button-star-iconColor)')
    .replaceAll('202644', 'var(--borderColor-default,var(--color-border-default,#30363d))')
    .replaceAll('202020', 'var(--bgColor-default, var(--color-canvas-default))')

  console.log(repoPreviewSvgImageURL, text);
  await writeFile(`./images/${owner}_${name}.svg`, text);

  const repoURL = `https://github.com/${owner}/${name}`;

  return `[![${name} repo](./images/${owner}_${name}.svg)](${repoURL})`;
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
