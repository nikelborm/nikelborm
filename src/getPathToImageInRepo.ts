import type { IMiniRepo } from './repo.interface.js';
import type { Theme } from './themes.js';

export function getPathToImageInRepo({ owner, name }: IMiniRepo, theme: Theme) {
  // '_', '.', '-' are unreliable splitters because the may be part of owner's or repo's name
  return `images/${owner},${name},${theme}_theme.svg`;
}
