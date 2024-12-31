import { IRepo } from './repo.interface.js';
import { z } from 'zod';
import { request } from 'undici';
import { writeFile } from 'node:fs/promises';

export async function renderRepoToMarkdownBadge(
  { owner, name }: IRepo,
  /**
   * [Available Themes](https://github.com/anuraghazra/github-readme-stats/blob/master/themes/README.md)
   */
  // theme: string
) {
  const sourceRepoPreviewSvgImageURL = new URL(
    'api/pin',
    'https://github-readme-stats.vercel.app',
  );

  sourceRepoPreviewSvgImageURL.search = '?' + new URLSearchParams({
    username: owner,
    repo: name,
    // description_lines_count: '3',

    // test theme
    // title_color: '008088',
    // text_color: '880800',
    // icon_color: '444000',
    // border_color: '202644',
    // bg_color: '202020',

    // nice black-purple theme
    // title_color: 'af7aff',
    // text_color: 'e4e4e4',
    // icon_color: 'af7aff',
    // bg_color: '010101',

    // native approximation theme
    title_color: 'f0f6fc',
    text_color: 'f0f6fc',
    icon_color: '238636', // I want it green
    bg_color: '00000000',
    hide_border: 'true',
  });

  console.log(`Started fetching ${sourceRepoPreviewSvgImageURL}`);
  const { statusCode, body } = await request(sourceRepoPreviewSvgImageURL)

  if (statusCode !== 200)
    throw new Error(`statusCode=${statusCode}: Failed to fetch repo image for ${sourceRepoPreviewSvgImageURL}`);

  const text = (await body.text())
    // .replaceAll('#008088', 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#880800', 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#444000', 'var(--button-star-iconColor)')
    // .replaceAll('#202644', 'var(--borderColor-default,var(--color-border-default,#30363d))')
    // .replaceAll('#202020', 'var(--bgColor-default, var(--color-canvas-default))')
    .replaceAll(/\s+/mg, ' ')
    .replaceAll('viewBox="0 0 400 150"', 'viewBox="24 27 376 123"');

  const fileName = `./images/${owner}_${name}.svg`;

  await writeFile(fileName, text);

  console.log(`Written file ${fileName} with transformed version of ${sourceRepoPreviewSvgImageURL}`);

  const repoURL = `https://github.com/${owner}/${name}`;

  const newRepoPreviewSvgImageURL = `https://raw.githubusercontent.com/${owner}/${owner}/refs/heads/main/${fileName}`

  // return `[![${name} repo](${sourceRepoPreviewSvgImageURL})](${repoURL})`;
  return `[![${name} repo](${newRepoPreviewSvgImageURL})](${repoURL})`;

  // return `<a href="${repoURL}">${text}</a>`
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
