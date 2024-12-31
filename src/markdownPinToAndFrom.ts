import { IRepo } from './repo.interface.js';
import { z } from 'zod';
import { request } from 'undici';
import { writeFile } from 'node:fs/promises';
import { outdent } from 'outdent';

export async function renderRepoToMarkdownPin({ owner, name }: IRepo) {
  const {
    originalRepoPinSVG,
    originalRepoPinURL
  } = await fetchOriginalRepoPin({ owner, name });

  const repoPreviewSvgImageDarkTheme = originalRepoPinSVG
    // .replaceAll('#008088', /* title_color  */ 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#880800', /* text_color   */ 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#444000', /* icon_color   */ 'var(--button-star-iconColor)')
    // .replaceAll('#202644', /* border_color */ 'var(--borderColor-default,var(--color-border-default,#30363d))')
    // .replaceAll('#202020', /* bg_color     */ 'var(--bgColor-default, var(--color-canvas-default))')
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
    Those files are transformed versions of ${originalRepoPinURL}\n
  `);

  const repoURL = `https://github.com/${owner}/${name}`;

  const prefixOfGitHubCDN = `https://raw.githubusercontent.com/${owner}/${owner}/refs/heads/main/`;

  const newDarkThemeRepoPinURL = prefixOfGitHubCDN + imageFileNameDarkTheme;
  const newLightThemeRepoPinURL = prefixOfGitHubCDN + imageFileNameLightTheme;

  // return `[![${name} repo](${sourceRepoPinURL})](${repoURL})`;
  return outdent({ newline: '' })`
    [![${name} repo](${newDarkThemeRepoPinURL})](${repoURL + '#gh-dark-mode-only'})
    [![${name} repo](${newLightThemeRepoPinURL})](${repoURL + '#gh-light-mode-only'})
  `;

  // return `<a href="${repoURL}">${text}</a>`
}


async function fetchOriginalRepoPin({ owner, name }: IRepo) {
  const originalRepoPinURL = new URL(
    'api/pin',
    'https://github-readme-stats.vercel.app',
  );

  originalRepoPinURL.search = '?' + new URLSearchParams({
    username: owner,
    repo: name,
    // theme: '', // https://github.com/anuraghazra/github-readme-stats/blob/master/themes/README.md
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

  console.log(`Started fetching ${originalRepoPinURL}`);
  const { statusCode, body } = await request(originalRepoPinURL)

  if (statusCode !== 200) throw new Error(
    `statusCode=${statusCode}: Failed to fetch repo pin image for ${originalRepoPinURL}`
  );

  console.log(`Fetched ${originalRepoPinURL}`);

  return {
    originalRepoPinURL,
    originalRepoPinSVG: await body.text()
  };
}

const MarkdownRepoPinZodSchema = z.object({
  repoName: z.string().min(1),
  repoPinURL: z.string().min(50).url(),
  repoURL: z.string().min(22).url()
}).strict().array()


export function extractReposFromMarkdown(markdownText: string) {
  const markdownRepoPins = [
    ...markdownText.matchAll(
      /\[!\[(?<repoName>[^[\]()]+) repo\]\((?<repoPinURL>https:\/\/github-readme-stats\.vercel\.app\/api\/pin[^[\]()]+)\)\]\((?<repoURL>[^[\]()]+)\)/g
    )
  ].map(({ groups }) => groups);

  return MarkdownRepoPinZodSchema.parse(markdownRepoPins);
}
