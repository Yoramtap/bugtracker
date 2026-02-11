"use strict";

const TEAM_CONFIG = [
  { key: "api", label: "API" },
  { key: "legacy", label: "Legacy FE" },
  { key: "react", label: "React FE" },
  { key: "bc", label: "BC" },
];

const PRIORITY_CONFIG = [
  { key: "highest", label: "Highest" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "lowest", label: "Lowest" },
];

const PRIORITY_LABELS = PRIORITY_CONFIG.reduce((acc, priority) => {
  acc[priority.key] = priority.label;
  return acc;
}, {});

const CHART_COLORS = {
  transparent: "rgba(0,0,0,0)",
};

const state = {
  snapshot: null,
  mode: "all",
};

function readThemeColor(name, fallback) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function getThemeColors() {
  return {
    text: readThemeColor("--text", "#172b4d"),
    grid: readThemeColor("--chart-grid", "rgba(9,30,66,0.14)"),
    active: readThemeColor("--chart-active", "#0c66e4"),
    teams: {
      api: readThemeColor("--team-api", "#2f6ea8"),
      legacy: readThemeColor("--team-legacy", "#8d6f3f"),
      react: readThemeColor("--team-react", "#3f7f75"),
      bc: readThemeColor("--team-bc", "#76649a"),
    },
    priorities: {
      highest: readThemeColor("--priority-highest", "#9f4d44"),
      high: readThemeColor("--priority-high", "#b48238"),
      medium: readThemeColor("--priority-medium", "#6f778d"),
      low: readThemeColor("--priority-low", "#3f73b8"),
      lowest: readThemeColor("--priority-lowest", "#2f7a67"),
    },
    barBorder: readThemeColor("--bar-border", "rgba(25,39,58,0.35)"),
  };
}

function buildBaseLayout(colors) {
  return {
    paper_bgcolor: CHART_COLORS.transparent,
    plot_bgcolor: CHART_COLORS.transparent,
    font: { color: colors.text },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "left",
      x: 0,
      font: { color: colors.text },
    },
    modebar: {
      bgcolor: CHART_COLORS.transparent,
      color: colors.text,
      activecolor: colors.active,
    },
  };
}

function getModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const chart = (params.get("chart") || "").toLowerCase();
  if (chart === "trend") return "trend";
  if (chart === "composition") return "composition";
  return "all";
}

function applyModeVisibility() {
  const trendPanel = document.getElementById("trend-panel");
  const compositionPanel = document.getElementById("composition-panel");
  if (!trendPanel || !compositionPanel) return;

  if (state.mode === "trend") {
    trendPanel.hidden = false;
    compositionPanel.hidden = true;
    return;
  }

  if (state.mode === "composition") {
    trendPanel.hidden = true;
    compositionPanel.hidden = false;
    return;
  }

  trendPanel.hidden = false;
  compositionPanel.hidden = false;
}

function toNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function totalForPoint(point) {
  return (
    toNumber(point.highest) +
    toNumber(point.high) +
    toNumber(point.medium) +
    toNumber(point.low) +
    toNumber(point.lowest)
  );
}

function breakdownText(point) {
  return PRIORITY_CONFIG.map((priority) => {
    const value = toNumber(point[priority.key]);
    return `${PRIORITY_LABELS[priority.key]}: ${value}`;
  }).join("<br>");
}

function formatDateShort(date) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${month}/${day}`;
}

function renderLineChart() {
  if (!state.snapshot || !Array.isArray(state.snapshot.combinedPoints)) return;
  const themeColors = getThemeColors();

  const x = state.snapshot.combinedPoints.map((point) => point.date);
  const traces = TEAM_CONFIG.map((team) => {
    const y = state.snapshot.combinedPoints.map((point) => totalForPoint(point[team.key]));
    const customData = state.snapshot.combinedPoints.map((point) =>
      breakdownText(point[team.key])
    );
    return {
      type: "scatter",
      mode: "lines+markers",
      name: team.label,
      x,
      y,
      customdata: customData,
      hovertemplate:
        "<b>%{fullData.name}</b><br>Date: %{x}<br>Total: %{y}<br>%{customdata}<extra></extra>",
      line: { color: themeColors.teams[team.key], width: 3 },
      marker: { size: 7 },
    };
  });

  const layout = {
    ...buildBaseLayout(themeColors),
    uirevision: "backlog-line",
    margin: { t: 18, r: 20, b: 42, l: 56 },
    xaxis: {
      title: "Date",
      tickangle: -30,
      color: themeColors.text,
      gridcolor: themeColors.grid,
      automargin: true,
    },
    yaxis: {
      title: "Open Bugs",
      rangemode: "tozero",
      color: themeColors.text,
      gridcolor: themeColors.grid,
      automargin: true,
    },
  };

  Plotly.react("chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true,
  });
}

function renderStackedBarChart() {
  if (!state.snapshot || !Array.isArray(state.snapshot.combinedPoints)) return;
  const themeColors = getThemeColors();

  const root = document.getElementById("stacked-chart");
  if (!root) return;

  const points = state.snapshot.combinedPoints;
  const flat = [];
  points.forEach((point) => {
    TEAM_CONFIG.forEach((team) => {
      const teamPoint = point[team.key];
      flat.push({
        date: point.date,
        dateShort: formatDateShort(point.date),
        team: team.label,
        total: totalForPoint(teamPoint),
        highest: toNumber(teamPoint.highest),
        high: toNumber(teamPoint.high),
        medium: toNumber(teamPoint.medium),
        low: toNumber(teamPoint.low),
        lowest: toNumber(teamPoint.lowest),
      });
    });
  });

  const x = [flat.map((item) => item.dateShort), flat.map((item) => item.team)];
  const traces = PRIORITY_CONFIG.map((priority) => ({
    type: "bar",
    name: priority.label,
    marker: {
      color: themeColors.priorities[priority.key],
      line: { color: themeColors.barBorder, width: 0.7 },
    },
    x,
    y: flat.map((item) => item[priority.key]),
    customdata: flat.map((item) => [item.date, item.team, item.total]),
    hovertemplate:
      "<b>%{customdata[1]}</b><br>Date: %{customdata[0]}<br>" +
      `${priority.label}: %{y}<br>Total: %{customdata[2]}<extra></extra>`,
  }));

  const layout = {
    ...buildBaseLayout(themeColors),
    barmode: "stack",
    uirevision: "backlog-stack",
    margin: { t: 18, r: 16, b: 86, l: 56 },
    bargap: 0.36,
    xaxis: {
      type: "multicategory",
      tickangle: -90,
      tickfont: { size: 9 },
      color: themeColors.text,
      showgrid: false,
      automargin: true,
    },
    yaxis: {
      title: "Open Bugs",
      rangemode: "tozero",
      color: themeColors.text,
      gridcolor: themeColors.grid,
      automargin: true,
    },
  };

  Plotly.react("stacked-chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true,
  });
}

async function loadSnapshot() {
  const status = document.getElementById("status");
  status.hidden = true;
  state.mode = getModeFromUrl();
  applyModeVisibility();

  try {
    const response = await fetch("./snapshot.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    state.snapshot = await response.json();
    if (state.mode !== "composition") {
      renderLineChart();
    }
    if (state.mode !== "trend") {
      renderStackedBarChart();
    }
  } catch (error) {
    status.hidden = false;
    status.textContent = `Failed to load snapshot.json: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

loadSnapshot();
