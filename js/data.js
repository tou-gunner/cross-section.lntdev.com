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

// Cache busting (site sits behind Cloudflare + a 12h expires rule): the index
// is rewritten in place when datasets change, so fetch it fresh every load;
// per-dataset files are keyed to the dataset's `updated` stamp from the index,
// so a rebuild changes their URLs and needs no manual purge.
const bust = (u) => (u ? `?u=${encodeURIComponent(u)}` : '');

export const loadIndex = () => getJSON(`datasets/datasets.json?t=${Date.now()}`);
export const loadManifest = (path, u) => getJSON(`${path}/manifest.json${bust(u)}`);
export const loadLines = (path, u) => getJSON(`${path}/lines.json${bust(u)}`);
// tolerate absence (404 only): datasets rebuilt before the multibeam feature
// lack the file; other failures must surface like every other loader's
export const loadMultibeamLines = (path, u) =>
  getJSON(`${path}/multibeam_lines.json${bust(u)}`)
    .catch((err) => {
      if (/HTTP 404$/.test(err.message)) return { type: 'FeatureCollection', features: [] };
      throw err;
    });
export const loadLongitudinal = (path, u) => getJSON(`${path}/longitudinal.json${bust(u)}`);
export const loadStrays = (path, u) => getJSON(`${path}/strays.json${bust(u)}`);
export const loadSection = (path, file, u) => getJSON(`${path}/${file}${bust(u)}`);
