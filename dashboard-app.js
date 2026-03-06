"use strict";

const PRODUCT_CYCLE_COMPARE_YEARS = ["2025", "2026"];
const MANAGEMENT_FLOW_SCOPES = ["ongoing", "done"];
const CHART_CONFIG = {
  trend: {
    panelId: "trend-panel",
    statusId: "trend-status",
    contextId: "trend-context",
    containerId: "bug-trend-chart",
    rendererName: "renderBugBacklogTrendByTeamChart",
    missingMessage: "Trend chart unavailable: Recharts did not load. Check local script paths."
  },
  composition: {
    panelId: "composition-panel",
    statusId: "composition-status",
    contextId: "composition-context",
    containerId: "bug-composition-chart",
    rendererName: "renderBugCompositionByPriorityChart",
    missingMessage: "Composition chart unavailable: Recharts did not load. Check local script paths."
  },
  uat: {
    panelId: "uat-panel",
    statusId: "uat-status",
    contextId: "uat-context",
    containerId: "uat-open-by-priority-chart",
    rendererName: "renderUatPriorityAgingChart",
    missingMessage: "UAT chart unavailable: Recharts renderer missing."
  },
  management: {
    panelId: "management-panel",
    statusId: "management-status",
    contextId: "management-context",
    containerId: "development-time-vs-uat-time-chart",
    rendererName: "renderDevelopmentTimeVsUatTimeChart",
    missingMessage: "Management chart unavailable: Recharts renderer missing."
  },
  "management-facility": {
    panelId: "management-facility-panel",
    statusId: "management-facility-status",
    contextId: "management-facility-context",
    containerId: "development-vs-uat-by-facility-chart",
    rendererName: "renderDevelopmentVsUatByFacilityChart",
    missingMessage: "Facility chart unavailable: Recharts renderer missing."
  },
  contributors: {
    panelId: "contributors-panel",
    statusId: "contributors-status",
    contextId: "contributors-context",
    containerId: "top-contributors-chart",
    rendererName: "renderTopContributorsChart",
    missingMessage: "Contributors chart unavailable: Recharts renderer missing."
  },
  "product-cycle": {
    panelId: "product-cycle-panel",
    yearRadioName: "product-cycle-year-scope",
    statusId: "product-cycle-status",
    contextId: "product-cycle-context",
    containerId: "cycle-time-parking-lot-to-done-chart",
    rendererName: "renderLeadAndCycleTimeByTeamChart",
    missingMessage: "No product cycle aggregates found in product-cycle-snapshot.json."
  },
  "lifecycle-days": {
    panelId: "lifecycle-days-panel",
    yearRadioName: "lifecycle-days-year-scope",
    statusId: "lifecycle-days-status",
    contextId: "lifecycle-days-context",
    containerId: "lifecycle-time-spent-per-phase-chart",
    rendererName: "renderLifecycleTimeSpentPerStageChart",
    missingMessage: "No lifecycle aggregates found in product-cycle-snapshot.json."
  }
};
const CHART_STATUS_IDS = [...new Set(Object.values(CHART_CONFIG).map((config) => config.statusId))];
const DATA_SOURCE_CONFIG = {
  snapshot: {
    stateKey: "snapshot",
    url: "./backlog-snapshot.json",
    errorMessage: "Failed to load backlog-snapshot.json",
    statusIds: ["trend-status", "composition-status", "uat-status", "management-status", "management-facility-status"]
  },
  productCycle: {
    stateKey: "productCycle",
    url: "./product-cycle-snapshot.json",
    errorMessage: "Failed to load product-cycle-snapshot.json",
    statusIds: ["product-cycle-status", "lifecycle-days-status"]
  },
  contributors: {
    stateKey: "contributors",
    url: "./contributors-snapshot.json",
    errorMessage: "Failed to load contributors-snapshot.json",
    statusIds: ["contributors-status"],
    clearContainers: ["top-contributors-chart"]
  }
};
const CHART_DATA_SOURCES = {
  trend: ["snapshot"],
  composition: ["snapshot"],
  uat: ["snapshot"],
  management: ["snapshot"],
  "management-facility": ["snapshot"],
  contributors: ["contributors"],
  "product-cycle": ["productCycle"],
  "lifecycle-days": ["productCycle"]
};
const CHART_RENDERERS = {
  trend: renderTrendChart,
  composition: renderBugCompositionByPriorityChart,
  uat: renderUatAgingByPriorityChart,
  management: renderDevelopmentTimeVsUatTimeChart,
  "management-facility": renderDevelopmentVsUatByFacilityChart,
  contributors: renderTopContributorsChart,
  "product-cycle": renderLeadAndCycleTimeByTeamChart,
  "lifecycle-days": renderLifecycleTimeSpentPerStageChart
};
const CONTROL_BINDINGS = [
  {
    name: "composition-team-scope",
    stateKey: "compositionTeamScope",
    normalizeValue: (value) => value || "bc",
    onChangeRender: renderBugCompositionByPriorityChart
  },
  {
    name: "management-facility-flow-scope",
    stateKey: "managementFlowScope",
    normalizeValue: (value) => normalizeOption(value, MANAGEMENT_FLOW_SCOPES, "ongoing"),
    onChangeRender: renderDevelopmentVsUatByFacilityChart
  },
  {
    name: "product-cycle-year-scope",
    stateKey: "productCycleYearScope",
    normalizeValue: (value) => normalizeOption(value, PRODUCT_CYCLE_COMPARE_YEARS, "2026"),
    onChangeRender: renderLeadAndCycleTimeByTeamChart
  },
  {
    name: "lifecycle-days-year-scope",
    stateKey: "lifecycleDaysYearScope",
    normalizeValue: (value) => normalizeOption(value, PRODUCT_CYCLE_COMPARE_YEARS, "2026"),
    onChangeRender: renderLifecycleTimeSpentPerStageChart
  }
];

