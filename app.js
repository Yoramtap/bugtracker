"use strict";

const TEAM_CONFIG = [
  { key: "api", label: "API" },
  { key: "legacy", label: "Legacy FE" },
  { key: "react", label: "React FE" },
  { key: "bc", label: "BC" }
];

const PRIORITY_CONFIG = [
  { key: "highest", label: "Highest" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "lowest", label: "Lowest" }
];

const PRIORITY_LABELS = PRIORITY_CONFIG.reduce((acc, priority) => {
  acc[priority.key] = priority.label;
  return acc;
}, {});
const PRIORITY_STACK_ORDER = [...PRIORITY_CONFIG].reverse();

const CHART_COLORS = {
  transparent: "rgba(0,0,0,0)"
};
const SPRINT_GOALS_LOOKBACK = 6;
const SPRINT_GOALS_TEAMS = [
  "API",
  "Frontend",
  "Broadcast",
  "Titanium",
  "Orchestration",
  "Shift"
];
const PRODUCT_CYCLE_COMPARE_YEARS = ["2025", "2026"];
const PRODUCT_CYCLE_EFFORT_SCOPE_OPTIONS = ["all", "single", "combined"];
const LIFECYCLE_YEAR_OPTIONS = ["2025", "2026"];
const PRODUCT_CYCLE_PHASES = [
  {
    key: "parking_lot",
    label: "Parking lot",
    color: "var(--uat-bucket-0-7)"
  },
  {
    key: "design",
    label: "Design",
    color: "var(--uat-bucket-8-14)"
  },
  {
    key: "ready_for_development",
    label: "Ready",
    color: "var(--uat-bucket-15-30)"
  },
  {
    key: "in_development",
    label: "In Development",
    color: "var(--uat-bucket-31-60)"
  },
  {
    key: "feedback",
    label: "Feedback",
    color: "var(--uat-bucket-61-plus)"
  }
];

const state = {
  snapshot: null,
  sprintGoals: null,
  productCycle: null,
  mode: "all",
  managementUatScope: "all",
  compositionTeamScope: "bc",
  sprintGoalsTeamScope: "API",
  productCycleEffortScope: "all",
  productCycleMetricScope: "median",
  lifecycleDaysYearScope: "2026",
  lifecycleDaysMetricScope: "median"
};

function formatUpdatedAt(value) {
  const parsed = new Date(String(value || ""));
  if (!Number.isFinite(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function setLastUpdatedSubtitles(snapshot) {
  const label = `Last updated: ${formatUpdatedAt(snapshot?.updatedAt)}`;
  for (const id of [
    "trend-updated",
    "composition-updated",
    "uat-updated",
    "sprint-goals-updated",
    "product-cycle-updated",
    "lifecycle-days-updated"
  ]) {
    const node = document.getElementById(id);
    if (node) node.textContent = label;
  }

  const managementNode = document.getElementById("management-updated");
  if (managementNode) {
    managementNode.textContent = label;
  }
}

function setProductCycleUpdatedSubtitles(productCycle, fallbackUpdatedAt = "") {
  const label = `Last updated: ${formatUpdatedAt(productCycle?.generatedAt || fallbackUpdatedAt)}`;
  for (const id of ["product-cycle-updated", "lifecycle-days-updated"]) {
    const node = document.getElementById(id);
    if (node) node.textContent = label;
  }
}

function readThemeColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
      bc: readThemeColor("--team-bc", "#76649a")
    },
    priorities: {
      highest: readThemeColor("--priority-highest", "#9f4d44"),
      high: readThemeColor("--priority-high", "#b48238"),
      medium: readThemeColor("--priority-medium", "#6f778d"),
      low: readThemeColor("--priority-low", "#3f73b8"),
      lowest: readThemeColor("--priority-lowest", "#2f7a67")
    },
    uatBuckets: {
      d0_7: readThemeColor("--uat-bucket-0-7", "#a8c6de"),
      d8_14: readThemeColor("--uat-bucket-8-14", "#87aecd"),
      d15_30: readThemeColor("--uat-bucket-15-30", "#5f8fb7"),
      d31_60: readThemeColor("--uat-bucket-31-60", "#3f6f99"),
      d61_plus: readThemeColor("--uat-bucket-61-plus", "#2a4f73")
    },
    tooltip: {
      bg: readThemeColor("--tooltip-bg", "rgba(255,255,255,0.98)"),
      border: readThemeColor("--tooltip-border", "rgba(31,51,71,0.25)"),
      text: readThemeColor("--tooltip-text", "#1f3347")
    },
    barBorder: readThemeColor("--bar-border", "rgba(25,39,58,0.35)")
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
      font: { color: colors.text }
    },
    modebar: {
      bgcolor: CHART_COLORS.transparent,
      color: colors.text,
      activecolor: colors.active
    },
    hoverlabel: {
      bgcolor: colors.tooltip.bg,
      bordercolor: colors.tooltip.border,
      font: { color: colors.tooltip.text, size: 12 },
      namelength: -1
    }
  };
}

function buildChartXAxis(colors, overrides = {}) {
  return {
    color: colors.text,
    showgrid: false,
    showline: true,
    linecolor: colors.text,
    linewidth: 1,
    layer: "above traces",
    ticks: "outside",
    ticklen: 4,
    tickcolor: colors.text,
    automargin: true,
    ...overrides
  };
}

function buildChartYAxis(colors, overrides = {}) {
  return {
    color: colors.text,
    showgrid: true,
    gridcolor: colors.grid,
    gridwidth: 1,
    showline: true,
    linecolor: colors.text,
    linewidth: 1,
    zeroline: true,
    zerolinecolor: colors.text,
    zerolinewidth: 1,
    layer: "above traces",
    ticks: "outside",
    ticklen: 4,
    tickcolor: colors.text,
    automargin: true,
    ...overrides
  };
}

function buildBarMarker(colors, fillColor, options = {}) {
  const { stacked = false, rounded = false, radius = 0 } = options;
  if (stacked) {
    return {
      color: fillColor,
      line: { color: CHART_COLORS.transparent, width: 0 }
    };
  }

  const marker = {
    color: fillColor,
    line: { color: colors.barBorder, width: 0.9 }
  };
  if (rounded && radius > 0) {
    marker.cornerradius = radius;
  }
  return marker;
}

function getModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const chart = (params.get("chart") || "").toLowerCase();
  if (chart === "trend") return "trend";
  if (chart === "composition") return "composition";
  if (chart === "uat") return "uat";
  if (chart === "dev-uat-ratio") return "management";
  if (chart === "sprint-goals") return "sprint-goals";
  if (chart === "product-cycle" || chart === "cycle-time") return "product-cycle";
  if (chart === "lifecycle-days") return "lifecycle-days";
  return "all";
}

