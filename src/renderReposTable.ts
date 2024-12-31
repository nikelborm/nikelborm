import { renderRepoToMarkdownBadge } from './markdownBadgeToAndFrom.js';
import { IRepo } from './repo.interface.js';

export function renderReposTableToMarkdown(allRepos: IRepo[], columnsAmount: number) {
  const _ = Object.values(
    Object.groupBy(
      allRepos,
      (_, i) => Math.floor(i / columnsAmount)
    )
  ) as IRepo[][];
  const [rowsExceptFirst, firstRow] = [_, _.shift() || []] as const;

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

function renderRow(reposGroup: IRepo[], columnsAmount: number) {
  return Array
    .from(
      /* `columnsAmount` maintains amount of columns in cases when the group is half-full */
      /* `+2` adds | to the sides */
      { length: columnsAmount + 2 },
      (_, i) => renderCell(reposGroup[i - 1])
    )
    .join('|')
}

function renderCell(repo?: IRepo) {
  if (!repo) return '';

  return renderRepoToMarkdownBadge(repo, /* THEME */);
}