const state = {
  snapshot: null,
  contributors: null,
  productCycle: null,
  loadErrors: {},
  mode: "all",
  compositionTeamScope: "bc",
  managementFlowScope: "ongoing",
  productCycleYearScope: "2026",
  lifecycleDaysYearScope: "2026"
};

const dashboardUiUtils = window.DashboardViewUtils;
if (!dashboardUiUtils) {
  throw new Error("Dashboard UI helpers not loaded.");
}
const dashboardDataUtils = window.DashboardDataUtils;
if (!dashboardDataUtils) {
  throw new Error("Dashboard data helpers not loaded.");
}
const {
  toNumber,
  formatUpdatedAt,
  setStatusMessage,
  setStatusMessageForIds,
  readThemeColor,
  getThemeColors,
  clearChartContainer,
  getModeFromUrl,
  isEmbedMode
} = dashboardUiUtils;
const {
  buildTeamColorMap,
  buildTintMap,
  orderProductCycleTeams,
  toCount
} = dashboardDataUtils;

function normalizeOption(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

function getConfig(configKey) {
  return CHART_CONFIG[configKey] || null;
}

function getRenderer(config, rendererName = config.rendererName, missingMessage = config.missingMessage) {
  const renderer = window.DashboardCharts?.[rendererName];
  if (renderer) return renderer;
  setStatusMessage(config.statusId, missingMessage);
  return null;
}

function renderNamedChart(config, props, options = {}) {
  const { rendererName = config.rendererName, missingMessage = config.missingMessage } = options;
  const renderChart = getRenderer(config, rendererName, missingMessage);
  if (!renderChart) return false;
  renderChart(props);
  return true;
}

function renderSnapshotChart(config, extra = {}) {
  setStatusMessage(config.statusId);
  if (!state.snapshot || !Array.isArray(state.snapshot.combinedPoints)) return;
  renderNamedChart(config, {
    containerId: config.containerId,
    snapshot: state.snapshot,
    colors: getThemeColors(),
    ...extra
  });
}

function applyModeVisibility() {
  const validModes = new Set(Object.keys(CHART_CONFIG));
  const selectedMode = validModes.has(state.mode) ? state.mode : "all";
  const showAll = selectedMode === "all";
  document.body.classList.toggle("embed-mode", isEmbedMode());
  for (const [mode, config] of Object.entries(CHART_CONFIG)) {
    const panel = document.getElementById(config.panelId);
    if (!panel) continue;
    panel.hidden = showAll ? false : mode !== selectedMode;
  }
}

function contextWithUpdated(text, updatedAt) {
  const baseText = String(text || "").trim();
  const updatedText = formatUpdatedAt(updatedAt);
  if (!baseText) return `Updated ${updatedText}`;
  return `${baseText} • updated ${updatedText}`;
}

function setPanelContext(node, text, updatedAt) {
  if (!node) return;
  node.textContent = contextWithUpdated(text, updatedAt);
}

function setConfigContext(config, text, updatedAt) {
  setPanelContext(document.getElementById(config.contextId), text, updatedAt);
}

function getSnapshotUpdatedAt() {
  return state.snapshot?.updatedAt || "";
}

function getProductCycleUpdatedAt() {
  return state.productCycle?.generatedAt || getSnapshotUpdatedAt();
}

function getBroadcastScopeLabel() {
  return String(state.snapshot?.uatAging?.scope?.label || "Broadcast");
}

function getChartNodes(configKey) {
  const config = getConfig(configKey);
  if (!config) return null;
  const status = document.getElementById(config.statusId);
  const context = document.getElementById(config.contextId);
  return status && context ? { config, status, context } : null;
}

function withChart(configKey, onReady, { resetStatus = true } = {}) {
  const chart = getChartNodes(configKey);
  if (!chart) return;
  if (resetStatus) chart.status.hidden = true;
  onReady(chart);
}

function showPanelStatus(status, message, { containerId = "" } = {}) {
  if (!status) return;
  status.hidden = false;
  status.textContent = message;
  if (containerId) clearChartContainer(containerId);
}

function renderChartWithState(configKey, buildResult) {
  withChart(configKey, ({ status, context, config }) => {
    const result = buildResult({ status, context, config });
    if (!result) return;
    if (result.error) {
      showPanelStatus(
        status,
        result.error,
        result.clearContainer ? { containerId: config.containerId } : {}
      );
      return;
    }
    if (Object.prototype.hasOwnProperty.call(result, "contextText")) {
      setPanelContext(context, result.contextText, result.updatedAt || getSnapshotUpdatedAt());
    }
    renderNamedChart(
      config,
      {
        containerId: config.containerId,
        colors: getThemeColors(),
        ...(result.props || {})
      },
      result.options || {}
    );
  });
}

function renderBugCompositionByPriorityChart() {
  const config = getConfig("composition");
  const scope = state.compositionTeamScope || "bc";
  syncRadioValue("composition-team-scope", scope);
  const scopeLabelMap = {
    bc: "BC",
    api: "API",
    legacy: "Legacy",
    react: "React",
    all: "All"
  };
  setConfigContext(config, `${scopeLabelMap[scope] || "BC"} • last 10 snapshots`, getSnapshotUpdatedAt());
  renderSnapshotChart(config, { scope });
}

function renderTrendChart() {
  const config = getConfig("trend");
  setConfigContext(config, "", getSnapshotUpdatedAt());
  renderSnapshotChart(config);
}

function renderUatAgingByPriorityChart() {
  renderChartWithState("uat", ({ config: _config }) => {
    if (!state.snapshot || !state.snapshot.uatAging) {
      return { error: "No UAT aging data found in backlog-snapshot.json." };
    }

    const uat = state.snapshot.uatAging;
    const buckets = Array.isArray(uat.buckets) ? uat.buckets : [];
    const rows = Array.isArray(state.snapshot?.chartData?.uatAging?.rows) ? state.snapshot.chartData.uatAging.rows : [];

    if (buckets.length === 0 || rows.length === 0) {
      return { error: "UAT aging chart data is missing from backlog-snapshot.json." };
    }

    return {
      contextText: `${String(uat?.scope?.label || "Broadcast")} • n=${toNumber(uat.totalIssues)}`,
      props: { rows, buckets: rows }
    };
  });
}

function renderPublicAggregateChart(configKey, year, onReady) {
  const config = getConfig(configKey);
  if (config?.yearRadioName) syncRadioValue(config.yearRadioName, year);
  withChart(configKey, ({ status, context, config }) => {
    const chartDataValue = state.productCycle?.chartData;
    const chartData = chartDataValue && typeof chartDataValue === "object" ? chartDataValue : null;
    if (!chartData) {
      showPanelStatus(status, config.missingMessage, { containerId: config.containerId });
      return;
    }
    onReady({ status, context, chartData, config, year });
  });
}

function renderLeadAndCycleTimeByTeamChartFromChartData(chartYearData, year) {
  const panel = getChartNodes("product-cycle");
  const titleNode = document.getElementById("product-cycle-title");
  if (!panel || !chartYearData || typeof chartYearData !== "object") return false;
  const { status, context, config } = panel;
  if (titleNode) titleNode.textContent = "Lead and cycle time by team";

  const rows = Array.isArray(chartYearData.rows) ? chartYearData.rows : [];
  const teams = orderProductCycleTeams(
    Array.isArray(chartYearData.teams) ? chartYearData.teams.filter(Boolean) : []
  );
  if (teams.length === 0) return false;

  const sampleCount = toCount(chartYearData.sampleCount);
  setPanelContext(
    context,
    `${year} • n=${String(chartYearData.sampleLabel || "0/0 (cycle/lead)")}`,
    getProductCycleUpdatedAt()
  );

  if (sampleCount === 0) {
    showPanelStatus(status, `No completed product-cycle items found for ${year}.`, {
      containerId: config.containerId
    });
    return true;
  }

  const themeColors = getThemeColors();
  const teamColorMap = buildTeamColorMap(teams);
  const leadTintByTeam = buildTintMap(teamColorMap, 0.35);
  const cycleTintByTeam = buildTintMap(teamColorMap, 0.02);
  const seriesDefs = [
    {
      key: "cycle",
      name: "Cycle time",
      color: readThemeColor("--product-cycle-cycle", "#4e86b9"),
      categoryColors: cycleTintByTeam,
      showValueLabel: false
    },
    {
      key: "lead",
      name: "Lead time",
      color: readThemeColor("--product-cycle-lead", "#c58b4e"),
      categoryColors: leadTintByTeam,
      showValueLabel: false
    }
  ];

  renderNamedChart(
    config,
    {
      containerId: config.containerId,
      rows,
      seriesDefs,
      colors: themeColors,
      yUpperOverride: Math.max(50, toNumber(chartYearData.yUpper)),
      showLegend: true,
      timeWindowLabel: "Lead and cycle time",
      orientation: "columns",
      colorByCategoryKey: "team",
      categoryKey: "team",
      categoryAxisHeight: 72,
      categoryTickTwoLine: true,
      categorySecondaryLabels:
        chartYearData.categorySecondaryLabels && typeof chartYearData.categorySecondaryLabels === "object"
          ? chartYearData.categorySecondaryLabels
          : {}
    },
    { missingMessage: "Product cycle chart unavailable: Recharts renderer missing." }
  );
  return true;
}

function computeLifecycleChartYUpper(chartData) {
  const allYears = Object.values(chartData?.lifecycleByYear || {});
  const plottedValues = allYears.flatMap((yearNode) => {
    const rows = Array.isArray(yearNode?.rows) ? yearNode.rows : [];
    const teamDefs = Array.isArray(yearNode?.teamDefs) ? yearNode.teamDefs : [];
    return teamDefs.flatMap((teamDef, index) => {
      const key = String(teamDef?.slot || `slot_${index}`);
      return rows.map((row) => row?.[key]);
    });
  }).filter((value) => Number.isFinite(value) && value > 0);

  const storedUpper = allYears.reduce((max, yearNode) => Math.max(max, toNumber(yearNode?.yUpper)), 0);
  const fallbackUpper = Math.max(
    1,
    Math.ceil((plottedValues.length > 0 ? Math.max(...plottedValues) : 0) * 1.15)
  );
  return Math.max(storedUpper, fallbackUpper);
}

function renderLifecycleTimeSpentPerStageChartFromChartData(chartYearData, year) {
  const panel = getChartNodes("lifecycle-days");
  if (!panel || !chartYearData || typeof chartYearData !== "object") return false;
  const { status, context, config } = panel;

  const teams = orderProductCycleTeams(
    Array.isArray(chartYearData.teams) ? chartYearData.teams.filter(Boolean) : []
  );
  const rows = Array.isArray(chartYearData.rows) ? chartYearData.rows : [];
  const teamDefsBase = Array.isArray(chartYearData.teamDefs) ? chartYearData.teamDefs : [];
  if (teams.length === 0 || teamDefsBase.length === 0) return false;

  const themeColors = getThemeColors();
  const lifecycleTintByTeam = buildTintMap(buildTeamColorMap(teams, { ensureUnique: true }), 0.34);
  const teamDefs = teamDefsBase.map((teamDef, index) => ({
    key: String(teamDef?.slot || `slot_${index}`),
    ...teamDef,
    color: themeColors.teams.api,
    showSeriesLabel: false,
    metaTeamColorMap: lifecycleTintByTeam
  }));
  const plottedValues = teamDefs
    .flatMap((teamDef) => rows.map((row) => row[teamDef.key]))
    .filter((value) => Number.isFinite(value) && value > 0);
  const fallbackSampleSize = rows.reduce(
    (sum, row) =>
      sum +
      teamDefs.reduce((inner, def) => inner + toCount(row?.[`meta_${def.key}`]?.n), 0),
    0
  );
  const fallbackUniqueSampleSize = Math.max(
    toCount(state.productCycle?.chartData?.leadCycleByYear?.[year]?.leadSampleCount),
    toCount(state.productCycle?.chartData?.leadCycleByYear?.[year]?.sampleCount)
  );
  const sampleSize =
    toCount(chartYearData.sampleSize) || fallbackUniqueSampleSize || fallbackSampleSize;
  const yUpper = computeLifecycleChartYUpper(state.productCycle?.chartData);

  if (plottedValues.length === 0) {
    showPanelStatus(status, `No lifecycle stage time data found for ${year}.`, {
      containerId: config.containerId
    });
    return true;
  }

  renderNamedChart(
    config,
    {
      containerId: config.containerId,
      rows,
      seriesDefs: teamDefs,
      colors: themeColors,
      yUpperOverride: yUpper,
      categoryKey: "phaseLabel",
      categoryAxisHeight: 72,
      categoryTickTwoLine: true,
      categorySecondaryLabels: Object.fromEntries(rows.map((row) => [String(row.phaseLabel || ""), ""])),
      timeWindowLabel: "",
      orientation: "columns",
      showLegend: false
    },
    { missingMessage: "Lifecycle chart unavailable: Recharts renderer missing." }
  );
  setPanelContext(
    context,
    `${year} • n=${sampleSize}`,
    getProductCycleUpdatedAt()
  );
  return true;
}

function renderLeadAndCycleTimeByTeamChart() {
  const yearScope = normalizeOption(state.productCycleYearScope, PRODUCT_CYCLE_COMPARE_YEARS, "2026");
  renderPublicAggregateChart("product-cycle", yearScope, ({ chartData, year }) => {
    const chartYearData = chartData?.leadCycleByYear?.[year];
    if (renderLeadAndCycleTimeByTeamChartFromChartData(chartYearData, year)) return;
    const config = getConfig("product-cycle");
    if (config) {
      setStatusMessage(config.statusId, `No product cycle chart data found for ${year}.`);
      clearChartContainer(config.containerId);
    }
  });
}

function syncRadioValue(name, value) {
  const radios = Array.from(document.querySelectorAll(`input[name="${name}"]`));
  radios.forEach((radio) => {
    radio.checked = radio.value === value;
  });
}

function bindRadioState(name, stateKey, normalizeValue, onChangeRender) {
  const radios = Array.from(document.querySelectorAll(`input[name="${name}"]`));
  if (radios.length === 0) return;
  radios.forEach((radio) => {
    if (radio.dataset.bound === "1") return;
    radio.dataset.bound = "1";
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      state[stateKey] = normalizeValue(radio.value);
      onChangeRender();
    });
  });
}

