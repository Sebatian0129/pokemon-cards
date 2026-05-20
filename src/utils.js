export function capitalize(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const API_BASE = 'https://api.pokemontcg.io/v2';
const PAGE_SIZE = 250;

export async function fetchAllCards(name) {
  const firstRes = await fetch(
    `${API_BASE}/cards?q=name:*${encodeURIComponent(name)}*&pageSize=${PAGE_SIZE}&page=1&orderBy=set.releaseDate`
  );
  if (!firstRes.ok) throw new Error('Error al conectar con la API');
  const firstData = await firstRes.json();
  const { data, totalCount } = firstData;

  if (totalCount <= PAGE_SIZE) return data;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const extraPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const extraResults = await Promise.all(
    extraPages.map((page) =>
      fetch(
        `${API_BASE}/cards?q=name:*${encodeURIComponent(name)}*&pageSize=${PAGE_SIZE}&page=${page}&orderBy=set.releaseDate`
      )
        .then((r) => r.json())
        .then((d) => d.data)
    )
  );
  return [...data, ...extraResults.flat()];
}
