// ECharts station–elevation profile with vertical-exaggeration control.
/* global echarts */
import { t } from './i18n.js?v=6';

const GRID = { left: 74, right: 28, top: 48, bottom: 70 };
const FONT = "'Noto Sans Lao', 'Phetsarath OT', system-ui, sans-serif";

let chart = null;
let hoverCb = null;
let current = null; // { points, meta, xmin, xmax, xLabel, id }
let currentVE = 'auto';

export function initChart(el, onHover) {
  chart = echarts.init(el);
  hoverCb = onHover;
  window.addEventListener('resize', () => { chart.resize(); applyVE(); });
  chart.on('dataZoom', applyVE);
  chart.on('restore', () => { currentVE = 'auto'; syncVESelect(); });
  chart.on('updateAxisPointer', (e) => {
    const axisInfo = e.axesInfo && e.axesInfo[0];
    if (!axisInfo || !current) return;
    const m = nearestMeta(axisInfo.value);
    if (m && hoverCb) hoverCb(m.lat, m.lng);
  });
  chart.on('globalout', () => hoverCb && hoverCb(null, null));
}

function nearestMeta(x) {
  const pts = current.points;
  let best = null;
  let bestD = Infinity;
  // linear scan is fine (< 2k points)
  for (let i = 0; i < pts.length; i++) {
    if (pts[i][1] === null || !current.meta[i]) continue;
    const d = Math.abs(pts[i][0] - x);
    if (d < bestD) { bestD = d; best = current.meta[i]; }
  }
  return best;
}

// Build [x, z] pairs with a null break inserted inside every recorded gap.
function buildSeries(sec) {
  const points = [];
  const meta = [];
  const gapAfter = new Set((sec.gaps || []).map((g) => g.after_no));
  for (let i = 0; i < sec.offset.length; i++) {
    points.push([sec.offset[i], sec.z[i]]);
    meta.push({ no: sec.no[i], n: sec.n[i], e: sec.e[i], lat: sec.lat[i], lng: sec.lng[i], z: sec.z[i] });
    if (gapAfter.has(sec.no[i]) && i + 1 < sec.offset.length) {
      points.push([(sec.offset[i] + sec.offset[i + 1]) / 2, null]);
      meta.push(null);
    }
  }
  return { points, meta };
}

function baseOption(id, xLabel, points) {
  return {
    textStyle: { fontFamily: FONT },
    title: { text: id, left: 8, top: 4, textStyle: { fontSize: 14, fontWeight: 700 } },
    grid: GRID,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', snap: true },
      formatter: (params) => {
        const p = params.find((q) => q.value && q.value[1] !== null);
        if (!p) return '';
        const m = current.meta[p.dataIndex];
        if (!m) return '';
        let html = `${t.distance}: <b>${p.value[0].toFixed(2)}</b> ${t.meters}<br>`
          + `${t.level}: <b>${m.z.toFixed(3)}</b> ${t.meters} (MSL)`;
        if (m.n !== undefined) {
          html += `<br>N: ${m.n.toFixed(3)} / E: ${m.e.toFixed(3)}`
            + `<br>${t.point_no} ${m.no}`;
        }
        return html;
      },
    },
    toolbox: {
      right: 12,
      feature: {
        dataZoom: { yAxisIndex: 'none', title: { zoom: t.zoom_x, back: t.restore } },
        restore: { title: t.restore },
        saveAsImage: { name: id, title: t.save_png, backgroundColor: '#ffffff' },
      },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, height: 22, bottom: 8 },
    ],
    xAxis: {
      type: 'value', name: xLabel, nameLocation: 'middle', nameGap: 28,
      min: 'dataMin', max: 'dataMax',
      axisLabel: { formatter: (v) => Math.round(v) },
    },
    yAxis: {
      type: 'value', name: t.elevation, nameLocation: 'middle', nameGap: 52,
      scale: true, axisLabel: { formatter: (v) => v.toFixed(1) },
    },
    series: [{
      type: 'line', data: points, showSymbol: false, symbolSize: 5,
      lineStyle: { width: 2, color: '#1565c0' },
      itemStyle: { color: '#1565c0' },
      areaStyle: { color: 'rgba(21, 101, 192, 0.18)', origin: 'start' },
      connectNulls: false,
    }],
  };
}

export function showSection(sec) {
  const { points, meta } = buildSeries(sec);
  current = {
    points, meta, id: sec.id,
    xmin: sec.offset[0], xmax: sec.offset[sec.offset.length - 1],
  };
  chart.clear();
  chart.setOption(baseOption(sec.id, t.offset, points));
  applyVE();
}

export function showLongitudinal(longi) {
  const points = [];
  const meta = [];
  longi.features.forEach((f, fi) => {
    const { chainage, z } = f.properties;
    const coords = f.geometry.coordinates;
    if (fi > 0 && points.length) {
      points.push([(points[points.length - 1][0] + chainage[0]) / 2, null]);
      meta.push(null);
    }
    for (let i = 0; i < chainage.length; i++) {
      points.push([chainage[i], z[i]]);
      meta.push({ lat: coords[i][1], lng: coords[i][0], z: z[i] });
    }
  });
  current = {
    points, meta, id: t.longitudinal,
    xmin: points.length ? points[0][0] : 0,
    xmax: points.length ? points[points.length - 1][0] : 0,
  };
  chart.clear();
  chart.setOption(baseOption(t.longitudinal, t.chainage, points));
  applyVE();
}

export function setVE(ve) {
  currentVE = ve;
  applyVE();
}

function visibleXWindow() {
  const opt = chart.getOption();
  const dz = opt.dataZoom && opt.dataZoom[0];
  let xmin = current.xmin;
  let xmax = current.xmax;
  if (dz) {
    if (dz.startValue != null && dz.endValue != null) {
      xmin = dz.startValue; xmax = dz.endValue;
    } else if (dz.start != null && dz.end != null) {
      const span = current.xmax - current.xmin;
      xmin = current.xmin + (span * dz.start) / 100;
      xmax = current.xmin + (span * dz.end) / 100;
    }
  }
  return [xmin, xmax];
}

function applyVE() {
  if (!chart || !current) return;
  if (currentVE === 'auto') {
    chart.setOption({ yAxis: { min: null, max: null, scale: true } });
    return;
  }
  const ve = Number(currentVE);
  const [xmin, xmax] = visibleXWindow();
  let zlo = Infinity;
  let zhi = -Infinity;
  for (const [x, z] of current.points) {
    if (z === null || x < xmin || x > xmax) continue;
    if (z < zlo) zlo = z;
    if (z > zhi) zhi = z;
  }
  if (!isFinite(zlo)) return;
  const pxW = Math.max(50, chart.getWidth() - GRID.left - GRID.right);
  const pxH = Math.max(50, chart.getHeight() - GRID.top - GRID.bottom);
  const yspan = ((xmax - xmin) * (pxH / pxW)) / ve;
  const ymid = (zlo + zhi) / 2;
  chart.setOption({ yAxis: { min: ymid - yspan / 2, max: ymid + yspan / 2 } });
}

function syncVESelect() {
  const sel = document.getElementById('ve-select');
  if (sel) sel.value = 'auto';
  applyVE();
}

export function clearChart() {
  current = null;
  if (chart) chart.clear();
}