function applyModeVisibility() {
  const trendPanel = document.getElementById("trend-panel");
  const compositionPanel = document.getElementById("composition-panel");
  const uatPanel = document.getElementById("uat-panel");
  const managementPanel = document.getElementById("management-panel");
  const sprintGoalsPanel = document.getElementById("sprint-goals-panel");
  const productCyclePanel = document.getElementById("product-cycle-panel");
  const lifecycleDaysPanel = document.getElementById("lifecycle-days-panel");
  if (
    !trendPanel ||
    !compositionPanel ||
    !uatPanel ||
    !managementPanel ||
    !sprintGoalsPanel ||
    !productCyclePanel ||
    !lifecycleDaysPanel
  )
    return;

  if (state.mode === "trend") {
    trendPanel.hidden = false;
    compositionPanel.hidden = true;
    uatPanel.hidden = true;
    managementPanel.hidden = true;
    sprintGoalsPanel.hidden = true;
    productCyclePanel.hidden = true;
    lifecycleDaysPanel.hidden = true;
    return;
  }

  if (state.mode === "composition") {
    trendPanel.hidden = true;
    compositionPanel.hidden = false;
    uatPanel.hidden = true;
    managementPanel.hidden = true;
    sprintGoalsPanel.hidden = true;
    productCyclePanel.hidden = true;
    lifecycleDaysPanel.hidden = true;
    return;
  }

  if (state.mode === "uat") {
    trendPanel.hidden = true;
    compositionPanel.hidden = true;
    uatPanel.hidden = false;
    managementPanel.hidden = true;
    sprintGoalsPanel.hidden = true;
    productCyclePanel.hidden = true;
    lifecycleDaysPanel.hidden = true;
    return;
  }

  if (state.mode === "management") {
    trendPanel.hidden = true;
    compositionPanel.hidden = true;
    uatPanel.hidden = true;
    managementPanel.hidden = false;
    sprintGoalsPanel.hidden = true;
    productCyclePanel.hidden = true;
    lifecycleDaysPanel.hidden = true;
    return;
  }

  if (state.mode === "sprint-goals") {
    trendPanel.hidden = true;
    compositionPanel.hidden = true;
    uatPanel.hidden = true;
    managementPanel.hidden = true;
    sprintGoalsPanel.hidden = false;
    productCyclePanel.hidden = true;
    lifecycleDaysPanel.hidden = true;
    return;
  }

  if (state.mode === "product-cycle") {
    trendPanel.hidden = true;
    compositionPanel.hidden = true;
    uatPanel.hidden = true;
    managementPanel.hidden = true;
    sprintGoalsPanel.hidden = true;
    productCyclePanel.hidden = false;
    lifecycleDaysPanel.hidden = true;
    return;
  }

  if (state.mode === "lifecycle-days") {
    trendPanel.hidden = true;
    compositionPanel.hidden = true;
    uatPanel.hidden = true;
    managementPanel.hidden = true;
    sprintGoalsPanel.hidden = true;
    productCyclePanel.hidden = true;
    lifecycleDaysPanel.hidden = false;
    return;
  }

  trendPanel.hidden = false;
  compositionPanel.hidden = false;
  uatPanel.hidden = false;
  managementPanel.hidden = false;
  sprintGoalsPanel.hidden = false;
  productCyclePanel.hidden = false;
  lifecycleDaysPanel.hidden = false;
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
    const customData = state.snapshot.combinedPoints.map((point) => breakdownText(point[team.key]));
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
      marker: { size: 7 }
    };
  });
  const bcLongstanding = state.snapshot.combinedPoints.map((point) =>
    toNumber(point?.bc?.longstanding_30d_plus)
  );
  const bcLongstanding60 = state.snapshot.combinedPoints.map((point) =>
    toNumber(point?.bc?.longstanding_60d_plus)
  );
  const bcLongstandingHover = state.snapshot.combinedPoints.map((point) => {
    const bcPoint = point?.bc || {};
    return (
      `Broadcast long-standing (30d+): ${toNumber(bcPoint.longstanding_30d_plus)}` +
      `<br>Broadcast long-standing (60d+): ${toNumber(bcPoint.longstanding_60d_plus)}` +
      `<br>Broadcast total open: ${totalForPoint(bcPoint)}`
    );
  });
  traces.push({
    type: "scatter",
    mode: "lines+markers",
    name: "BC long-standing (30d+)",
    x,
    y: bcLongstanding,
    customdata: bcLongstandingHover,
    hovertemplate: "<b>%{fullData.name}</b><br>Date: %{x}<br>%{customdata}<extra></extra>",
    line: { color: "#8e9aaa", width: 2, dash: "dot" },
    marker: { size: 6, symbol: "diamond" }
  });
  traces.push({
    type: "scatter",
    mode: "lines+markers",
    name: "BC long-standing (60d+)",
    x,
    y: bcLongstanding60,
    customdata: bcLongstandingHover,
    hovertemplate: "<b>%{fullData.name}</b><br>Date: %{x}<br>%{customdata}<extra></extra>",
    line: { color: "#6f7f92", width: 2, dash: "dash" },
    marker: { size: 6, symbol: "triangle-up" }
  });

  const allYValues = traces.flatMap((trace) => trace.y).filter((value) => Number.isFinite(value));
  const maxY = allYValues.length ? Math.max(...allYValues) : 10;
  const paddedMaxY = Math.max(10, Math.ceil(maxY * 1.08));

  const layout = {
    ...buildBaseLayout(themeColors),
    uirevision: "backlog-line",
    margin: { t: 18, r: 20, b: 42, l: 56 },
    xaxis: {
      title: "Date",
      tickangle: -30,
      color: themeColors.text,
      gridcolor: themeColors.grid,
      showline: true,
      linecolor: themeColors.text,
      linewidth: 1,
      layer: "above traces",
      automargin: true
    },
    yaxis: {
      title: "Open Bugs",
      range: [0, paddedMaxY],
      color: themeColors.text,
      gridcolor: themeColors.grid,
      showline: true,
      linecolor: themeColors.text,
      linewidth: 1,
      zeroline: true,
      zerolinecolor: themeColors.text,
      zerolinewidth: 1,
      layer: "above traces",
      automargin: true
    }
  };

  Plotly.react("chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });
}

function renderStackedBarChart() {
  if (!state.snapshot || !Array.isArray(state.snapshot.combinedPoints)) return;
  const themeColors = getThemeColors();

  const root = document.getElementById("stacked-chart");
  if (!root) return;

  const points = state.snapshot.combinedPoints;
  const scopeSelect = document.getElementById("composition-team-scope");
  const scope = state.compositionTeamScope || "bc";
  if (scopeSelect) scopeSelect.value = scope;
  const teamsForChart =
    scope === "all" ? TEAM_CONFIG : TEAM_CONFIG.filter((team) => team.key === scope);
  const flat = [];
  points.forEach((point) => {
    teamsForChart.forEach((team) => {
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
        lowest: toNumber(teamPoint.lowest)
      });
    });
  });

  const x = [flat.map((item) => item.dateShort), flat.map((item) => item.team)];
  const traces = PRIORITY_STACK_ORDER.map((priority) => ({
    type: "bar",
    name: priority.label,
    marker: buildBarMarker(themeColors, themeColors.priorities[priority.key], { stacked: true }),
    x,
    y: flat.map((item) => item[priority.key]),
    customdata: flat.map((item) => [item.date, item.team, item.total]),
    hovertemplate:
      "<b>%{customdata[1]}</b><br>Date: %{customdata[0]}<br>" +
      `${priority.label}: %{y}<br>Total: %{customdata[2]}<extra></extra>`
  }));

  const layout = {
    ...buildBaseLayout(themeColors),
    barmode: "stack",
    uirevision: "backlog-stack",
    margin: { t: 18, r: 16, b: 86, l: 56 },
    bargap: 0.36,
    xaxis: buildChartXAxis(themeColors, {
      type: "multicategory",
      tickangle: -90,
      tickfont: { size: 9 }
    }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Open Bugs",
      rangemode: "tozero"
    })
  };

  Plotly.react("stacked-chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });
}

