// Boot + wiring: dataset/section pickers, hash deep-links, info panel.
import { t, applyI18n } from './i18n.js?v=5';
import { loadIndex, loadManifest, loadLines, loadLongitudinal, loadStrays, loadSection } from './data.js?v=5';
import { initMap, drawDataset, selectSection as mapSelect, setHoverPoint, clearHoverPoint } from './map.js?v=5';
import { initChart, showSection, showLongitudinal, setVE, clearChart } from './chart.js?v=5';

const $ = (id) => document.getElementById(id);
const state = { index: null, dataset: null, manifest: null, sectionId: null };

function setHash() {
  const parts = [];
  if (state.dataset) parts.push(state.dataset.id);
  if (state.sectionId) parts.push(state.sectionId);
  const h = `#${parts.join('/')}`;
  if (location.hash !== h) history.replaceState(null, '', h);
}

function parseHash() {
  const [ds, sec] = location.hash.replace(/^#/, '').split('/');
  return { ds: ds || null, sec: sec || null };
}

function showPrompt(msg) {
  const el = $('chart-prompt');
  el.textContent = msg;
  el.style.display = msg ? 'flex' : 'none';
}

function setInfo(html) {
  $('info').innerHTML = html;
}

async function pickSection(sectionId, { fit = true } = {}) {
  const m = state.manifest.sections.find((s) => s.id === sectionId);
  if (!m) return;
  state.sectionId = sectionId;
  $('section-select').value = sectionId;
  showPrompt('');
  try {
    const sec = await loadSection(state.dataset.path, m.file);
    showSection(sec);
    if (fit) mapSelect(sectionId);
    const dl = $('download');
    dl.href = `${state.dataset.path}/${m.csv}`;
    dl.setAttribute('download', `${m.id}.csv`);
    dl.style.display = '';
    setInfo(
      `<b>${m.id}</b> · ${t.points}: ${m.points} · ${t.width}: ${m.length_m} ${t.meters}`
      + ` · ${t.elevation.replace(' (ມ, MSL)', '')}: ${m.zmin}–${m.zmax} ${t.meters}`,
    );
    setHash();
  } catch (err) {
    showPrompt(`${t.error_load}: ${err.message}`);
  }
}

async function pickLongitudinal() {
  state.sectionId = null;
  $('section-select').value = '';
  $('download').style.display = 'none';
  showPrompt('');
  const longi = await loadLongitudinal(state.dataset.path);
  showLongitudinal(longi);
  const lm = state.manifest.longitudinal;
  setInfo(`<b>${t.longitudinal}</b> · ${t.points}: ${lm.points}`);
  setHash();
}

async function pickDataset(id, sectionId = null) {
  const ds = state.index.datasets.find((d) => d.id === id) || state.index.datasets[0];
  if (!ds) return;
  state.dataset = ds;
  state.sectionId = null;
  $('dataset-select').value = ds.id;
  showPrompt(t.loading);
  clearChart();
  clearHoverPoint();
  try {
    const [manifest, lines, longi, strays] = await Promise.all([
      loadManifest(ds.path), loadLines(ds.path),
      loadLongitudinal(ds.path), loadStrays(ds.path),
    ]);
    state.manifest = manifest;
    const dlAll = $('download-all');
    if (manifest.csv_zip) {
      dlAll.href = `${ds.path}/${manifest.csv_zip.file}`;
      dlAll.setAttribute('download', `${ds.id}_csv.zip`);
      dlAll.style.display = '';
    } else {
      dlAll.style.display = 'none';
    }
    drawDataset(lines, longi, strays, {
      onSection: (sid) => pickSection(sid),
      onLongitudinal: () => pickLongitudinal(),
    });
    const sel = $('section-select');
    sel.innerHTML = `<option value="" disabled selected>${t.section}…</option>`
      + manifest.sections.map((s) =>
        `<option value="${s.id}">${s.id} (${s.length_m} ${t.meters})</option>`).join('');
    $('download').style.display = 'none';
    setInfo(`<b>${ds.name}</b> · ${t.section}: ${manifest.counts.sections}`
      + ` · ${t.points}: ${manifest.counts.total}`);
    if (sectionId) {
      await pickSection(sectionId);
    } else {
      showPrompt(t.select_prompt);
      setHash();
    }
  } catch (err) {
    showPrompt(`${t.error_load}: ${err.message}`);
  }
}

async function boot() {
  applyI18n();
  document.title = t.title;
  initMap($('map'));
  initChart($('chart'), (lat, lng) => {
    if (lat === null) clearHoverPoint();
    else setHoverPoint(lat, lng);
  });

  $('dataset-select').addEventListener('change', (e) => pickDataset(e.target.value));
  $('section-select').addEventListener('change', (e) => pickSection(e.target.value));
  $('ve-select').addEventListener('change', (e) => setVE(e.target.value));
  window.addEventListener('hashchange', () => {
    const { ds, sec } = parseHash();
    if (ds && state.dataset && ds !== state.dataset.id) pickDataset(ds, sec);
    else if (sec && sec !== state.sectionId) pickSection(sec);
  });

  try {
    state.index = await loadIndex();
  } catch (err) {
    showPrompt(`${t.error_load}: ${err.message}`);
    return;
  }
  const sel = $('dataset-select');
  sel.innerHTML = state.index.datasets.map((d) =>
    `<option value="${d.id}">${d.name}</option>`).join('');
  const { ds, sec } = parseHash();
  await pickDataset(ds || state.index.datasets[0].id, sec);
}

boot();
