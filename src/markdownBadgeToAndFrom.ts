import { IRepo } from './repo.interface.js';
import { z } from 'zod';
import { request } from 'undici';
import { writeFile } from 'node:fs/promises';
import { outdent } from 'outdent';

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

    // native approximation dark theme (uses colors from CSS vars commented below)
    title_color: 'f0f6fc',
    text_color: 'f0f6fc',
    icon_color: '238636', // I want it green
    bg_color: '00000000',
    hide_border: 'true',
  });

  console.log(`Started fetching ${sourceRepoPreviewSvgImageURL}`);
  const { statusCode, body } = await request(sourceRepoPreviewSvgImageURL)

  if (statusCode == 200)
    console.log(`Fetched ${sourceRepoPreviewSvgImageURL}`);
  else throw new Error(
    `statusCode=${statusCode}: Failed to fetch repo image for ${sourceRepoPreviewSvgImageURL}`
  );

  const repoPreviewSvgImageDarkTheme = (await body.text())
    // .replaceAll('#008088', 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#880800', 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#444000', 'var(--button-star-iconColor)')
    // .replaceAll('#202644', 'var(--borderColor-default,var(--color-border-default,#30363d))')
    // .replaceAll('#202020', 'var(--bgColor-default, var(--color-canvas-default))')
    .replaceAll('height="150"', 'height="115"')
    .replaceAll('height="140"', 'height="105"')
    .replaceAll('height="120"', 'height="85"')
    .replaceAll('viewBox="0 0 400 150"', 'viewBox="24 27 385 100"')
    .replaceAll('viewBox="0 0 400 140"', 'viewBox="24 27 385 90"')
    .replaceAll('viewBox="0 0 400 120"', 'viewBox="24 27 385 70"')
    .replaceAll(/\s+/mg, ' ');

  const repoPreviewSvgImageLightTheme = repoPreviewSvgImageDarkTheme
    .replaceAll('#f0f6fc', '#1f2328');

  const imageFileNameDarkTheme = `./images/${owner}_${name}_dark_theme.svg`;
  const imageFileNameLightTheme = `./images/${owner}_${name}_light_theme.svg`;

  await Promise.all([
    writeFile(imageFileNameDarkTheme, repoPreviewSvgImageDarkTheme),
    writeFile(imageFileNameLightTheme, repoPreviewSvgImageLightTheme),
  ]);

  console.log(outdent`
    Written files:
    1. ${imageFileNameDarkTheme}
    2. ${imageFileNameLightTheme}
    Those files are transformed versions of ${sourceRepoPreviewSvgImageURL}
  `);

  const repoURL = `https://github.com/${owner}/${name}`;

  const prefixOfGitHubCDN = `https://raw.githubusercontent.com/${owner}/${owner}/refs/heads/main/`;

  const newRepoPreviewSvgDarkThemeImageURL = prefixOfGitHubCDN + imageFileNameDarkTheme;
  const newRepoPreviewSvgLightThemeImageURL = prefixOfGitHubCDN + imageFileNameLightTheme;

  // return `[![${name} repo](${sourceRepoPreviewSvgImageURL})](${repoURL})`;
  return outdent({ newline: '' })`
    [![${name} repo](${newRepoPreviewSvgDarkThemeImageURL})](${repoURL + '#gh-dark-mode-only'})
    [![${name} repo](${newRepoPreviewSvgLightThemeImageURL})](${repoURL + '#gh-light-mode-only'})
  `;

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
