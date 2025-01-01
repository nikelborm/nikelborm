import { Octokit } from '@octokit/core';
import { parseLinkHeader } from './parseLinkHeader.js';
import { IRepo } from './repo.interface.js';

// Self imposed restriction to exit infinite loops
const SENT_TOO_MUCH_REQUESTS_AMOUNT = 50;

export async function* starredReposOfUser(username: string, per_page: number) {
  if (per_page <= 0 || per_page > 100) throw new Error(
    'Function statsOfUsers accepts only 0 < per_page <= 100'
  );

  if (!username) throw new Error(
    'Function statsOfUsers accepts only non-empty strings as username'
  );

  const octokit = new Octokit();

  let sentAmountOfRequests = 0;
  let doAnotherStep = true;

  console.log(`Started fetching pages of ${username}'s starred repos`);

  while (doAnotherStep && sentAmountOfRequests < SENT_TOO_MUCH_REQUESTS_AMOUNT) {
    sentAmountOfRequests += 1;

    const response = await octokit.request('GET /users/{username}/starred', {
      username,
      per_page,
      direction: 'desc', // newest updated go first
      page: sentAmountOfRequests,
      sort: 'updated',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
    });

    process.stdout.write(`Fetched ${sentAmountOfRequests}`);

    const linkHeader = parseLinkHeader(response.headers.link);

    const lastPage = linkHeader.last?.page;

    console.log( lastPage ? ` out of ${lastPage} pages` : ` pages`);

    for (const elem of response.data) {
      const repo = 'repo' in elem ? elem.repo : elem;
      yield {
        name: repo.name,
        owner: repo.owner.login,
        isItArchived: repo.archived,
        isTemplate: !!repo.is_template,
        starCount: repo.stargazers_count,
        forkCount: repo.forks_count,
        lastTimeBeenPushedInto: repo.pushed_at
          ? new Date(repo.pushed_at)
          : null,
      } satisfies IRepo;
    }

    doAnotherStep = !!linkHeader.next?.url;
  }
}
