#!/usr/bin/env node

import '@total-typescript/ts-reset';
import { readFile, writeFile } from 'node:fs/promises';
import { RequestError } from "@octokit/request-error";
import { outdent } from 'outdent';
import {
  extractReposFromMarkdown,
  getEnvVarOrFail,
  IRepo,
  renderMarkdownRepoBadges,
  renderMarkdownTableOfSmallStrings,
  selfStarredReposOfUser,
  splitStringApart
} from './src/index.js';
import { format } from 'node:util';

// const THEME = 'vision-friendly-dark'
const START_TOKEN = '<!-- REPO-TABLE-INJECT-START -->';
const END_TOKEN = '<!-- REPO-TABLE-INJECT-END -->';
const README_FILE_PATH = 'README.md'
// this is also a default environment variable provided by Github Action
const REPO_OWNER = getEnvVarOrFail('GITHUB_REPOSITORY_OWNER');
const AMOUNT_OF_COLUMNS = 2;
// I'm okay with loosing less than 20 percent of badges
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
const fetchedReposCreatedByMe: IRepo[] = [];

try {
  for await (const { name } of selfStarredReposOfUser(REPO_OWNER)) {
    console.log(`Found own starred repo: ${name}`);

    fetchedReposCreatedByMe.push({ name, owner: REPO_OWNER });
  }
} catch (error) {
  const passesGracefulDegradationCondition = error instanceof RequestError
    && fetchedReposCreatedByMe.length > (
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


const repoBadges = await renderMarkdownRepoBadges(fetchedReposCreatedByMe);

const newReadme = nonEditableTopPart
  + await renderMarkdownTableOfSmallStrings(
    repoBadges,
    AMOUNT_OF_COLUMNS
  )
  + nonEditableBottomPart;

await writeFile(README_FILE_PATH, newReadme);

console.log(`Finished writing result to ${README_FILE_PATH} file`);

if (delayedError) throw delayedError;