function renderLifecycleTimeSpentPerStageChart() {
  const year = normalizeOption(state.lifecycleDaysYearScope, PRODUCT_CYCLE_COMPARE_YEARS, "2026");
  renderPublicAggregateChart("lifecycle-days", year, ({ chartData, year: selectedYear }) => {
    const chartYearData = chartData?.lifecycleByYear?.[selectedYear];
    if (renderLifecycleTimeSpentPerStageChartFromChartData(chartYearData, selectedYear)) return;
    const config = getConfig("lifecycle-days");
    if (config) {
      setStatusMessage(config.statusId, `No lifecycle chart data found for ${selectedYear}.`);
      clearChartContainer(config.containerId);
    }
  });
}

function renderDevelopmentTimeVsUatTimeChart() {
  renderChartWithState("management", () => {
    const rows = Array.isArray(state.snapshot?.chartData?.management?.ongoing?.rows)
      ? state.snapshot.chartData.management.ongoing.rows
      : [];
    const yTicks = Array.isArray(state.snapshot?.chartData?.management?.ongoing?.yTicks)
      ? state.snapshot.chartData.management.ongoing.yTicks
      : [];
    if (rows.length === 0 || yTicks.length === 0) {
      return { error: "No Broadcast management chart data found in backlog-snapshot.json." };
    }
    return {
      contextText: `${getBroadcastScopeLabel()} • ongoing • n=${rows.reduce((sum, row) => sum + Math.max(row.devCount, row.uatCount), 0)}`,
      props: {
        rows,
        devColor: readThemeColor("--mgmt-dev", "#2f5f83"),
        uatColor: readThemeColor("--mgmt-uat", "#7fa8c4"),
        yTicks
      }
    };
  });
}