function renderUatAgingChart() {
  const status = document.getElementById("uat-status");
  const root = document.getElementById("uat-chart");
  const context = document.getElementById("uat-context");
  if (!status || !root) return;

  status.hidden = true;
  if (!state.snapshot || !state.snapshot.uatAging) {
    status.hidden = false;
    status.textContent = "No UAT aging data found in snapshot.json.";
    return;
  }

  const themeColors = getThemeColors();
  const uat = state.snapshot.uatAging;
  const scopeLabel = String(uat?.scope?.label || "Broadcast");
  if (context) context.textContent = `${scopeLabel}, ${toNumber(uat.totalIssues)} currently in UAT`;
  const allPriorities = PRIORITY_CONFIG.map((priority) => priority.key);
  const priorityLabels = PRIORITY_CONFIG.reduce((acc, priority) => {
    acc[priority.key] = priority.label;
    return acc;
  }, {});
  const buckets = Array.isArray(uat.buckets) ? uat.buckets : [];
  const priorities = allPriorities.filter((priority) =>
    buckets.some((bucket) => toNumber(uat?.priorities?.[priority]?.buckets?.[bucket.id]) > 0)
  );
  const bucketLabels = buckets.map((bucket) => bucket.label);
  const maxBarValue = buckets.reduce((maxSoFar, bucket) => {
    const bucketMax = priorities.reduce((priorityMax, priority) => {
      const value = toNumber(uat?.priorities?.[priority]?.buckets?.[bucket.id]);
      return Math.max(priorityMax, value);
    }, 0);
    return Math.max(maxSoFar, bucketMax);
  }, 0);
  const paddedMaxY = maxBarValue > 0 ? Math.ceil(maxBarValue * 1.12) : 1;

  if (buckets.length === 0) {
    status.hidden = false;
    status.textContent = "UAT aging buckets are missing from snapshot.json.";
    return;
  }

  // Robust grouped layout: center only the bars that actually exist in each bucket.
  const perPriority = Object.fromEntries(
    priorities.map((priority) => [
      priority,
      { x: [], y: [], width: [], customdata: [] }
    ])
  );
  const intraBucketGap = 0.02;
  const bucketSpan = 0.82;
  buckets.forEach((bucket, bucketIndex) => {
    const total = priorities.reduce(
      (sum, p) => sum + toNumber(uat?.priorities?.[p]?.buckets?.[bucket.id]),
      0
    );
    const active = priorities
      .map((priority) => ({
        priority,
        value: toNumber(uat?.priorities?.[priority]?.buckets?.[bucket.id])
      }))
      .filter((item) => item.value > 0);
    if (active.length === 0) return;

    const barWidth = Math.max(
      0.2,
      Math.min(0.38, (bucketSpan - (active.length - 1) * intraBucketGap) / active.length)
    );
    const totalWidth = active.length * barWidth + (active.length - 1) * intraBucketGap;
    const start = bucketIndex - totalWidth / 2 + barWidth / 2;

    active.forEach((item, idx) => {
      const slot = perPriority[item.priority];
      slot.x.push(start + idx * (barWidth + intraBucketGap));
      slot.y.push(item.value);
      slot.width.push(barWidth);
      slot.customdata.push({ total, bucket: bucket.label });
    });
  });

  const traces = priorities
    .map((priority) => {
      const slot = perPriority[priority];
      if (!slot || slot.x.length === 0) return null;
      return {
        type: "bar",
        name: priorityLabels[priority],
        x: slot.x,
        y: slot.y,
        width: slot.width,
        marker: buildBarMarker(
          themeColors,
          themeColors.priorities[priority] || themeColors.priorities.medium,
          { rounded: true, radius: 4 }
        ),
        customdata: slot.customdata,
        hovertemplate:
          "<b>Time spent: %{customdata.bucket}</b><br>Priority: %{fullData.name}<br>Count: %{y}<br>" +
          "Total: %{customdata.total}<extra></extra>"
      };
    })
    .filter(Boolean);

  const layout = {
    ...buildBaseLayout(themeColors),
    barmode: "overlay",
    barcornerradius: 4,
    uirevision: "backlog-uat-aging",
    margin: { t: 18, r: 16, b: 52, l: 56 },
    bargap: 0,
    xaxis: buildChartXAxis(themeColors, {
      type: "linear",
      tickmode: "array",
      tickvals: bucketLabels.map((_, index) => index),
      ticktext: bucketLabels,
      range: [-0.5, bucketLabels.length - 0.5],
      title: "Time spent"
    }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Open UAT Tickets",
      range: [0, paddedMaxY]
    })
  };

  Plotly.react("uat-chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });
}

function bindCompositionTeamScopeToggle() {
  const scopeSelect = document.getElementById("composition-team-scope");
  if (!scopeSelect || scopeSelect.dataset.bound === "1") return;

  scopeSelect.dataset.bound = "1";
  scopeSelect.addEventListener("change", () => {
    state.compositionTeamScope = scopeSelect.value || "bc";
    renderStackedBarChart();
  });
}

function formatDays(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toFixed(2);
}

function computeMedian(values) {
  const list = (values || [])
    .filter((value) => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => a - b);
  if (list.length === 0) return null;
  const mid = Math.floor(list.length / 2);
  if (list.length % 2 === 1) return Number(list[mid].toFixed(2));
  return Number(((list[mid - 1] + list[mid]) / 2).toFixed(2));
}

function computeAverage(values) {
  const list = (values || []).filter((value) => typeof value === "number" && Number.isFinite(value));
  if (list.length === 0) return null;
  const sum = list.reduce((acc, value) => acc + value, 0);
  return Number((sum / list.length).toFixed(2));
}

function diffDaysFromIso(startIso, endIso) {
  const startAt = new Date(String(startIso || "")).getTime();
  const endAt = new Date(String(endIso || "")).getTime();
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt < startAt) return null;
  return Number(((endAt - startAt) / (24 * 60 * 60 * 1000)).toFixed(2));
}

function getParkingLotExitAt(idea) {
  const events = Array.isArray(idea?.lifecycle_events) ? idea.lifecycle_events : [];
  for (const event of events) {
    const fromStage = String(event?.from_stage || "").trim();
    const toStage = String(event?.to_stage || "").trim();
    const at = String(event?.at || "").trim();
    if (fromStage !== "parking_lot") continue;
    if (!toStage || toStage === "parking_lot") continue;
    if (at) return at;
  }
  return String(idea?.entered_parking_lot || "").trim();
}

function computeLifecyclePhaseSpentDays(idea) {
  const phaseKeys = new Set(PRODUCT_CYCLE_PHASES.map((phase) => phase.key));
  const totals = Object.fromEntries(PRODUCT_CYCLE_PHASES.map((phase) => [phase.key, 0]));
  const events = (Array.isArray(idea?.lifecycle_events) ? idea.lifecycle_events : [])
    .filter((event) => event && event.at)
    .slice()
    .sort((a, b) => new Date(String(a.at)).getTime() - new Date(String(b.at)).getTime());

  if (events.length === 0) return totals;

  let currentStage = "";
  let currentAt = "";
  const first = events[0];
  if (phaseKeys.has(String(first?.from_stage || ""))) {
    currentStage = String(first.from_stage);
    currentAt = String(first.at || "");
  } else if (phaseKeys.has(String(first?.to_stage || ""))) {
    currentStage = String(first.to_stage);
    currentAt = String(first.at || "");
  }

  for (const event of events) {
    const eventAt = String(event?.at || "");
    const delta = diffDaysFromIso(currentAt, eventAt);
    if (currentStage && phaseKeys.has(currentStage) && typeof delta === "number") {
      totals[currentStage] += delta;
    }

    const nextStage = String(event?.to_stage || "");
    if (nextStage) {
      currentStage = nextStage;
      currentAt = eventAt;
      continue;
    }
    currentAt = eventAt;
  }

  const doneAt = String(idea?.entered_done || "");
  const tailDelta = diffDaysFromIso(currentAt, doneAt);
  if (currentStage && phaseKeys.has(currentStage) && typeof tailDelta === "number") {
    totals[currentStage] += tailDelta;
  }

  for (const key of Object.keys(totals)) {
    totals[key] = Number(totals[key].toFixed(2));
  }
  return totals;
}

function isoYear(value) {
  const match = /^(\d{4})-\d{2}-\d{2}/.exec(String(value || ""));
  return match ? match[1] : "";
}

function inferIdeaYear(idea) {
  for (const key of [
    "entered_done",
    "sfd_start",
    "entered_parking_lot",
    "entered_design",
    "entered_ready_for_development",
    "entered_in_development"
  ]) {
    const year = isoYear(idea?.[key]);
    if (year) return year;
  }
  const firstEventAt = Array.isArray(idea?.lifecycle_events) ? idea.lifecycle_events[0]?.at : "";
  return isoYear(firstEventAt);
}

function getProductCycleIdeas() {
  return Array.isArray(state.productCycle?.ideas) ? state.productCycle.ideas : [];
}

function getProductCyclePublicAggregates() {
  const value = state.productCycle?.publicAggregates;
  return value && typeof value === "object" ? value : null;
}

function toFiniteMetric(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Number(number.toFixed(2));
}

function toCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.trunc(number);
}

function getProductCycleTeamsFromAggregates(publicAggregates) {
  const configured = Array.isArray(state.productCycle?.teams)
    ? state.productCycle.teams.filter((team) => typeof team === "string" && team.trim())
    : [];
  if (configured.length > 0) return configured;

  const found = new Set();
  const cycleByYear = publicAggregates?.cycleTime?.byYear;
  if (cycleByYear && typeof cycleByYear === "object") {
    for (const yearNode of Object.values(cycleByYear)) {
      if (!yearNode || typeof yearNode !== "object") continue;
      for (const effortNode of Object.values(yearNode)) {
        const teamsNode = effortNode?.teams;
        if (!teamsNode || typeof teamsNode !== "object") continue;
        for (const team of Object.keys(teamsNode)) found.add(team);
      }
    }
  }
  const lifecycleByYear = publicAggregates?.lifecyclePhaseDays?.byYear;
  if (lifecycleByYear && typeof lifecycleByYear === "object") {
    for (const yearNode of Object.values(lifecycleByYear)) {
      const teamsNode = yearNode?.teams;
      if (!teamsNode || typeof teamsNode !== "object") continue;
      for (const team of Object.keys(teamsNode)) found.add(team);
    }
  }

  const ordered = Array.from(found).sort((a, b) => a.localeCompare(b));
  if (ordered.includes("UNMAPPED")) {
    return ordered.filter((team) => team !== "UNMAPPED").concat("UNMAPPED");
  }
  return ordered;
}

