import { readFile } from 'node:fs/promises';
import { IRepo } from './repo.interface.js';

export async function getMockRepos() {
  try {
    return (JSON.parse( /* searches for this file relative to CWD */
      await readFile('./reposCreatedAndStarredByMe.json', 'utf-8')
    ) as IRepo[])
      .map(({ lastTimeBeenPushedInto, ...rest }) => ({
        ...rest,
        lastTimeBeenPushedInto: lastTimeBeenPushedInto
          ? new Date(lastTimeBeenPushedInto)
          : null
      }));
  } catch (error) {
    return ["apache-superset-quick-init", "download-github-folder"]
      .map(name => ({
        name,
        isItArchived: false,
        isTemplate: false,
        lastTimeBeenPushedInto: new Date(),
        owner: 'mock'
      }))
  }
}
