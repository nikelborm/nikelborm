import { Octokit } from '@octokit/core';
import { parseLinkHeader } from './parseLinkHeader.js';

export async function* starredReposOfUser(username: string, per_page: number) {
  if (per_page <= 0 || per_page > 100) throw new Error(
    'Function statsOfUsers accepts only 0 < per_page <= 100'
  );
  if(!username) throw new Error(
    'Function statsOfUsers accepts only non-empty strings as username'
  );

  const octokit = new Octokit();

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
    process.stdout.write(`Fetched page ${page} of ${username}'s starred repos`);

    const linkHeader = parseLinkHeader(response.headers.link);

    const lastPage = linkHeader.last?.page;

    console.log( lastPage ? ` out of ${lastPage} pages` : '');

    for (const elem of response.data) {
      yield 'repo' in elem ? elem.repo : elem;
    }

    doAnotherStep = !!linkHeader.next?.url;
    page += 1;
  }
}