function getCycleTeams(ideas) {
  const configured = Array.isArray(state.productCycle?.teams)
    ? state.productCycle.teams.filter((team) => typeof team === "string" && team.trim())
    : [];
  const teamSet = new Set(configured);
  const hasUnmapped = ideas.some((idea) => {
    const team = String(idea?.primary_team || "").trim();
    return !team || !teamSet.has(team);
  });
  return hasUnmapped ? [...configured, "UNMAPPED"] : configured;
}

function bucketTeamName(primaryTeam, teamSet) {
  const team = String(primaryTeam || "").trim();
  if (team && teamSet.has(team)) return team;
  return "UNMAPPED";
}

function countIdeaKnownTeams(idea, teamSet) {
  const known = new Set();
  const teamList = Array.isArray(idea?.teams) ? idea.teams : [];
  for (const team of teamList) {
    const normalized = String(team || "").trim();
    if (normalized && teamSet.has(normalized)) known.add(normalized);
  }
  if (known.size > 0) return known.size;

  const primary = String(idea?.primary_team || "").trim();
  if (primary && teamSet.has(primary)) return 1;
  return 0;
}

function matchesEffortScope(idea, effortScope, teamSet) {
  const count = countIdeaKnownTeams(idea, teamSet);
  if (effortScope === "combined") return count >= 2;
  if (effortScope === "single") return count <= 1;
  return true;
}

function getIdeaKnownTeams(idea, teamSet) {
  const known = [];
  const seen = new Set();
  const teamList = Array.isArray(idea?.teams) ? idea.teams : [];
  for (const team of teamList) {
    const normalized = String(team || "").trim();
    if (!normalized || !teamSet.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    known.push(normalized);
  }
  return known;
}

function getIdeaContributionTeams(idea, mappedTeamSet, knownTeamSet, effortScope) {
  const knownTeams = getIdeaKnownTeams(idea, knownTeamSet).filter((team) => mappedTeamSet.has(team));
  if (effortScope === "combined" && knownTeams.length >= 2) {
    return knownTeams;
  }
  if (knownTeams.length === 1) {
    return knownTeams;
  }
  return [bucketTeamName(idea?.primary_team, mappedTeamSet)];
}

function hexToRgb(color) {
  const raw = String(color || "").trim();
  const short = /^#([0-9a-f]{3})$/i.exec(raw);
  if (short) {
    const [r, g, b] = short[1].split("").map((ch) => Number.parseInt(ch + ch, 16));
    return { r, g, b };
  }
  const full = /^#([0-9a-f]{6})$/i.exec(raw);
  if (full) {
    const hex = full[1];
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16)
    };
  }
  return null;
}

