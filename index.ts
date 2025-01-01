#!/usr/bin/env node

import { RequestError } from "@octokit/request-error";
import '@total-typescript/ts-reset';
import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'node:util';
import { outdent } from 'outdent';
import {
  extractReposFromMarkdown,
  getEnvVarOrFail,
  getMockRepos,
  IRepo,
  refreshScaledRepaintedPinInImagesFolder,
  renderMarkdownTableOfSmallStrings,
  getScaledRepaintedMarkdownPin,
  selfStarredReposOfUser,
  splitStringApart
} from './src/index.js';


const START_TOKEN = '<!-- REPO-TABLE-INJECT-START -->';
const END_TOKEN = '<!-- REPO-TABLE-INJECT-END -->';
const README_FILE_PATH = 'README.md';
// this is also a default environment variable provided by Github Action
const REPO_OWNER = getEnvVarOrFail('GITHUB_REPOSITORY_OWNER');
const AMOUNT_OF_COLUMNS = 2;
// I'm okay with loosing less than 20% of pins due to reaching rate limits
const FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS = 80;

const oldReadme = await readFile(README_FILE_PATH, 'utf8');

console.log(`Finished reading source ${README_FILE_PATH} file`);

const {
  leftPartWithStartToken: nonEditableTopPart,
  middlePartWithoutTokens: oldEditablePart,
  rightPartWithEndToken: nonEditableBottomPart,
} = splitStringApart({
  initialStringToSplit: oldReadme,
  startToken: START_TOKEN,
  endToken: END_TOKEN,
});

let delayedError: Error | null = null;

const fetchedReposWithPins: {
  repo: IRepo,
  pin: string,
  pinRefreshPromise: Promise<void>,
}[] = [];

try {
  const repos = process.env['MOCK_API'] === 'true'
    ? await getMockRepos(REPO_OWNER)
    : selfStarredReposOfUser(REPO_OWNER);

  for await (const repo of repos) {
    console.log(`Found own starred repo: ${repo.name}, ${repo.lastTimeBeenPushedInto}`);

    fetchedReposWithPins.push({
      repo,
      pin: getScaledRepaintedMarkdownPin(repo),
      // If you don't like rescaling and repainting, you can change it here
      // pin: getOriginalDarkThemeMarkdownPin(repo),
      pinRefreshPromise: process.env['SKIP_REFRESHING_IMAGES_FOLDER'] === "true"
        ? Promise.resolve()
        : refreshScaledRepaintedPinInImagesFolder(repo),
    });
  }
} catch (error) {
  const passesGracefulDegradationCondition = error instanceof RequestError
    && fetchedReposWithPins.length > (
      extractReposFromMarkdown(oldEditablePart).length
        * FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS / 100
    );

  if (passesGracefulDegradationCondition) {
    console.error(outdent`
      An error was thrown during fetching data from Github API, but already
      fetched results will still be written to %s since condition
      for graceful degradation was met. It means that before failing, API
      returned more than %s%% of the repos relative to previous CI run.
    `, README_FILE_PATH, FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS);
    delayedError = error;
  } else throw new Error(
    format(outdent`
      There was an error during fetching data from Github API and condition
      for graceful degradation wasn't met. It means that before failing API
      returned LESS than %s%% of the repos relative to previous CI run.
    `, FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS),
    { cause: error }
  );
}

if (process.env['MOCK_API'] !== 'true')
  await writeFile(
    './reposCreatedAndStarredByMe.json',
    JSON.stringify(fetchedReposWithPins.map(_ => _.repo))
  );

const aggParam = (agg: 'min' | 'max', param: 'star' | 'fork') =>
  Math[agg](...fetchedReposWithPins.map(_ => _.repo[`${param}Count`]))

const maxStars = aggParam('max', 'star');
const minStars = aggParam('min', 'star');
const maxForks = aggParam('max', 'fork');
const minForks = aggParam('min', 'fork');
console.log({ maxStars, minStars, maxForks, minForks })

const pinsToBeSortedWithCoefficients = fetchedReposWithPins.map(({ repo: r, pin }) => {
  const normalizedStarsCoefficient = (r.starCount - minStars) / (maxStars - minStars);
  const normalizedForksCoefficientWithAdjustedValue = (r.forkCount - minForks) / (maxForks - minForks) * 0.25;
  const publicityCoefficient = normalizedStarsCoefficient
    + normalizedForksCoefficientWithAdjustedValue;
  // publicityCoefficient: min=0, max=1.25
  // Five popularity classes
  // 0 ... 0.25, 0.25 ... 0.5, 0.5 ... 0.75, 0.75 ... 0.1, 1 ... 1.25;
  return {
    pin: pin,
    templateCoefficient: +r.isTemplate,
    boilerplateCoefficient: +r.name.includes('boiler'),
    archiveCoefficient: +r.isItArchived,
    hackathonCoefficient: +r.name.includes('hackathon'),
    experimentCoefficient: +r.name.includes('experiment'),
    lastTimeBeenPushedIntoCoefficient: Number(r.lastTimeBeenPushedInto),
    publicityClassCoefficient:
        publicityCoefficient > 1  ? 5 :
      publicityCoefficient > 0.75 ? 4 :
      publicityCoefficient > 0.5  ? 3 :
      publicityCoefficient > 0.25 ? 2 :
      1
  }
})


pinsToBeSortedWithCoefficients.sort((a, b) => {
  type keys = keyof (typeof pinsToBeSortedWithCoefficients)[number];
  // `extends infer K` needed to run type distribution
  type coefficient = keys extends infer K ? K extends `${infer U}Coefficient` ? U : never : never;
  const smallestFirst = (c: coefficient) => a[`${c}Coefficient`] - b[`${c}Coefficient`];
  const biggestFirst = (c: coefficient) => -smallestFirst(c);
  let _: any;

  if (_ =  biggestFirst('template'              )) return _;
  if (_ =  biggestFirst('boilerplate'           )) return _;
  if (_ = smallestFirst('archive'               )) return _;
  if (_ = smallestFirst('hackathon'             )) return _;
  if (_ = smallestFirst('experiment'            )) return _;
  if (_ =  biggestFirst('publicityClass'        )) return _;
  if (_ =  biggestFirst('lastTimeBeenPushedInto')) return _; // if null goes to bottom

  return 0;
})

await Promise.all(fetchedReposWithPins.map(_ => _.pinRefreshPromise));

const newReadme = nonEditableTopPart
  + renderMarkdownTableOfSmallStrings(
    pinsToBeSortedWithCoefficients.map(_ => _.pin),
    AMOUNT_OF_COLUMNS
  )
  + nonEditableBottomPart;

await writeFile(README_FILE_PATH, newReadme);

console.log(`Finished writing result to ${README_FILE_PATH} file`);

if (delayedError) throw delayedError;
