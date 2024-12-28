#!/usr/bin/env node

import "@total-typescript/ts-reset";
import { readFile, writeFile } from 'fs/promises'


function logObjectNicely(item: any): void {
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });
}




function renderRepo(
  repo: {
    owner: string;
    name: string;
  },
  theme: string
) {
  return `[![${repo.name} repo](https://github-readme-stats.vercel.app/api/pin/?username=${repo.owner}&repo=${repo.name}&theme=${theme})](https://github.com/${repo.owner}/${repo.name})`;
}


const START_TOKEN = '<!-- REPO-TABLE-INJECT-START -->';
const END_TOKEN = '<!-- REPO-TABLE-INJECT-END -->';


const oldReadme = await readFile('README.md', 'utf8')

const startsAt = oldReadme.indexOf(START_TOKEN);

if(startsAt === -1)
  throw new Error("START marker is missing");

const ensdAt = oldReadme.indexOf(END_TOKEN);

if(ensdAt === -1)
  throw new Error("END marker is missing");

if(startsAt > ensdAt)
  throw new Error(
    "START marker cannot be set after END marker. START marker should go first."
);


const manualRepos = [
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

function renderTable(repos: string[], columnsAmount: number) {
  return "\n" + [
    "|".repeat(columnsAmount + 1),
    "|" + "---|".repeat(columnsAmount),
    Object
      .values(
        Object.groupBy(
          repos,
          (_, i) => Math.floor(i / columnsAmount)
        )
      )
      .map(e =>
        '|' + e!.map(
          name => name
            ? renderRepo(
              {
                name,
                owner: 'nikelborm'
              },
              'vue-dark'
            )
            : ''
        ).join('|') + '|'
      )
      .join('\n')
  ].join("\n") + "\n";
}

const newReadme = oldReadme.slice(0, startsAt + START_TOKEN.length)
  + renderTable(manualRepos, 3)
  + oldReadme.slice(ensdAt);

await writeFile("README.md", newReadme)