function shadeColor(color, amount) {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  const clamp = (value) => Math.max(0, Math.min(255, value));
  const r = clamp(Math.round(rgb.r + amount));
  const g = clamp(Math.round(rgb.g + amount));
  const b = clamp(Math.round(rgb.b + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function cycleTeamBaseColor(themeColors, teamName) {
  if (teamName === "API") return themeColors.teams.api;
  if (teamName === "Frontend") return themeColors.teams.react;
  if (teamName === "Broadcast") return themeColors.teams.bc;
  if (teamName === "UNMAPPED") return readThemeColor("--mgmt-dev", "#98a3af");
  return themeColors.teams.legacy;
}

function cycleYearTeamColor(themeColors, teamName, year) {
  const base = cycleTeamBaseColor(themeColors, teamName);
  if (year === "2026") return shadeColor(base, -20);
  return base;
}

function bindManagementUatScopeToggle() {
  const scopeSelect = document.getElementById("management-uat-scope");
  if (!scopeSelect || scopeSelect.dataset.bound === "1") return;

  scopeSelect.dataset.bound = "1";
  scopeSelect.addEventListener("change", () => {
    state.managementUatScope = scopeSelect.value === "bugs_only" ? "bugs_only" : "all";
    renderManagementChart();
  });
}

function normalizeSprintGoals(sprintGoalsDoc) {
  const sprints = Array.isArray(sprintGoalsDoc?.sprints) ? sprintGoalsDoc.sprints : [];
  return sprints
    .filter((sprint) => /^\d{4}-\d{2}-\d{2}$/.test(String(sprint?.sprint_start || "")))
    .sort((a, b) => String(a.sprint_start || "").localeCompare(String(b.sprint_start || "")));
}

function bindSprintGoalsTeamScopeToggle() {
  const scopeSelect = document.getElementById("sprint-goals-team-scope");
  if (!scopeSelect || scopeSelect.dataset.bound === "1") return;
  scopeSelect.dataset.bound = "1";
  scopeSelect.addEventListener("change", () => {
    state.sprintGoalsTeamScope = scopeSelect.value || "API";
    renderSprintGoalsChart();
  });
}

function renderSprintGoalsChart() {
  const status = document.getElementById("sprint-goals-status");
  const root = document.getElementById("sprint-goals-chart");
  const context = document.getElementById("sprint-goals-context");
  const scopeSelect = document.getElementById("sprint-goals-team-scope");
  if (!status || !root || !context) return;

  status.hidden = true;
  if (!state.sprintGoals || typeof state.sprintGoals !== "object") {
    status.hidden = false;
    status.textContent = "No sprint goals data found in data/manual/sprint-goals.json.";
    return;
  }

  const team = SPRINT_GOALS_TEAMS.includes(state.sprintGoalsTeamScope)
    ? state.sprintGoalsTeamScope
    : "API";
  if (scopeSelect) scopeSelect.value = team;

  const sprints = normalizeSprintGoals(state.sprintGoals);
  const recent = sprints.slice(-SPRINT_GOALS_LOOKBACK);
  if (recent.length === 0) {
    status.hidden = false;
    status.textContent = "No valid sprint rows found in sprint-goals.json.";
    return;
  }

  const x = recent.map((sprint) => sprint.sprint_start);
  const xShort = recent.map((sprint) => formatDateShort(sprint.sprint_start));
  const totals = [];
  const passed = [];
  const successRatePct = [];

  for (const sprint of recent) {
    const teams = Array.isArray(sprint.teams) ? sprint.teams : [];
    const row = teams.find((entry) => String(entry?.team || "") === team) || {};
    const total = toNumber(row.goals_total);
    const ok = toNumber(row.goals_passed);
    totals.push(total);
    passed.push(ok);
    successRatePct.push(total > 0 ? (ok / total) * 100 : 0);
  }

  const themeColors = getThemeColors();
  const traces = [
    {
      type: "bar",
      name: "Goals Total",
      x: xShort,
      y: totals,
      customdata: x,
      marker: buildBarMarker(themeColors, themeColors.teams.api, { rounded: true, radius: 5 }),
      hovertemplate: "<b>%{customdata}</b><br>Goals Total: %{y}<extra></extra>"
    },
    {
      type: "bar",
      name: "Goals Passed",
      x: xShort,
      y: passed,
      customdata: x,
      marker: buildBarMarker(themeColors, themeColors.teams.react, { rounded: true, radius: 5 }),
      hovertemplate: "<b>%{customdata}</b><br>Goals Passed: %{y}<extra></extra>"
    },
    {
      type: "scatter",
      mode: "lines+markers",
      name: "Success Rate",
      x: xShort,
      y: successRatePct,
      customdata: x,
      yaxis: "y2",
      line: { color: themeColors.teams.bc, width: 3 },
      marker: { size: 7 },
      hovertemplate: "<b>%{customdata}</b><br>Success Rate: %{y:.1f}%<extra></extra>"
    }
  ];

  const maxGoals = Math.max(1, ...totals, ...passed);
  const layout = {
    ...buildBaseLayout(themeColors),
    barmode: "group",
    barcornerradius: 5,
    uirevision: `sprint-goals-${team}`,
    margin: { t: 18, r: 56, b: 52, l: 56 },
    bargap: 0.32,
    xaxis: buildChartXAxis(themeColors, {
      title: "Sprint Start"
    }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Goals",
      range: [0, Math.ceil(maxGoals * 1.2)]
    }),
    yaxis2: {
      title: "Success Rate",
      overlaying: "y",
      side: "right",
      range: [0, 100],
      ticksuffix: "%",
      tickformat: ".0f",
      showgrid: false,
      color: themeColors.text
    }
  };

  Plotly.react("sprint-goals-chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });

  context.textContent = `${team}, last ${recent.length} sprints`;
}

function bindProductCycleControls() {
  const effortSelect = document.getElementById("product-cycle-effort-scope");
  const metricSelect = document.getElementById("product-cycle-metric-scope");
  if (!effortSelect || !metricSelect || effortSelect.dataset.bound === "1") return;

  effortSelect.dataset.bound = "1";
  metricSelect.dataset.bound = "1";

  effortSelect.addEventListener("change", () => {
    state.productCycleEffortScope = PRODUCT_CYCLE_EFFORT_SCOPE_OPTIONS.includes(effortSelect.value)
      ? effortSelect.value
      : "all";
    renderProductCycleChart();
  });

  metricSelect.addEventListener("change", () => {
    state.productCycleMetricScope = metricSelect.value === "average" ? "average" : "median";
    renderProductCycleChart();
  });
}

function bindLifecycleDaysControls() {
  const yearSelect = document.getElementById("lifecycle-days-year-scope");
  const metricSelect = document.getElementById("lifecycle-days-metric-scope");
  if (!yearSelect || !metricSelect || yearSelect.dataset.bound === "1") return;

  yearSelect.dataset.bound = "1";
  metricSelect.dataset.bound = "1";

  yearSelect.addEventListener("change", () => {
    state.lifecycleDaysYearScope = LIFECYCLE_YEAR_OPTIONS.includes(yearSelect.value)
      ? yearSelect.value
      : "2026";
    renderLifecycleDaysChart();
  });

  metricSelect.addEventListener("change", () => {
    state.lifecycleDaysMetricScope = metricSelect.value === "average" ? "average" : "median";
    renderLifecycleDaysChart();
  });
}

function setProductCycleTotalsText(text) {
  const totals = document.getElementById("product-cycle-totals");
  if (!totals) return;
  const value = String(text || "").trim();
  if (!value) {
    totals.hidden = true;
    totals.textContent = "";
    return;
  }
  totals.hidden = false;
  totals.textContent = value;
}

function renderProductCycleChartFromPublicAggregates(publicAggregates, effortScope, metric) {
  const status = document.getElementById("product-cycle-status");
  const context = document.getElementById("product-cycle-context");
  if (!status || !context) return;
  setProductCycleTotalsText("");

  const teams = getProductCycleTeamsFromAggregates(publicAggregates);
  if (teams.length === 0) {
    status.hidden = false;
    status.textContent = "No product cycle aggregates found in product-cycle-times.json.";
    return;
  }

  const metricLabel = metric === "average" ? "Average" : "Median";
  const yearsToShow = PRODUCT_CYCLE_COMPARE_YEARS;
  const perYear = yearsToShow.map((year) => {
    const teamNodes = publicAggregates?.cycleTime?.byYear?.[year]?.[effortScope]?.teams || {};
    const totalsNode = publicAggregates?.cycleTime?.totalsByYear?.[year]?.[effortScope] || {};
    const teamStats = teams.map((team) => {
      const row = teamNodes?.[team] || {};
      const median = toFiniteMetric(row.median);
      const average = toFiniteMetric(row.average);
      const metricValue = metric === "average" ? average : median;
      return {
        team,
        n: toCount(row.n),
        median,
        average,
        metric: metricValue
      };
    });
    return {
      year,
      ideasInYearCount: toCount(totalsNode.total),
      doneInYearCount: toCount(totalsNode.done),
      openAtYearEnd: toCount(totalsNode.ongoing_year_end),
      openNow: toCount(totalsNode.ongoing_now),
      cycleRowsCount: toCount(totalsNode.cycle_sample),
      teamStats
    };
  });

  const totalIdeasCombined = perYear.reduce((sum, entry) => sum + entry.ideasInYearCount, 0);
  const chartTitleText = `Cycle time from parking lot exit to done • total ideas (2025+2026): ${totalIdeasCombined}`;
  context.textContent = chartTitleText;

  if (perYear.every((entry) => entry.cycleRowsCount === 0)) {
    status.hidden = false;
    status.textContent = `No completed Parking lot exit -> Done items found for ${yearsToShow.join(", ")}.`;
    Plotly.purge("product-cycle-chart");
    return;
  }

  const themeColors = getThemeColors();
  const traces = perYear.map((entry) => ({
    type: "bar",
    name: `${entry.year}`,
    x: entry.teamStats.map((item) => item.team),
    y: entry.teamStats.map((item) =>
      typeof item.metric === "number" && Number.isFinite(item.metric) ? item.metric : 0
    ),
    marker: {
      color: entry.teamStats.map((item) => cycleYearTeamColor(themeColors, item.team, entry.year)),
      line: { color: themeColors.barBorder, width: 0.9 }
    },
    customdata: entry.teamStats.map((item) => [
      entry.year,
      item.n,
      formatDays(item.median),
      formatDays(item.average),
      typeof item.metric === "number" && Number.isFinite(item.metric) ? formatDays(item.metric) : "n/a"
    ]),
    hovertemplate:
      "<b>%{x}</b><br>" +
      "Year: %{customdata[0]}<br>" +
      `${metricLabel} Parking lot exit -> Done: %{customdata[4]} days<br>` +
      "Sample size: %{customdata[1]}<br>Median: %{customdata[2]} days<br>Average: %{customdata[3]} days<extra></extra>"
  }));

  const yValues = traces
    .flatMap((trace) => trace.y)
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  const yMax = yValues.length > 0 ? Math.ceil(Math.max(...yValues) * 1.15) : 1;
  const yearSummaries = perYear.map((entry) => {
    return `${entry.year}: total ${entry.ideasInYearCount} • done ${entry.doneInYearCount} • ongoing (year-end) ${entry.openAtYearEnd} • ongoing now ${entry.openNow} • cycle sample ${entry.cycleRowsCount}`;
  });
  const totalsText = yearSummaries.join(" | ");

  const layout = {
    ...buildBaseLayout(themeColors),
    height: 520,
    barmode: "group",
    barcornerradius: 5,
    uirevision: `product-cycle-${effortScope}-${metric}`,
    margin: { t: 42, r: 20, b: 64, l: 56 },
    bargap: 0.42,
    bargroupgap: 0.2,
    legend: {
      ...buildBaseLayout(themeColors).legend,
      y: 1.12
    },
    xaxis: buildChartXAxis(themeColors, { title: "Team" }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Cycle Time (days)",
      range: [0, yMax]
    })
  };

  Plotly.react("product-cycle-chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });
  setProductCycleTotalsText(totalsText);

  const yearsWithoutCycles = perYear
    .filter((entry) => entry.cycleRowsCount === 0)
    .map((entry) => entry.year);
  if (yearsWithoutCycles.length > 0) {
    status.hidden = false;
    status.textContent = `No completed Parking lot exit -> Done items found for ${yearsWithoutCycles.join(", ")}; showing other year(s).`;
  }
}

function renderLifecycleDaysChartFromPublicAggregates(publicAggregates, year, metric) {
  const status = document.getElementById("lifecycle-days-status");
  const context = document.getElementById("lifecycle-days-context");
  if (!status || !context) return;

  const teams = getProductCycleTeamsFromAggregates(publicAggregates);
  if (teams.length === 0) {
    status.hidden = false;
    status.textContent = "No lifecycle aggregates found in product-cycle-times.json.";
    return;
  }

  const metricLabel = metric === "average" ? "Average" : "Median";
  const chartTitleText = `Lifecycle time spent per phase (${metricLabel})`;
  context.textContent = chartTitleText;

  const themeColors = getThemeColors();
  const phaseColors = [
    themeColors.uatBuckets.d0_7,
    themeColors.uatBuckets.d8_14,
    themeColors.uatBuckets.d15_30,
    themeColors.uatBuckets.d31_60,
    themeColors.uatBuckets.d61_plus
  ];

  const traces = PRODUCT_CYCLE_PHASES.map((phase, phaseIndex) => {
    const rows = teams.map((team) => {
      const row = publicAggregates?.lifecyclePhaseDays?.byYear?.[year]?.teams?.[team]?.[phase.key] || {};
      const median = toFiniteMetric(row.median);
      const average = toFiniteMetric(row.average);
      const metricValue = metric === "average" ? average : median;
      return {
        n: toCount(row.n),
        metric: metricValue,
        median,
        average
      };
    });

    return {
      type: "bar",
      name: phase.label,
      x: teams,
      y: rows.map((row) =>
        typeof row.metric === "number" && Number.isFinite(row.metric) ? row.metric : 0
      ),
      marker: buildBarMarker(themeColors, phaseColors[phaseIndex] || themeColors.teams.legacy, {
        rounded: true,
        radius: 4
      }),
      customdata: rows.map((row) => [
        row.n,
        formatDays(row.median),
        formatDays(row.average),
        typeof row.metric === "number" && Number.isFinite(row.metric) ? formatDays(row.metric) : "n/a"
      ]),
      hovertemplate:
        "<b>%{x}</b><br>" +
        `${phase.label}<br>${metricLabel}: %{customdata[3]} days<br>` +
        "Sample size: %{customdata[0]}<br>Median: %{customdata[1]} days<br>Average: %{customdata[2]} days<extra></extra>"
    };
  });

  const activeTraces = traces.filter((trace) =>
    trace.y.some((value) => typeof value === "number" && Number.isFinite(value) && value > 0)
  );
  const plottedValues = traces
    .flatMap((trace) => trace.y)
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  const totalsNode = publicAggregates?.lifecyclePhaseDays?.totalsByYear?.[year] || {};
  const doneCount = toCount(totalsNode.done);
  const ongoingCount = toCount(totalsNode.ongoing);
  const totalCount = toCount(totalsNode.total);
  const sampleCount = toCount(totalsNode.cycle_sample);
  const totalsText = `${year}: total ${totalCount} • done ${doneCount} • ongoing ${ongoingCount} • cycle sample ${sampleCount}`;

  if (plottedValues.length === 0 || activeTraces.length === 0) {
    status.hidden = false;
    status.textContent = `No lifecycle phase time data found for ${year}.`;
    Plotly.purge("lifecycle-days-chart");
    return;
  }
  const yMax = plottedValues.length > 0 ? Math.ceil(Math.max(...plottedValues) * 1.15) : 1;

  const layout = {
    ...buildBaseLayout(themeColors),
    height: 520,
    barmode: "group",
    barcornerradius: 4,
    uirevision: `lifecycle-days-${year}-${metric}`,
    margin: { t: 64, r: 20, b: 96, l: 56 },
    bargap: 0.4,
    bargroupgap: 0.22,
    legend: {
      ...buildBaseLayout(themeColors).legend,
      y: 1.18
    },
    annotations: [
      {
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: -0.28,
        showarrow: false,
        text: totalsText,
        font: { size: 12, color: themeColors.text },
        align: "center"
      }
    ],
    xaxis: buildChartXAxis(themeColors, { title: "Team" }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Days",
      range: [0, yMax]
    })
  };

  Plotly.react("lifecycle-days-chart", activeTraces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });
}

function renderProductCycleChart() {
  const status = document.getElementById("product-cycle-status");
  const root = document.getElementById("product-cycle-chart");
  const context = document.getElementById("product-cycle-context");
  const effortSelect = document.getElementById("product-cycle-effort-scope");
  const metricSelect = document.getElementById("product-cycle-metric-scope");
  if (!status || !root || !context) return;

  status.hidden = true;
  setProductCycleTotalsText("");
  const effortScope = PRODUCT_CYCLE_EFFORT_SCOPE_OPTIONS.includes(state.productCycleEffortScope)
    ? state.productCycleEffortScope
    : "all";
  const metric = state.productCycleMetricScope === "average" ? "average" : "median";
  if (effortSelect) effortSelect.value = effortScope;
  if (metricSelect) metricSelect.value = metric;

  const ideas = getProductCycleIdeas();
  const publicAggregates = getProductCyclePublicAggregates();
  if (ideas.length === 0 && !publicAggregates) {
    status.hidden = false;
    status.textContent = "No product cycle data found in data/manual/product-cycle-times.json.";
    return;
  }
  if (ideas.length === 0 && publicAggregates) {
    renderProductCycleChartFromPublicAggregates(publicAggregates, effortScope, metric);
    return;
  }

  const teams = getCycleTeams(ideas);
  const knownTeamSet = new Set((state.productCycle?.teams || []).filter((team) => team !== "UNMAPPED"));
  const mappedTeamSet = new Set(teams.filter((team) => team !== "UNMAPPED"));
  const metricFn = metric === "average" ? computeAverage : computeMedian;
  const metricLabel = metric === "average" ? "Average" : "Median";
  const yearsToShow = PRODUCT_CYCLE_COMPARE_YEARS;

  const perYear = yearsToShow.map((year) => {
    const ideasInYear = ideas
      .filter((idea) => inferIdeaYear(idea) === year)
      .filter((idea) => matchesEffortScope(idea, effortScope, knownTeamSet));
    const yearEndAt = new Date(`${year}-12-31T23:59:59.999Z`).getTime();
    const doneByYearEnd = ideasInYear.filter((idea) => {
      const doneAt = new Date(String(idea?.entered_done || "")).getTime();
      return Number.isFinite(doneAt) && doneAt <= yearEndAt;
    });
    const openAtYearEnd = Math.max(0, ideasInYear.length - doneByYearEnd.length);
    const openNow = ideasInYear.filter((idea) => !idea?.entered_done).length;
    const doneInYear = ideasInYear.filter((idea) => isoYear(idea?.entered_done) === year);
    const cycleRows = doneInYear
      .map((idea) => ({
        ...idea,
        parking_exit_to_done_days: diffDaysFromIso(getParkingLotExitAt(idea), idea?.entered_done)
      }))
      .filter((idea) => typeof idea.parking_exit_to_done_days === "number");
    const valuesByTeam = new Map(teams.map((team) => [team, []]));
    for (const idea of cycleRows) {
      const contributionTeams = getIdeaContributionTeams(idea, mappedTeamSet, knownTeamSet, effortScope);
      for (const team of contributionTeams) {
        if (!valuesByTeam.has(team)) valuesByTeam.set(team, []);
        valuesByTeam.get(team).push(idea.parking_exit_to_done_days);
      }
    }
    const teamStats = teams.map((team) => {
      const values = valuesByTeam.get(team) || [];
      return {
        team,
        n: values.length,
        median: computeMedian(values),
        average: computeAverage(values),
        metric: metricFn(values)
      };
    });
    return {
      year,
      ideasInYear,
      doneByYearEnd,
      openAtYearEnd,
      openNow,
      doneInYear,
      cycleRows,
      teamStats
    };
  });
  const totalIdeasCombined = perYear.reduce((sum, entry) => sum + entry.ideasInYear.length, 0);
  const chartTitleText = `Cycle time from parking lot exit to done • total ideas (2025+2026): ${totalIdeasCombined}`;
  context.textContent = chartTitleText;

  if (perYear.every((entry) => entry.cycleRows.length === 0)) {
    status.hidden = false;
    status.textContent = `No completed Parking lot exit -> Done items found for ${yearsToShow.join(", ")}.`;
    Plotly.purge("product-cycle-chart");
    context.textContent = chartTitleText;
    return;
  }

  const themeColors = getThemeColors();
  const traces = perYear.map((entry) => ({
    type: "bar",
    name: `${entry.year}`,
    x: entry.teamStats.map((item) => item.team),
    y: entry.teamStats.map((item) =>
      typeof item.metric === "number" && Number.isFinite(item.metric) ? item.metric : 0
    ),
    marker: {
      color: entry.teamStats.map((item) => cycleYearTeamColor(themeColors, item.team, entry.year)),
      line: { color: themeColors.barBorder, width: 0.9 }
    },
    customdata: entry.teamStats.map((item) => [
      entry.year,
      item.n,
      formatDays(item.median),
      formatDays(item.average),
      typeof item.metric === "number" && Number.isFinite(item.metric) ? formatDays(item.metric) : "n/a"
    ]),
    hovertemplate:
      "<b>%{x}</b><br>" +
      "Year: %{customdata[0]}<br>" +
      `${metricLabel} Parking lot exit -> Done: %{customdata[4]} days<br>` +
      "Sample size: %{customdata[1]}<br>Median: %{customdata[2]} days<br>Average: %{customdata[3]} days<extra></extra>"
  }));

  const yValues = traces
    .flatMap((trace) => trace.y)
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  const yMax = yValues.length > 0 ? Math.ceil(Math.max(...yValues) * 1.15) : 1;
  const yearSummaries = perYear.map((entry) => {
    return `${entry.year}: total ${entry.ideasInYear.length} • done ${entry.doneInYear.length} • ongoing (year-end) ${entry.openAtYearEnd} • ongoing now ${entry.openNow} • cycle sample ${entry.cycleRows.length}`;
  });
  const totalsText = yearSummaries.join(" | ");

  const layout = {
    ...buildBaseLayout(themeColors),
    height: 520,
    barmode: "group",
    barcornerradius: 5,
    uirevision: `product-cycle-${effortScope}-${metric}`,
    margin: { t: 42, r: 20, b: 64, l: 56 },
    bargap: 0.42,
    bargroupgap: 0.2,
    legend: {
      ...buildBaseLayout(themeColors).legend,
      y: 1.12
    },
    xaxis: buildChartXAxis(themeColors, { title: "Team" }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Cycle Time (days)",
      range: [0, yMax]
    })
  };

  Plotly.react("product-cycle-chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });
  setProductCycleTotalsText(totalsText);

  context.textContent = chartTitleText;

  const yearsWithoutCycles = perYear
    .filter((entry) => entry.cycleRows.length === 0)
    .map((entry) => entry.year);
  if (yearsWithoutCycles.length > 0) {
    status.hidden = false;
    status.textContent = `No completed Parking lot exit -> Done items found for ${yearsWithoutCycles.join(", ")}; showing other year(s).`;
  }
}

function renderLifecycleDaysChart() {
  const status = document.getElementById("lifecycle-days-status");
  const root = document.getElementById("lifecycle-days-chart");
  const context = document.getElementById("lifecycle-days-context");
  const yearSelect = document.getElementById("lifecycle-days-year-scope");
  const metricSelect = document.getElementById("lifecycle-days-metric-scope");
  if (!status || !root || !context) return;

  status.hidden = true;
  const year = LIFECYCLE_YEAR_OPTIONS.includes(state.lifecycleDaysYearScope)
    ? state.lifecycleDaysYearScope
    : "2026";
  const metric = state.lifecycleDaysMetricScope === "average" ? "average" : "median";
  if (yearSelect) yearSelect.value = year;
  if (metricSelect) metricSelect.value = metric;

  const ideas = getProductCycleIdeas();
  const publicAggregates = getProductCyclePublicAggregates();
  if (ideas.length === 0 && !publicAggregates) {
    status.hidden = false;
    status.textContent = "No product cycle data found in data/manual/product-cycle-times.json.";
    return;
  }
  if (ideas.length === 0 && publicAggregates) {
    renderLifecycleDaysChartFromPublicAggregates(publicAggregates, year, metric);
    return;
  }

  const ideasInYear = ideas.filter((idea) => inferIdeaYear(idea) === year);
  const ideasWithPhaseSpent = ideasInYear.map((idea) => ({
    ...idea,
    _phase_spent_days: computeLifecyclePhaseSpentDays(idea)
  }));
  const teams = getCycleTeams(ideasInYear);
  const mappedTeamSet = new Set(teams.filter((team) => team !== "UNMAPPED"));
  const metricFn = metric === "average" ? computeAverage : computeMedian;
  const metricLabel = metric === "average" ? "Average" : "Median";
  const chartTitleText = `Lifecycle time spent per phase (${metricLabel})`;

  const groupedByTeam = new Map();
  for (const team of teams) groupedByTeam.set(team, []);
  for (const idea of ideasWithPhaseSpent) {
    const bucket = bucketTeamName(idea?.primary_team, mappedTeamSet);
    if (!groupedByTeam.has(bucket)) groupedByTeam.set(bucket, []);
    groupedByTeam.get(bucket).push(idea);
  }

  const themeColors = getThemeColors();
  const phaseColors = [
    themeColors.uatBuckets.d0_7,
    themeColors.uatBuckets.d8_14,
    themeColors.uatBuckets.d15_30,
    themeColors.uatBuckets.d31_60,
    themeColors.uatBuckets.d61_plus
  ];
  const traces = PRODUCT_CYCLE_PHASES.map((phase, phaseIndex) => {
    const rows = teams.map((team) => {
      const values = (groupedByTeam.get(team) || [])
        .map((idea) => idea?._phase_spent_days?.[phase.key])
        .filter((value) => typeof value === "number" && Number.isFinite(value) && value > 0);
      return {
        n: values.length,
        metric: metricFn(values),
        median: computeMedian(values),
        average: computeAverage(values)
      };
    });
      return {
        type: "bar",
        name: phase.label,
        x: teams,
        y: rows.map((row) =>
          typeof row.metric === "number" && Number.isFinite(row.metric) ? row.metric : 0
        ),
        marker: buildBarMarker(themeColors, phaseColors[phaseIndex] || themeColors.teams.legacy, {
          rounded: true,
          radius: 4
        }),
        customdata: rows.map((row) => [
          row.n,
          formatDays(row.median),
          formatDays(row.average),
          typeof row.metric === "number" && Number.isFinite(row.metric) ? formatDays(row.metric) : "n/a"
        ]),
        hovertemplate:
          "<b>%{x}</b><br>" +
          `${phase.label}<br>${metricLabel}: %{customdata[3]} days<br>` +
          "Sample size: %{customdata[0]}<br>Median: %{customdata[1]} days<br>Average: %{customdata[2]} days<extra></extra>"
      };
    });

  const activeTraces = traces.filter((trace) =>
    trace.y.some((value) => typeof value === "number" && Number.isFinite(value) && value > 0)
  );

  const plottedValues = traces
    .flatMap((trace) => trace.y)
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  const doneCount = ideasInYear.filter((idea) => isoYear(idea?.entered_done) === year).length;
  const ongoingCount = Math.max(0, ideasInYear.length - doneCount);
  const sampleSet = new Set();
  for (const idea of ideasWithPhaseSpent) {
    const hasPhaseSpent = PRODUCT_CYCLE_PHASES.some((phase) => {
      const value = idea?._phase_spent_days?.[phase.key];
      return typeof value === "number" && Number.isFinite(value) && value > 0;
    });
    if (hasPhaseSpent) sampleSet.add(String(idea?.key || ""));
  }
  const sampleCount = sampleSet.size;
  const totalsText = `${year}: total ${ideasInYear.length} • done ${doneCount} • ongoing ${ongoingCount} • cycle sample ${sampleCount}`;
  context.textContent = chartTitleText;

  if (plottedValues.length === 0 || activeTraces.length === 0) {
    status.hidden = false;
    status.textContent = `No lifecycle phase time data found for ${year}.`;
    Plotly.purge("lifecycle-days-chart");
    return;
  }
  const yMax = plottedValues.length > 0 ? Math.ceil(Math.max(...plottedValues) * 1.15) : 1;

  const layout = {
    ...buildBaseLayout(themeColors),
    height: 520,
    barmode: "group",
    barcornerradius: 4,
    uirevision: `lifecycle-days-${year}-${metric}`,
    margin: { t: 64, r: 20, b: 96, l: 56 },
    bargap: 0.4,
    bargroupgap: 0.22,
    legend: {
      ...buildBaseLayout(themeColors).legend,
      y: 1.18
    },
    annotations: [
      {
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: -0.28,
        showarrow: false,
        text: totalsText,
        font: { size: 12, color: themeColors.text },
        align: "center"
      }
    ],
    xaxis: buildChartXAxis(themeColors, { title: "Team" }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Days",
      range: [0, yMax]
    })
  };

  Plotly.react("lifecycle-days-chart", activeTraces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });
  context.textContent = chartTitleText;
}

