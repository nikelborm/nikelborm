import { readFile } from 'node:fs/promises';
import { IRepo, RepoZodSchema } from './repo.interface.js';

export async function getMockRepos(owner: string) {
  try {
    const fileContents = await readFile('./reposCreatedAndStarredByMe.json', 'utf-8');
    /* searches for this file relative to CWD */

    return RepoZodSchema.array().parse(JSON.parse(fileContents));
  } catch (error) {
    console.error("Error while loading ./reposCreatedAndStarredByMe.json. Falling back to primitive mock", error)
    return ["apache-superset-quick-init", "download-github-folder"]
      .map(name => ({
        name,
        isItArchived: false,
        isTemplate: false,
        starCount: 1,
        forkCount: 0,
        lastTimeBeenPushedInto: new Date(),
        owner
      }) satisfies IRepo)
  }
}