function renderDevelopmentVsUatByFacilityChart() {
  renderChartWithState("management-facility", () => {
    const scope = normalizeOption(state.managementFlowScope, MANAGEMENT_FLOW_SCOPES, "ongoing");
    syncRadioValue("management-facility-flow-scope", scope);
    const rows = Array.isArray(state.snapshot?.chartData?.managementFacility?.byScope?.[scope]?.rows)
      ? state.snapshot.chartData.managementFacility.byScope[scope].rows
      : [];
    if (rows.length === 0) {
      return { error: `No ${scope} facility chart data found in backlog-snapshot.json.` };
    }

    const doneScope = scope === "done";
    return {
      contextText: `${getBroadcastScopeLabel()} • ${doneScope ? "done" : "ongoing"} • n=${rows.reduce((sum, row) => sum + row.sampleCount, 0)}`,
      props: {
        rows,
        jiraBrowseBase: "https://nepgroup.atlassian.net/browse/",
        devColor: doneScope
          ? readThemeColor("--mgmt-done-dev", "#2f7d4d")
          : readThemeColor("--mgmt-dev", "#2f5f83"),
        uatColor: doneScope
          ? readThemeColor("--mgmt-done-uat", "#82bd95")
          : readThemeColor("--mgmt-uat", "#7fa8c4")
      }
    };
  });
}

