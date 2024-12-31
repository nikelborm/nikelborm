#!/usr/bin/env node

import '@total-typescript/ts-reset';
import { readFile, writeFile } from 'node:fs/promises';
import {
  getEnvVarOrFail,
  IRepo,
  renderReposTableToMarkdown,
  selfStarredReposOfUser
} from './src/index.js';

// const THEME = 'vision-friendly-dark'
const START_TOKEN = '<!-- REPO-TABLE-INJECT-START -->';
const END_TOKEN = '<!-- REPO-TABLE-INJECT-END -->';
const README_FILE_PATH = 'README.md'
// this is also a default environment variable provided by Github Action
const REPO_OWNER = getEnvVarOrFail('GITHUB_REPOSITORY_OWNER');
const AMOUNT_OF_COLUMNS = 2;


const reposCreatedByMe: IRepo[] = [];



for await (const {
  name,
  owner: { login: owner }
} of selfStarredReposOfUser(REPO_OWNER)) {
  console.log(`Found own starred repo: ${name}`);

  reposCreatedByMe.push({ name, owner });
}

const oldReadme = await readFile(README_FILE_PATH, 'utf8')

console.log(`Finished reading source ${README_FILE_PATH} file`);

const editableZoneStartsAt = oldReadme.indexOf(START_TOKEN);
const editableZoneEndsAt = oldReadme.indexOf(END_TOKEN);

if (editableZoneStartsAt === -1)
  throw new Error('START marker is missing');

if (editableZoneEndsAt === -1)
  throw new Error('END marker is missing');

if (editableZoneStartsAt > editableZoneEndsAt)
  throw new Error(
    'START marker cannot be set after END marker. START marker should go first.'
  );

const nonEditableTopPart = oldReadme.slice(0, editableZoneStartsAt + START_TOKEN.length);
const nonEditableBottomPart = oldReadme.slice(editableZoneEndsAt);

const newReadme = nonEditableTopPart
  + renderReposTableToMarkdown(reposCreatedByMe, AMOUNT_OF_COLUMNS)
  + nonEditableBottomPart

await writeFile(README_FILE_PATH, newReadme)

console.log(`Finished writing result to ${README_FILE_PATH} file`);