function renderManagementChart() {
  const status = document.getElementById("management-status");
  const root = document.getElementById("management-chart");
  const context = document.getElementById("management-context");
  if (!status || !root || !context) return;

  status.hidden = true;

  const scope = state.managementUatScope === "bugs_only" ? "bugs_only" : "all";
  const scopeSelect = document.getElementById("management-uat-scope");
  if (scopeSelect) scopeSelect.value = scope;
  const flowVariants = state.snapshot?.kpis?.broadcast?.flow_by_priority_variants;
  const scopedFlow = flowVariants && typeof flowVariants === "object" ? flowVariants[scope] : null;
  const flow = scopedFlow || state.snapshot?.kpis?.broadcast?.flow_by_priority;
  if (!flow || typeof flow !== "object") {
    status.hidden = false;
    status.textContent = "No Broadcast flow_by_priority data found in snapshot.json.";
    return;
  }

  const bands = ["highest", "high", "medium"];
  const baseLabels = ["Highest", "High", "Medium"];
  const themeColors = getThemeColors();
  const devMedian = bands.map((band) => {
    const value = flow?.[band]?.median_dev_days;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  });
  const uatMedian = bands.map((band) => {
    const value = flow?.[band]?.median_uat_days;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  });
  const devAvg = bands.map((band) => {
    const value = flow?.[band]?.avg_dev_days;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  });
  const uatAvg = bands.map((band) => {
    const value = flow?.[band]?.avg_uat_days;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  });
  const devCounts = bands.map((band) => toNumber(flow?.[band]?.n_dev));
  const uatCounts = bands.map((band) => toNumber(flow?.[band]?.n_uat));
  const labels = baseLabels;
  const totalFlowTickets = bands.reduce(
    (sum, band, idx) => sum + Math.max(devCounts[idx], uatCounts[idx]),
    0
  );
  context.textContent = `Broadcast, ${totalFlowTickets} historical flow tickets (sample)`;

  const traces = [
    {
      type: "bar",
      name: "Median Dev",
      x: labels,
      y: devMedian,
      marker: buildBarMarker(themeColors, readThemeColor("--mgmt-dev", "#98a3af"), {
        rounded: true,
        radius: 5
      }),
      customdata: labels.map((_, idx) => [devCounts[idx], formatDays(devAvg[idx])]),
      hovertemplate:
        "<b>%{x}</b><br>Median Dev: %{y:.2f} days<br>Avg Dev: %{customdata[1]} days<br>Issues used (Dev): %{customdata[0]}<extra></extra>"
    },
    {
      type: "bar",
      name: "Median UAT",
      x: labels,
      y: uatMedian,
      marker: buildBarMarker(themeColors, readThemeColor("--mgmt-uat", "#c0c8d1"), {
        rounded: true,
        radius: 5
      }),
      customdata: labels.map((_, idx) => [uatCounts[idx], formatDays(uatAvg[idx])]),
      hovertemplate:
        "<b>%{x}</b><br>Median UAT: %{y:.2f} days<br>Avg UAT: %{customdata[1]} days<br>Issues used (UAT): %{customdata[0]}<extra></extra>"
    }
  ];

  const yValues = [...devMedian, ...uatMedian].filter((value) => Number.isFinite(value));
  const variantCandidates = [
    flowVariants?.all,
    flowVariants?.bugs_only,
    state.snapshot?.kpis?.broadcast?.flow_by_priority
  ].filter((candidate) => candidate && typeof candidate === "object");
  const variantYValues = [];
  for (const candidate of variantCandidates) {
    for (const band of ["medium", "high", "highest"]) {
      const dev = candidate?.[band]?.median_dev_days;
      const uat = candidate?.[band]?.median_uat_days;
      if (typeof dev === "number" && Number.isFinite(dev)) variantYValues.push(dev);
      if (typeof uat === "number" && Number.isFinite(uat)) variantYValues.push(uat);
    }
  }
  const maxY = [...yValues, ...variantYValues].length
    ? Math.max(...yValues, ...variantYValues)
    : 1;
  const paddedMaxY = Math.max(1, Math.ceil(maxY * 1.12));

  const layout = {
    ...buildBaseLayout(themeColors),
    barmode: "group",
    barcornerradius: 5,
    uirevision: "broadcast-management",
    margin: { t: 18, r: 20, b: 52, l: 56 },
    bargap: 0.38,
    bargroupgap: 0.18,
    xaxis: buildChartXAxis(themeColors, {
      title: "Priority",
      tickmode: "array",
      tickvals: labels,
      ticktext: labels
    }),
    yaxis: buildChartYAxis(themeColors, {
      title: "Days",
      range: [0, paddedMaxY]
    })
  };

  Plotly.react("management-chart", traces, layout, {
    displayModeBar: true,
    displaylogo: false,
    responsive: true
  });

  if (scope === "bugs_only" && !scopedFlow) {
    status.hidden = false;
    status.textContent = "Bugs-only flow bars are unavailable in this snapshot; showing all-issues bars.";
  }
}

