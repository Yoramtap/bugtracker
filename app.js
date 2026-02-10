"use strict";

const TEAM_CONFIG = [
  { key: "api", label: "API", color: "#64B5F6" },
  { key: "legacy", label: "Legacy FE", color: "#FFB74D" },
  { key: "react", label: "React FE", color: "#81C784" },
  { key: "bc", label: "BC", color: "#BA68C8" },
];

const PRIORITY_LABELS = {
  highest: "Highest",
  high: "High",
  medium: "Medium",
  low: "Low",
  lowest: "Lowest",
};

const state = {
  snapshot: null,
  visible: {
    api: true,
    legacy: true,
    react: true,
    bc: true,
  },
};

function totalForPoint(point) {
  return point.highest + point.high + point.medium + point.low + point.lowest;
}

function breakdownText(point) {
  return [
    `${PRIORITY_LABELS.highest}: ${point.highest}`,
    `${PRIORITY_LABELS.high}: ${point.high}`,
    `${PRIORITY_LABELS.medium}: ${point.medium}`,
    `${PRIORITY_LABELS.low}: ${point.low}`,
    `${PRIORITY_LABELS.lowest}: ${point.lowest}`,
  ].join("<br>");
}

function renderTeamControls() {
  const root = document.getElementById("team-controls");
  root.innerHTML = "";

  TEAM_CONFIG.forEach((team) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.active = String(state.visible[team.key]);
    btn.textContent = team.label;

    btn.addEventListener("click", () => {
      const next = { ...state.visible, [team.key]: !state.visible[team.key] };
      if (!Object.values(next).some(Boolean)) return;
      state.visible = next;
      renderTeamControls();
      renderChart();
    });

    root.appendChild(btn);
  });
}

function renderMeta() {
  const meta = document.getElementById("meta");
  const source = state.snapshot && state.snapshot.source ? state.snapshot.source : {};
  const syncedAt = source.syncedAt || "Unknown";
  const updatedAt = state.snapshot && state.snapshot.updatedAt ? state.snapshot.updatedAt : "Unknown";
  meta.textContent = `Synced: ${syncedAt} | Updated: ${updatedAt}`;
}

function renderChart() {
  if (!state.snapshot || !Array.isArray(state.snapshot.combinedPoints)) return;

  const x = state.snapshot.combinedPoints.map((p) => p.date);
  const traces = TEAM_CONFIG.map((team) => {
    const y = state.snapshot.combinedPoints.map((p) => totalForPoint(p[team.key]));
    const customData = state.snapshot.combinedPoints.map((p) => breakdownText(p[team.key]));
    return {
      type: "scatter",
      mode: "lines+markers",
      name: team.label,
      x,
      y,
      customdata: customData,
      hovertemplate:
        "<b>%{fullData.name}</b><br>Date: %{x}<br>Total: %{y}<br>%{customdata}<extra></extra>",
      line: { color: team.color, width: 3 },
      marker: { size: 7 },
      visible: state.visible[team.key] ? true : "legendonly",
    };
  });

  const layout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { t: 18, r: 20, b: 42, l: 56 },
    xaxis: {
      title: "Date",
      tickangle: -30,
      color: "#d9e8ff",
      gridcolor: "rgba(175,203,250,0.12)",
    },
    yaxis: {
      title: "Open Bugs",
      rangemode: "tozero",
      color: "#d9e8ff",
      gridcolor: "rgba(175,203,250,0.12)",
    },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "left",
      x: 0,
      font: { color: "#d9e8ff" },
    },
  };

  Plotly.newPlot("chart", traces, layout, {
    displayModeBar: true,
    responsive: true,
  });
}

async function loadSnapshot() {
  const status = document.getElementById("status");
  status.hidden = true;
  try {
    const response = await fetch("./snapshot.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.snapshot = await response.json();
    renderMeta();
    renderTeamControls();
    renderChart();
  } catch (error) {
    status.hidden = false;
    status.textContent = `Failed to load snapshot.json: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

loadSnapshot();
