import { END_TOKEN, README_FILE_PATH, START_TOKEN } from 'constants.js';
import { readdir, readFile } from 'node:fs/promises';
import { rimraf } from 'rimraf'
import path from 'node:path';
import { splitStringApart } from 'src/splitStringApart.js';
import { extractReposFromMarkdownSoft } from 'src/markdownPinToAndFrom.js';
import { getPathToImageInRepo } from 'src/getPathToImageInRepo.js';

const oldReadme = await readFile(README_FILE_PATH, 'utf8');

const { middlePartWithoutTokens } = splitStringApart({
  initialStringToSplit: oldReadme,
  startToken: START_TOKEN,
  endToken: END_TOKEN,
});

const expectedToHaveImageFileNames = new Set(
  extractReposFromMarkdownSoft(middlePartWithoutTokens)
    .filter(e => e.imageHost === 'raw.githubusercontent.com')
    .map(e => path.basename(getPathToImageInRepo(
      { name: e.repoName, owner: e.username },
      e.themeName
    )))
);

const presentImageFileNames = new Set(
  (await readdir('./images'))
    .filter(e => !['.gitkeep', '.gitignore'].includes(e))
);

const removalTargets = presentImageFileNames.difference(expectedToHaveImageFileNames);

process.chdir('./images');

await rimraf([...removalTargets]);

console.log(
  `Deleted following files in images folder:`,
  removalTargets
);
