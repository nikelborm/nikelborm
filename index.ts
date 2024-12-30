#!/usr/bin/env node

import { Octokit } from '@octokit/core';
import '@total-typescript/ts-reset';
import { readFile, writeFile } from 'fs/promises';
import parseLinkHeader from 'parse-link-header';
import { z } from 'zod';


const THEME = 'vision-friendly-dark'
const START_TOKEN = '<!-- REPO-TABLE-INJECT-START -->';
const END_TOKEN = '<!-- REPO-TABLE-INJECT-END -->';
const README_FILE_PATH = 'README.md'
// this is also a default environment variable provided by Github Action
const REPO_OWNER = getEnvVarOrFail('GITHUB_REPOSITORY_OWNER');
const AMOUNT_OF_COLUMNS = 2;


const getLinkFieldShapeObject = <const T extends string>(name: T) => {
  const FieldSchema = z.object({
    per_page: z.coerce.number(),
    page: z.coerce.number(),
    rel: z.literal(name),
    url: z.string().url()
  }).strict().optional();
  return {[name]: FieldSchema} as { [k in T]: typeof FieldSchema }
};

const LinkHeaderSchema = z.object( {
  ...getLinkFieldShapeObject('prev'),
  ...getLinkFieldShapeObject('next'),
  ...getLinkFieldShapeObject('last'),
  ...getLinkFieldShapeObject('first')
})


export async function* starsOfUser(username: string, per_page: number) {
  if (per_page <= 0 || per_page > 100) throw new Error(
    'Function statsOfUsers accepts only 0 < per_page <= 100'
  );
  if(!username) throw new Error(
    'Function statsOfUsers accepts only non-empty strings as username'
  );

  const octokit = new Octokit({
    // auth: getEnvVarOrFail('GITHUB_TOKEN'),
  });

  let page = 1;
  let doAnotherStep = true;

  while (doAnotherStep) {
    const response = await octokit.request('GET /users/{username}/starred', {
      username,
      per_page,
      direction: 'desc', // newest updated go first
      page,
      sort: 'updated',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
    });

    for (const elem of response.data) {
      yield 'repo' in elem ? elem.repo : elem;
    }

    const parsedLinks = LinkHeaderSchema.safeParse(
      parseLinkHeader(response.headers.link)
    );

    doAnotherStep = parsedLinks.success && !!parsedLinks.data.next?.url;
    page += 1;
  }
}

export async function* selfStarredReposOfUser(username: string) {
  for await (const repo of starsOfUser(username, 100)) {
    if(repo.owner.login === username) yield repo
  }
}

const reposCreatedByMe: string[] = [];

for await (const repo of selfStarredReposOfUser(REPO_OWNER)) {
  reposCreatedByMe.push(repo.name);
}

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

// const repoNamesToRender = MANUALLY_SELECTED_REPOS;
const repoNamesToRender = reposCreatedByMe;


const oldReadme = await readFile(README_FILE_PATH, 'utf8')

const editableZoneStartsAt = oldReadme.indexOf(START_TOKEN);
const editableZoneEndsAt = oldReadme.indexOf(END_TOKEN);

if(editableZoneStartsAt === -1)
  throw new Error('START marker is missing');

if(editableZoneEndsAt === -1)
  throw new Error('END marker is missing');

if(editableZoneStartsAt > editableZoneEndsAt)
  throw new Error(
    'START marker cannot be set after END marker. START marker should go first.'
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
  const repoSvgImageURL = new URL(
    'api/pin',
    'https://github-readme-stats.vercel.app',
  );

  repoSvgImageURL.search = '?' + new URLSearchParams({
    username: repo.owner,
    repo: repo.name,
    // tests
    // title_color: '008088',
    // text_color: '880800',
    // icon_color: '444000',
    // border_color: '202644',
    // bg_color: '202020',
    // serious
    title_color: 'af7aff',
    text_color: 'e4e4e4',
    icon_color: 'af7aff',
    bg_color: '010101',
  })

  const repoURL = `https://github.com/${repo.owner}/${repo.name}`;

  return `[![${repo.name} repo](${repoSvgImageURL})](${repoURL})`;
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
    '|' + '-|'.repeat(columnsAmount),
    ...rowsExceptFirst.map(
      row => renderRow(row, columnsAmount)
    ),
    ,
  ].join('\n');
}

const nonEditableTopPart = oldReadme.slice(0, editableZoneStartsAt + START_TOKEN.length);
const nonEditableBottomPart = oldReadme.slice(editableZoneEndsAt);

const newReadme = nonEditableTopPart
  + renderTable(repoNamesToRender, AMOUNT_OF_COLUMNS)
  + nonEditableBottomPart

await writeFile(README_FILE_PATH, newReadme)
