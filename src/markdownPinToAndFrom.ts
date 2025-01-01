import type { IMiniRepo } from './repo.interface.js';
import { z } from 'zod';
import { themes } from './themes.js';
import { getOriginalDarkThemePinURL, getScaledRepaintedRepoPinURL } from './getPinURLs.js';

export function getScaledRepaintedMarkdownPin(repo: IMiniRepo) {
  return themes.map(theme => hidePinIfEnvSaysSo(
    theme,
    getMarkdownPin(
      repo.name,
      getScaledRepaintedRepoPinURL(repo, theme),
      `${getRepoURL(repo)}#gh-${theme}-mode-only)`,
    )
  )).join('');
}

export function getOriginalDarkThemeMarkdownPin(repo: IMiniRepo) {
  return getMarkdownPin(
    repo.name,
    getOriginalDarkThemePinURL(repo),
    getRepoURL(repo),
  );
}

function getMarkdownPin(name: string, pinURL: string, repoURL: string) {
  return `[![${name} repo](${pinURL})](${repoURL})`;
}

function getRepoURL({ owner, name }: IMiniRepo) {
  return `https://github.com/${owner}/${name}/`;
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
