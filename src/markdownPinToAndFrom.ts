import { IRepo } from './repo.interface.js';
import { z } from 'zod';
import { request } from 'undici';
import { writeFile } from 'node:fs/promises';
import { outdent } from 'outdent';

type SmallRepo = Pick<IRepo, 'owner' | 'name'>;

const themes = ['dark', 'light'] as const;
type Theme = typeof themes[number];

export function renderRepoToScaledRepaintedMarkdownPin(repo: SmallRepo) {
  return themes.map(theme => hidePinIfEnvSaysSo(
    theme,
    getMarkdownPin(
      repo.name,
      getScaledRepaintedRepoPinURL(repo, theme),
      `${getRepoURL(repo)}#gh-${theme}-mode-only)`,
    )
  )).join('');
}

export function renderRepoToOriginalDarkThemePinURL(repo: SmallRepo) {
  return getMarkdownPin(
    repo.name,
    getOriginalDarkThemePinURL(repo),
    getRepoURL(repo),
  );
}

export async function refreshScaledRepaintedPinInImagesFolder({ owner, name }: SmallRepo) {
  const {
    originalDarkThemePinSVG,
    originalDarkThemePinURL
  } = await fetchOriginalDarkThemePin({ owner, name });
  console.log(`Fetched original repo pin { owner:"${owner}", name:"${name}" }`);

  const scaledRepaintedPinSVGs = getScaledRepaintedRepoPins(originalDarkThemePinSVG);

  const writtenPaths = await Promise.all(
    themes.map(async (theme) => {
      const filePath = getPathToImageInRepo({ owner, name }, theme);
      await writeFile(
        filePath,
        scaledRepaintedPinSVGs[`${theme}ThemePinSVG`]
      );
      return filePath;
    })
  );

  console.log(outdent`
Written files:
${writtenPaths.map(v => '- ' + v).join('\n')}
Those files are transformed versions of ${originalDarkThemePinURL}\n
  `);
}


function getScaledRepaintedRepoPins(originalDarkThemePinSVG: string) {
  const darkThemePinSVG = originalDarkThemePinSVG
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

  const lightThemePinSVG = darkThemePinSVG
    .replaceAll('#f0f6fc', '#1f2328');

  return { darkThemePinSVG, lightThemePinSVG };
}

async function fetchOriginalDarkThemePin(repo: SmallRepo) {
  const originalDarkThemePinURL = getOriginalDarkThemePinURL(repo);

  console.log(`Started fetching repo pin ` + JSON.stringify(repo));
  const { statusCode, body } = await request(originalDarkThemePinURL)

  if (statusCode !== 200) throw new Error(
    `statusCode=${statusCode}: Failed to fetch repo pin image for ${originalDarkThemePinURL}`
  );

  return {
    originalDarkThemePinURL,
    originalDarkThemePinSVG: await body.text()
  };
}

function getMarkdownPin(name: string, pinURL: string, repoURL: string) {
  return `[![${name} repo](${pinURL})](${repoURL})`;
}

function getRepoURL({ owner, name }: SmallRepo) {
  return `https://github.com/${owner}/${name}/`;
}

function getScaledRepaintedRepoPinURL({ owner, name }: SmallRepo, theme: Theme) {
  return `https://raw.githubusercontent.com/${owner}/${owner}/refs/heads/main/`
    + getPathToImageInRepo({ owner, name }, theme);
}

function getPathToImageInRepo({ owner, name }: SmallRepo, theme: Theme) {
  return `images/${owner}_${name}_${theme}_theme.svg`;
}

function getOriginalDarkThemePinURL({ owner, name }: SmallRepo) {
  const originalDarkThemePinURL = new URL(
    'api/pin',
    'https://github-readme-stats.vercel.app',
  );

  originalDarkThemePinURL.search = '?' + new URLSearchParams({
    username: owner,
    repo: name,
    // theme: 'vision-friendly-dark', // https://github.com/anuraghazra/github-readme-stats/blob/master/themes/README.md
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

  return '' + originalDarkThemePinURL;
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

const hidePinIfEnvSaysSo = (theme: string, pin: string) =>
  [theme, "", undefined, null, 'both', 'null', 'any', 'all', 'every', 'each']
    .includes(process.env['RENDER_ONLY_THEME'])
  ? pin
  : '';
