import type { IMiniRepo } from './repo.interface.js';
import type { Theme } from './themes.js';

export function getPathToImageInRepoRelativeToRepoRoot(
  { owner, name }: IMiniRepo,
  theme: Theme,
) {
  return `images/${owner},${name},${theme}_theme.svg`;
}

export function getImageFileName({ owner, name }: IMiniRepo, theme: Theme) {
  // '_', '.', '-' are unreliable splitters because the may be a part of owner's or repo's name
  return `${owner},${name},${theme}_theme.svg`;
}
