import { Octokit } from '@octokit/core';
import { parseLinkHeader } from './parseLinkHeader.js';
import { racinglyIterateAll } from './racinglyIterateAll.js';
import { IRepo } from './repo.interface.js';

export async function* starredReposOfUser(username: string, per_page: number) {
  console.log(`Started fetching pages of ${username}'s starred repos`);

  const { linkHeader, repos } = await requestPageOfStarredRepos({
    page: 1,
    per_page,
    username,
  });

  yield* repos;

  const lastPage = linkHeader.last?.page || linkHeader.next?.page

  console.log( `Fetched first out of ${lastPage ?? 1} pages`);

  if (!lastPage) return;

  for await (const { index, result: { repos } } of racinglyIterateAll(Array.from(
    { length: lastPage - 1 },
    (_, index) => requestPageOfStarredRepos({
      page: index + 2,
      per_page,
      username,
    })
  ))) {
    const page = index + 2;
    console.log( `Racingly fetched ${ordinalSuffixOf(page)} page out of all ${lastPage} pages`);

    yield* repos;
  }
}

async function requestPageOfStarredRepos({
  page,
  username,
  per_page,
}: {
  page: number,
  username: string,
  per_page: number,
}) {
  if (per_page <= 0 || per_page > 100) throw new Error(
    'requestPageOfStarredRepos accepts only 0 < per_page <= 100'
  );

  if (!username) throw new Error(
    'requestPageOfStarredRepos accepts only non-empty strings as username'
  );

  const octokit = new Octokit();

  const { data, headers } = await octokit.request('GET /users/{username}/starred', {
    username,
    per_page,
    direction: 'desc', // newest updated go first
    page,
    sort: 'updated',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    },
  });

  return {
    linkHeader: parseLinkHeader(headers.link),
    repos: data.map(e => {
      const repo = 'repo' in e ? e.repo : e;
      return {
        name: repo.name,
        owner: repo.owner.login,
        isItArchived: repo.archived,
        isTemplate: !!repo.is_template,
        starCount: repo.stargazers_count,
        forkCount: repo.forks_count,
        lastTimeBeenPushedInto: repo.pushed_at
          ? new Date(repo.pushed_at)
          : null,
      } satisfies IRepo
    })
  }
}

function ordinalSuffixOf(i: number) {
  let j = i % 10,
      k = i % 100;
  if (j === 1 && k !== 11) {
      return i + "st";
  }
  if (j === 2 && k !== 12) {
      return i + "nd";
  }
  if (j === 3 && k !== 13) {
      return i + "rd";
  }
  return i + "th";
}
