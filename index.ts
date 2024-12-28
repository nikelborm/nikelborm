#!/usr/bin/env node

import "@total-typescript/ts-reset";
import { readFile, writeFile } from 'fs/promises'

const THEME = 'vision-friendly-dark'
const START_TOKEN = '<!-- REPO-TABLE-INJECT-START -->';
const END_TOKEN = '<!-- REPO-TABLE-INJECT-END -->';
const README_FILE_PATH = 'README.md'
const REPO_OWNER = 'nikelborm'
const AMOUNT_OF_COLUMNS = 2;
const MANUALLY_SELECTED_REPOS = [
  'autism-stats',
  'python_snake',
  'link-header-css-injection-poc',
  'ts-better-tuple',
  'project-boilerplate',
  'smarthouse',
  'joiner',
  'flat-to-nested',
  'cool-enum-experiments',
  'puzzle',
  'leetcode',
  'shelter-erp',
  'interview-monarchs-task',
  'traceTree',
  'permission-control-draft',
  'leak-parser',
  'vk-friends'
]


const oldReadme = await readFile(README_FILE_PATH, 'utf8')

const startsAt = oldReadme.indexOf(START_TOKEN);
const ensdAt = oldReadme.indexOf(END_TOKEN);

if(startsAt === -1)
  throw new Error("START marker is missing");

if(ensdAt === -1)
  throw new Error("END marker is missing");

if(startsAt > ensdAt)
  throw new Error(
    "START marker cannot be set after END marker. START marker should go first."
);

function renderRepo(
  repo: {
    owner: string;
    name: string;
  },
  /**
   * [Available Themes](https://github.com/anuraghazra/github-readme-stats/blob/master/themes/README.md)
   */
  theme: string
) {
  return `[![${repo.name} repo](https://github-readme-stats.vercel.app/api/pin/?username=${repo.owner}&repo=${repo.name}&theme=${theme})](https://github.com/${repo.owner}/${repo.name})`;
}

function renderRow(fewRepoNames: string[]) {
  return [
    ,
    ...fewRepoNames.map(
      name => renderRepo(
        { name, owner: REPO_OWNER },
        THEME
      )
    ),
    ,
  ].join('|')
}

function renderTable(repos: string[], columnsAmount: number) {
  const _ = Object.values(
    Object.groupBy(
      repos,
      (_, i) => Math.floor(i / columnsAmount)
    )
  ) as string[][];
  const [rowsExceptFirst, firstRow] = [_, _.shift()!] as const;

  return [
    ,
    renderRow(firstRow),
    "|" + "-|".repeat(columnsAmount),
    ...rowsExceptFirst.map(renderRow),
    ,
  ].join("\n");
}

const newReadme = oldReadme.slice(0, startsAt + START_TOKEN.length)
  + renderTable(MANUALLY_SELECTED_REPOS, AMOUNT_OF_COLUMNS)
  + oldReadme.slice(ensdAt);

await writeFile(README_FILE_PATH, newReadme)
