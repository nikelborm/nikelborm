import { starredReposOfUser } from './starredReposOfUser.js';

export async function* selfStarredReposOfUser(username: string) {
  // There were generally 2 ways to do it. Lets say we have 1500 stars (A) and
  // 100 repos (B). Looking only on the first step gives us a feeling that we
  // should choose the second way. But looking on the situation as a whole
  // gives as following results:

  // The first way:
  // 1. get all starred repos of the user (/users/{username}/starred)
  //    respecting pagination (N requests = A / 100 on a page)
  // 2. 0 requests to check if it's user's own repo, because we can
  //    determine that from the responses above

  // N = A / 100 = 15 requests
  // Result = N + 0 = 15 requests

  // The second way:
  // 1. Get all repos that the user created (/user/repos) respecting
  //    pagination (K requests = B / ~25 on a page)
  // 2. Per each repo send request (/user/starred/{owner}/{repo}) to get
  //    info if authenticated user starred the repo or not (B requests)

  // K = B / 25 = 4 requests
  // Result = K + B = 104 requests

  // So I chose the first way.
  for await (const repo of starredReposOfUser(username, 100)) {
    if (repo.owner === username) yield repo
  }
}
