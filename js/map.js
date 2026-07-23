// Leaflet plan-view map: basemaps, section lines, multibeam lines,
// longitudinal line, strays.
/* global L */
import { t } from './i18n.js?v=10';

const STYLE_NORMAL = { color: '#00e5ff', weight: 3, opacity: 0.9 };
const STYLE_MULTIBEAM = { color: '#2eff7b', weight: 3, opacity: 0.9 };
const STYLE_SELECTED = { color: '#ffd400', weight: 5, opacity: 1 };
const LABEL_ZOOM = 13;

let map;
let sectionLayer = null;
let multibeamLayer = null;
let longiLayer = null;
let strayLayer = null;
let layerControl = null;
let hoverMarker = null;
let layersById = {};
let selectedId = null;

export function initMap(el) {
  const esri = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles © Esri — Esri, Maxar, Earthstar Geographics' });
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19, attribution: '© OpenStreetMap contributors' });

  map = L.map(el, { center: [18.1, 102.1], zoom: 10, layers: [esri] });
  layerControl = L.control.layers(
    { [t.satellite]: esri, [t.osm]: osm }, {}, { collapsed: true }).addTo(map);
  L.control.scale({ metric: true, imperial: false }).addTo(map);
  map.on('zoomend', refreshLabels);
  window._xsmap = map; // debugging/tests
  return map;
}

function refreshLabels() {
  const permanent = map.getZoom() >= LABEL_ZOOM;
  [sectionLayer, multibeamLayer].forEach((grp) => {
    if (!grp) return;
    grp.eachLayer((l) => {
      const wasPermanent = l._labelPermanent === true;
      if (wasPermanent === permanent && l.getTooltip()) return;
      l.unbindTooltip();
      l.bindTooltip(l.feature.properties.id, {
        permanent, direction: 'center', className: 'xs-label', sticky: !permanent,
      });
      l._labelPermanent = permanent;
    });
  });
}

export function drawDataset(lines, mbLines, longi, strays, callbacks) {
  [sectionLayer, multibeamLayer, longiLayer, strayLayer]
    .forEach((l) => l && map.removeLayer(l));
  if (multibeamLayer) layerControl.removeLayer(multibeamLayer);
  if (longiLayer) layerControl.removeLayer(longiLayer);
  if (strayLayer) layerControl.removeLayer(strayLayer);
  layersById = {};
  selectedId = null;
  clearHoverPoint();

  sectionLayer = L.geoJSON(lines, {
    style: STYLE_NORMAL,
    onEachFeature: (f, l) => {
      layersById[f.properties.id] = l;
      l._baseStyle = STYLE_NORMAL;
      l.on('click', () => callbacks.onSection(f.properties.id));
    },
  }).addTo(map);

  multibeamLayer = L.geoJSON(mbLines, {
    style: STYLE_MULTIBEAM,
    onEachFeature: (f, l) => {
      layersById[f.properties.id] = l;
      l._baseStyle = STYLE_MULTIBEAM;
      l.on('click', () => callbacks.onSection(f.properties.id));
    },
  });
  if (mbLines.features.length) {
    multibeamLayer.addTo(map); // visible by default — toggle via layer control
    layerControl.addOverlay(multibeamLayer, t.multibeam);
  }
  refreshLabels();

  longiLayer = L.geoJSON(longi, { style: { color: '#ff8c00', weight: 2.5, opacity: 0.9 } });
  longiLayer.eachLayer((l) => l.on('click', () => callbacks.onLongitudinal()));
  layerControl.addOverlay(longiLayer, t.longitudinal); // hidden by default — enable via layer control

  strayLayer = L.geoJSON(strays, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 4, color: '#ff3b30', weight: 1, fillColor: '#ff3b30', fillOpacity: 0.8,
    }).bindTooltip(`No.${f.properties.no} — ${f.properties.z} ${t.meters} (${f.properties.reason})`),
  });
  if (strays.features.length) {
    layerControl.addOverlay(strayLayer, t.strays); // hidden by default
  }

  const b = sectionLayer.getBounds();
  b.extend(multibeamLayer.getBounds());
  if (b.isValid()) map.fitBounds(b.pad(0.05), { animate: false });
}

export function selectSection(id) {
  if (selectedId && layersById[selectedId]) {
    const prev = layersById[selectedId];
    prev.setStyle(prev._baseStyle || STYLE_NORMAL);
  }
  selectedId = id;
  const layer = layersById[id];
  if (!layer) return;
  layer.setStyle(STYLE_SELECTED);
  layer.bringToFront();
  map.fitBounds(layer.getBounds().pad(0.35), { maxZoom: 17 });
}

export function setHoverPoint(lat, lng) {
  if (!hoverMarker) {
    hoverMarker = L.circleMarker([lat, lng], {
      radius: 7, color: '#ffffff', weight: 2, fillColor: '#ffd400', fillOpacity: 1,
      interactive: false,
    });
  }
  hoverMarker.setLatLng([lat, lng]);
  if (!map.hasLayer(hoverMarker)) hoverMarker.addTo(map);
}

export function clearHoverPoint() {
  if (hoverMarker && map && map.hasLayer(hoverMarker)) map.removeLayer(hoverMarker);
}
