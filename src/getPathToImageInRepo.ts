import type { IMiniRepo } from './repo.interface.js';
import type { Theme } from './themes.js';

export function getPathToImageInRepo({ owner, name }: IMiniRepo, theme: Theme) {
  return `images/${owner}_${name}_${theme}_theme.svg`;
}