async function loadSnapshot() {
  const status = document.getElementById("status");
  const uatStatus = document.getElementById("uat-status");
  const managementStatus = document.getElementById("management-status");
  const sprintGoalsStatus = document.getElementById("sprint-goals-status");
  const productCycleStatus = document.getElementById("product-cycle-status");
  const lifecycleDaysStatus = document.getElementById("lifecycle-days-status");
  status.hidden = true;
  if (uatStatus) uatStatus.hidden = true;
  if (managementStatus) managementStatus.hidden = true;
  if (sprintGoalsStatus) sprintGoalsStatus.hidden = true;
  if (productCycleStatus) productCycleStatus.hidden = true;
  if (lifecycleDaysStatus) lifecycleDaysStatus.hidden = true;
  state.mode = getModeFromUrl();
  applyModeVisibility();

  try {
    const [snapshotResponse, sprintGoalsResponse, productCycleResponse] = await Promise.all([
      fetch("./snapshot.json", { cache: "no-store" }),
      fetch("./data/manual/sprint-goals.json", { cache: "no-store" }),
      fetch("./data/manual/product-cycle-times.json", { cache: "no-store" })
    ]);
    if (!snapshotResponse.ok) throw new Error(`snapshot.json HTTP ${snapshotResponse.status}`);
    state.snapshot = await snapshotResponse.json();
    if (sprintGoalsResponse.ok) {
      state.sprintGoals = await sprintGoalsResponse.json();
    } else {
      state.sprintGoals = null;
      if (sprintGoalsStatus) {
        sprintGoalsStatus.hidden = false;
        sprintGoalsStatus.textContent = `Failed to load sprint-goals.json: HTTP ${sprintGoalsResponse.status}`;
      }
    }
    if (productCycleResponse.ok) {
      state.productCycle = await productCycleResponse.json();
    } else {
      state.productCycle = null;
      if (productCycleStatus) {
        productCycleStatus.hidden = false;
        productCycleStatus.textContent = `Failed to load product-cycle-times.json: HTTP ${productCycleResponse.status}`;
      }
      if (lifecycleDaysStatus) {
        lifecycleDaysStatus.hidden = false;
        lifecycleDaysStatus.textContent = `Failed to load product-cycle-times.json: HTTP ${productCycleResponse.status}`;
      }
    }
    bindCompositionTeamScopeToggle();
    bindManagementUatScopeToggle();
    bindSprintGoalsTeamScopeToggle();
    bindProductCycleControls();
    bindLifecycleDaysControls();
    setLastUpdatedSubtitles(state.snapshot);
    setProductCycleUpdatedSubtitles(state.productCycle, state.snapshot?.updatedAt);
    if (state.mode !== "composition") {
      renderLineChart();
    }
    if (state.mode !== "trend") {
      renderStackedBarChart();
    }
    renderUatAgingChart();
    renderManagementChart();
    renderSprintGoalsChart();
    renderProductCycleChart();
    renderLifecycleDaysChart();
  } catch (error) {
    status.hidden = false;
    status.textContent = `Failed to load snapshot.json: ${
      error instanceof Error ? error.message : String(error)
    }`;
    if (uatStatus) {
      uatStatus.hidden = false;
      uatStatus.textContent = status.textContent;
    }
    if (managementStatus) {
      managementStatus.hidden = false;
      managementStatus.textContent = status.textContent;
    }
    if (sprintGoalsStatus) {
      sprintGoalsStatus.hidden = false;
      sprintGoalsStatus.textContent = status.textContent;
    }
    if (productCycleStatus) {
      productCycleStatus.hidden = false;
      productCycleStatus.textContent = status.textContent;
    }
    if (lifecycleDaysStatus) {
      lifecycleDaysStatus.hidden = false;
      lifecycleDaysStatus.textContent = status.textContent;
    }
  }
}

loadSnapshot();
