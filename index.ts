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
  renderMarkdownTableOfSmallStrings,
  renderRepoToMarkdownPin,
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

const futureRepoPins: {
  repo: IRepo,
  pin: Promise<string>,
}[] = [];

try {
  const repos = process.env['MOCK_API'] === 'true'
    ? await getMockRepos(REPO_OWNER)
    : selfStarredReposOfUser(REPO_OWNER);

  for await (const repo of repos) {
    console.log(`Found own starred repo: ${repo.name}, ${repo.lastTimeBeenPushedInto}`);

    futureRepoPins.push({
      repo,
      pin: renderRepoToMarkdownPin(repo)
    });
  }
} catch (error) {
  const passesGracefulDegradationCondition = error instanceof RequestError
    && futureRepoPins.length > (
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
    JSON.stringify(futureRepoPins.map(_ => _.repo))
  );

futureRepoPins.sort((a, b) => {
  const compare = (f: (r: IRepo) => number) => f(a.repo) - f(b.repo);
  const templateToTop = -compare(r => +r.isTemplate);
  if (templateToTop) return templateToTop;

  const boilerplatesToTop = -compare(r => +r.name.includes('boiler'));
  if (boilerplatesToTop) return boilerplatesToTop;

  const archivedToBottom = compare(r => +r.isItArchived);
  if (archivedToBottom) return archivedToBottom;

  const hackathonsToBottom = compare(r => +r.name.includes('hackathon'));
  if (hackathonsToBottom) return hackathonsToBottom;

  const experimentsToBottom = compare(r => +r.name.includes('experiment'));
  if (experimentsToBottom) return experimentsToBottom;

  const lastPushedToTop = -compare(r => Number(r.lastTimeBeenPushedInto));
  if (lastPushedToTop) return lastPushedToTop; // null goes to bottom

  return 0;
})

const repoPins = await Promise.all(
  futureRepoPins.map(_ => _.pin)
);

const newReadme = nonEditableTopPart
  + renderMarkdownTableOfSmallStrings(
    repoPins,
    AMOUNT_OF_COLUMNS
  )
  + nonEditableBottomPart;

await writeFile(README_FILE_PATH, newReadme);

console.log(`Finished writing result to ${README_FILE_PATH} file`);

if (delayedError) throw delayedError;