function renderTopContributorsChart() {
  renderChartWithState("contributors", ({ config: _config }) => {
    const contributorsSnapshot = state.contributors;
    const rows = Array.isArray(contributorsSnapshot?.chartData?.rows) ? contributorsSnapshot.chartData.rows : [];
    if (rows.length === 0) {
      return {
        error: "No contributor chart data found in contributors-snapshot.json.",
        clearContainer: true
      };
    }

    const summary = contributorsSnapshot?.summary || {};
    return {
      contextText: `${toNumber(summary.active_issues)} not done • ${toNumber(summary.done_issues)} done • ${toNumber(summary.total_issues)} total`,
      updatedAt: state.contributors?.updatedAt || getSnapshotUpdatedAt(),
      props: {
        rows,
        barColor: readThemeColor("--team-react", "#5ba896")
      }
    };
  });
}

function bindDashboardControls() {
  CONTROL_BINDINGS.forEach(({ name, stateKey, normalizeValue, onChangeRender }) => {
    bindRadioState(name, stateKey, normalizeValue, onChangeRender);
  });
}

function renderVisibleCharts() {
  Object.entries(CHART_RENDERERS).forEach(([mode, run]) => {
    const requiredSources = CHART_DATA_SOURCES[mode] || [];
    if (requiredSources.some((key) => state.loadErrors[key])) return;
    if (state.mode === "all" || state.mode === mode) run();
  });
}

