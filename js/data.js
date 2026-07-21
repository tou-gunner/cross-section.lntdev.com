// Fetch + cache for the static dataset files.
const cache = new Map();

function getJSON(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
      return r.json();
    }));
  }
  return cache.get(url);
}

export const loadIndex = () => getJSON('datasets/datasets.json');
export const loadManifest = (path) => getJSON(`${path}/manifest.json`);
export const loadLines = (path) => getJSON(`${path}/lines.json`);
export const loadLongitudinal = (path) => getJSON(`${path}/longitudinal.json`);
export const loadStrays = (path) => getJSON(`${path}/strays.json`);
export const loadSection = (path, file) => getJSON(`${path}/${file}`);
