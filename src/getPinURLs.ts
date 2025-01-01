import { getPathToImageInRepo } from './getPathToImageInRepo.js';
import type { IMiniRepo } from './repo.interface.js';
import type { Theme } from './themes.js';

export function getScaledRepaintedRepoPinURL({ owner, name }: IMiniRepo, theme: Theme) {
  return `https://raw.githubusercontent.com/${owner}/${owner}/refs/heads/main/`
    + getPathToImageInRepo({ owner, name }, theme);
}

export function getOriginalDarkThemePinURL({ owner, name }: IMiniRepo) {
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
