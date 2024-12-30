export interface IRepo {
  owner: string;
  name: string;
}

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


function renderRepoToMarkdownBadge(
  { owner, name }: IRepo,
  /**
   * [Available Themes](https://github.com/anuraghazra/github-readme-stats/blob/master/themes/README.md)
   */
  // theme: string
) {
  const repoSvgImageURL = new URL(
    'api/pin',
    'https://github-readme-stats.vercel.app',
  );

  repoSvgImageURL.search = '?' + new URLSearchParams({
    username: owner,
    repo: name,
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

  const repoURL = `https://github.com/${owner}/${name}`;

  return `[![${name} repo](${repoSvgImageURL})](${repoURL})`;
}

function renderCell(repo?: IRepo) {
  if (!repo) return '';

  return renderRepoToMarkdownBadge(repo, /* THEME */);
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
