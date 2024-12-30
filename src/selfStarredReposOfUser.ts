import { starredReposOfUser } from './starredReposOfUser.js';

export async function* selfStarredReposOfUser(username: string) {
  for await (const repo of starredReposOfUser(username, 100)) {
    if(repo.owner.login === username) yield repo
  }
}
