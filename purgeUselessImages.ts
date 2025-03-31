#!/usr/bin/env node

import { END_TOKEN, README_FILE_PATH, START_TOKEN } from './constants.js';
import { readdir, readFile } from 'node:fs/promises';
import { TokenReplacer } from './src/splitStringApart.js';
import { rimraf } from 'rimraf';
import { extractReposFromMarkdownSoft } from './src/markdownPinToAndFrom.js';
import { getImageFileName } from './src/getPathToImageInRepo.js';

const oldReadme = await readFile(README_FILE_PATH, 'utf8');

const replacer = new TokenReplacer(oldReadme, {
  repos: [START_TOKEN, END_TOKEN],
});

const reposMarkdownTableString =
  replacer.getPartsOnFirstMatchOrThrow('repos').targetPartExcludingTokens;

const expectedToHaveImageFileNames = new Set(
  extractReposFromMarkdownSoft(reposMarkdownTableString)
    .filter(e => e.imageHost === 'raw.githubusercontent.com')
    .map(e =>
      getImageFileName({ name: e.repoName, owner: e.username }, e.themeName),
    ),
);

console.log(
  'Expected to have image file names: ',
  expectedToHaveImageFileNames,
);

const presentImageFileNames = new Set(
  (await readdir('./images')).filter(
    e => !['.gitkeep', '.gitignore'].includes(e),
  ),
);

console.log('Present image file names: ', presentImageFileNames);

const removalTargets = presentImageFileNames.difference(
  expectedToHaveImageFileNames,
);

process.chdir('./images');

await rimraf([...removalTargets]);

console.log(`Deleted following files in images folder:`, removalTargets);
