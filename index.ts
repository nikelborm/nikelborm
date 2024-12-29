#!/usr/bin/env node

import "@total-typescript/ts-reset";
import { readFile, writeFile } from 'fs/promises'

const THEME = 'vision-friendly-dark'
const START_TOKEN = '<!-- REPO-TABLE-INJECT-START -->';
const END_TOKEN = '<!-- REPO-TABLE-INJECT-END -->';
const README_FILE_PATH = 'README.md'
const REPO_OWNER = getEnvVarOrFail('GITHUB_REPOSITORY_OWNER');
const AMOUNT_OF_COLUMNS = 2;
const MANUALLY_SELECTED_REPOS = [
  'fetch-github-folder',
  'apache-superset-quick-init',
  'python_snake',
  'joiner',
  'ts-better-tuple',
  'project-boilerplate',
  'puzzle',
  'traceTree',
  'autism-stats',

  'link-header-css-injection-poc',
  'smarthouse',
  'flat-to-nested',
  'cool-enum-experiments',
  'leetcode',
  'shelter-erp',
  'interview-monarchs-task',
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


function getEnvVarOrFail(name: string) {
  const envVar = process.env[name];

  if (!envVar)
    throw new Error(`env var ${name} is not defined`);

  return envVar;
}

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

function renderCell(repoName: string | undefined) {
  if (!repoName) return '';

  return renderRepo(
    { name: repoName, owner: REPO_OWNER },
    THEME
  );
}

function renderRow(repoNames: string[], columnsAmount: number) {
  return Array
    .from(
      /* `columnsAmount` maintains amount of columns in cases when the group is half-full */
      /* `+2` adds | to the sides */
      { length: columnsAmount + 2 },
      (_, i) => renderCell(repoNames[i - 1])
    )
    .join('|')
}

function renderTable(repoNames: string[], columnsAmount: number) {
  const _ = Object.values(
    Object.groupBy(
      repoNames,
      (_, i) => Math.floor(i / columnsAmount)
    )
  ) as string[][];
  const [rowsExceptFirst, firstRow] = [_, _.shift()!] as const;

  return [
    ,
    renderRow(firstRow, columnsAmount),
    "|" + "-|".repeat(columnsAmount),
    ...rowsExceptFirst.map(
      row => renderRow(row, columnsAmount)
    ),
    ,
  ].join("\n");
}

const newReadme = oldReadme.slice(0, startsAt + START_TOKEN.length)
  + renderTable(MANUALLY_SELECTED_REPOS, AMOUNT_OF_COLUMNS)
  + oldReadme.slice(ensdAt);

await writeFile(README_FILE_PATH, newReadme)
