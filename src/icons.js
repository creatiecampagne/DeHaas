const paths = {
  basin:'M3 17h18M4 21q2-3 4 0q2-3 4 0q2-3 4 0q2-3 4 0M7 16l-2-5 7-3 7 3-2 5M9 9V5h6v4M12 5V2',
  lift:'M3 21V3h18v18M3 6h18M6 6v7m12-7v7M8 12l4 2 4-2-1 5-3 3-3-3Z',
  wash:'M3 21c-2-7 8-2 8-7 0-3-6-1-6-5 0-2 3-3 5-3M10 5l5-3 2 3-5 3ZM18 8l1 2m2-5 1 1m-7 6 1 2m4-1 1 2',
  crane:'M5 22h11M9 21V5l4-3 9 3H2l7-3m0 6 4 4-4 4 4 4M13 5v16M20 5v8q3 3 0 3',
  yard:'M3 4h18v16H3ZM8 4v16M3 10h5M12 8h5m-5 4h5m-5 4h5',
  office:'M4 22V3h16v19M2 22h20M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 22v-4h4v4',
  hall:'M2 8l10-6 10 6M4 8v14h16V8L12 4ZM8 22V11h8v11M8 15h8M12 11v11',
  pontoons:'M2 4h20v4H2ZM6 8v9m5-9v9m5-9v9M2 21q2-3 4 0q2-3 4 0q2-3 4 0q2-3 4 0q2-3 4 0',
  chevron:'m9 5 7 7-7 7', plus:'M12 5v14M5 12h14', minus:'M5 12h14',
  reset:'M4 10a8 8 0 1 1 2 8M4 4v6h6', expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  panel:'M3 4h18v16H3ZM15 4v16m-7-6 3-2-3-2', pin:'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM10 10h4',
  orbit:'M4 7c4-5 13-4 16 1M20 3v5h-5M20 17c-4 5-13 4-16-1M4 21v-5h5',
  mouse:'M12 3a6 6 0 0 1 6 6v6a6 6 0 0 1-12 0V9a6 6 0 0 1 6-6ZM12 3v6',
  close:'m6 6 12 12M6 18 18 6', layers:'m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5',
  north:'m12 3 6 17-6-4-6 4Z', help:'M9 8a3 3 0 1 1 5 3c-2 1-2 2-2 3M12 18v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'
};
export function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.yard}"/></svg>`;}