function getRequiredSourceKeys(mode) {
  if (mode === "all") return Object.keys(DATA_SOURCE_CONFIG);
  return CHART_DATA_SOURCES[mode] || ["snapshot"];
}

async function loadDataSource(sourceKey) {
  const source = DATA_SOURCE_CONFIG[sourceKey];
  if (!source) return;
  try {
    const response = await fetch(source.url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state[source.stateKey] = await response.json();
  } catch (error) {
    state[source.stateKey] = null;
    const message = `${source.errorMessage}: ${error instanceof Error ? error.message : String(error)}`;
    state.loadErrors[sourceKey] = message;
    setStatusMessageForIds(source.statusIds || [], message);
    (source.clearContainers || []).forEach(clearChartContainer);
  }
}

async function loadSnapshot() {
  setStatusMessageForIds(CHART_STATUS_IDS);
  state.snapshot = null;
  state.productCycle = null;
  state.contributors = null;
  state.loadErrors = {};
  state.mode = getModeFromUrl();
  applyModeVisibility();

  try {
    const requiredSourceKeys = getRequiredSourceKeys(state.mode);
    await Promise.all(requiredSourceKeys.map((sourceKey) => loadDataSource(sourceKey)));
    bindDashboardControls();
    renderVisibleCharts();
  } catch (error) {
    const message = `Failed to load backlog-snapshot.json: ${
      error instanceof Error ? error.message : String(error)
    }`;
    setStatusMessageForIds(CHART_STATUS_IDS, message);
  }
}

loadSnapshot();
