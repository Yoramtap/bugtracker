"use strict";

const UAT_PRIORITY_KEYS = ["medium", "high", "highest"];

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
  buildLifecycleRowsByPhaseAndTeam,
  buildProductCycleStackedRowsForYear,
  buildTeamColorMap,
  buildTintMap,
  computeLockedLifecycleYUpper,
  computeLockedProductCycleStackedYUpper,
  getProductCycleTeamsFromAggregates,
  mergePriorityFacilityBreakdown,
  orderProductCycleTeams,
  readDoneCountForTeam,
  readFlowMetricByBands,
  toCount,
  uatBucketWeekLabel
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

function setContextText(node, text) {
  if (!node) return;
  node.textContent = text;
}

function contextWithUpdated(text, updatedAt) {
  const baseText = String(text || "").trim();
  const updatedText = formatUpdatedAt(updatedAt);
  if (!baseText) return `Updated ${updatedText}`;
  return `${baseText} • updated ${updatedText}`;
}

function setPanelContext(node, text, updatedAt) {
  setContextText(node, contextWithUpdated(text, updatedAt));
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

function buildUatChartRows(uat) {
  const groupedByLabel = new Map();
  const facilityByBucketPriority =
    uat?.facility_by_bucket_priority && typeof uat.facility_by_bucket_priority === "object"
      ? uat.facility_by_bucket_priority
      : {};

  for (const bucket of uat.buckets) {
    const label = uatBucketWeekLabel(bucket);
    const row = groupedByLabel.get(label) || {
      bucketId: label,
      bucketLabel: label,
      total: 0,
      medium: 0,
      high: 0,
      highest: 0,
      priorityFacilityCounter: {}
    };

    for (const priorityKey of UAT_PRIORITY_KEYS) {
      const value = toNumber(uat?.priorities?.[priorityKey]?.buckets?.[bucket.id]);
      row[priorityKey] += value;
      row.total += value;
    }

    mergePriorityFacilityBreakdown(row.priorityFacilityCounter, facilityByBucketPriority[bucket.id]);
    row.facilityPriorityGroups = row.priorityFacilityCounter;
    row.bucketWithSample = `${row.bucketLabel} (n=${row.total})`;
    groupedByLabel.set(label, row);
  }

  return ["1-2 weeks", "1 month", "2 months", "More than 2 months"]
    .map((label) => groupedByLabel.get(label))
    .filter(Boolean);
}

function buildFlowPriorityRows(flow) {
  const bands = ["medium", "high", "highest"];
  const labels = ["Medium", "High", "Highest"];
  const devMedian = readFlowMetricByBands(flow, bands, "median_dev_days");
  const uatMedian = readFlowMetricByBands(flow, bands, "median_uat_days");
  const devAvg = readFlowMetricByBands(flow, bands, "avg_dev_days");
  const uatAvg = readFlowMetricByBands(flow, bands, "avg_uat_days");

  return labels.map((label, index) => ({
    label,
    devMedian: toNumber(devMedian[index]),
    uatMedian: toNumber(uatMedian[index]),
    devAvg: toNumber(devAvg[index]),
    uatAvg: toNumber(uatAvg[index]),
    devCount: toNumber(flow?.[bands[index]]?.n_dev),
    uatCount: toNumber(flow?.[bands[index]]?.n_uat)
  }));
}

function buildFlowPriorityYTicks(flowVariants, fallbackFlow) {
  const variantCandidates = [
    flowVariants?.ongoing,
    flowVariants?.all,
    flowVariants?.bugs_only,
    fallbackFlow
  ].filter((candidate) => candidate && typeof candidate === "object");
  const variantYValues = variantCandidates.flatMap((candidate) =>
    ["medium", "high", "highest"].flatMap((band) =>
      [candidate?.[band]?.median_dev_days, candidate?.[band]?.median_uat_days].filter(Number.isFinite)
    )
  );
  const maxY = variantYValues.length ? Math.max(...variantYValues) : 1;
  const paddedMaxY = Math.max(1, Math.ceil(maxY * 1.12));
  const yStep = paddedMaxY <= 40 ? 10 : paddedMaxY <= 100 ? 20 : 25;
  const yUpperNice = Math.ceil(paddedMaxY / yStep) * yStep;
  const yTicks = [];
  for (let value = 0; value <= yUpperNice; value += yStep) yTicks.push(value);
  return yTicks;
}

function buildFacilityRows(flowByFacility) {
  return Object.entries(flowByFacility)
    .map(([facility, metrics]) => {
      const node = metrics && typeof metrics === "object" ? metrics : {};
      const nDev = toNumber(node.n_dev);
      const nUat = toNumber(node.n_uat);
      const n = toNumber(node.n || Math.max(nDev, nUat));
      return {
        label: String(facility || "Unspecified"),
        devAvg: toNumber(node.avg_dev_days),
        uatAvg: toNumber(node.avg_uat_days),
        devCount: nDev,
        uatCount: nUat,
        sampleCount: n,
        issueIds: Array.isArray(node.issue_ids) ? node.issue_ids : []
      };
    })
    .filter((row) => row.sampleCount > 0)
    .sort((left, right) => {
      const leftIsUnspecified = String(left.label || "").trim().toLowerCase() === "unspecified";
      const rightIsUnspecified = String(right.label || "").trim().toLowerCase() === "unspecified";
      if (leftIsUnspecified && !rightIsUnspecified) return 1;
      if (!leftIsUnspecified && rightIsUnspecified) return -1;
      return left.label.localeCompare(right.label);
    });
}

function buildContributorRows(contributorsSnapshot) {
  return (Array.isArray(contributorsSnapshot?.top_contributors) ? contributorsSnapshot.top_contributors : [])
    .filter((row) => String(row?.contributor?.id || "").trim() !== "unassigned")
    .slice(0, 12)
    .map((row) => {
      const statusCounts = row?.status_counts && typeof row.status_counts === "object" ? row.status_counts : {};
      const ticketStateItems = Object.entries(statusCounts)
        .filter(([, count]) => toNumber(count) > 0)
        .sort((left, right) => {
          const leftCount = toNumber(left[1]);
          const rightCount = toNumber(right[1]);
          if (rightCount !== leftCount) return rightCount - leftCount;
          return String(left[0]).localeCompare(String(right[0]));
        })
        .map(([statusName, count]) => `${statusName} = ${toNumber(count)}`);

      return {
        contributor: String(row?.contributor?.name || row?.contributor?.id || "Unknown"),
        activeIssues: toNumber(row?.active_issues),
        doneIssues: toNumber(row?.done_issues),
        totalIssues: toNumber(row?.total_issues),
        notDoneIssues: Math.max(0, toNumber(row?.total_issues) - toNumber(row?.done_issues)),
        ticketStateItems
      };
    })
    .sort((left, right) => {
      if (right.totalIssues !== left.totalIssues) return right.totalIssues - left.totalIssues;
      if (right.activeIssues !== left.activeIssues) return right.activeIssues - left.activeIssues;
      if (right.doneIssues !== left.doneIssues) return right.doneIssues - left.doneIssues;
      return left.contributor.localeCompare(right.contributor);
    });
}

function getChartNodes(configKey) {
  const config = getConfig(configKey);
  if (!config) return null;
  const status = document.getElementById(config.statusId);
  const context = document.getElementById(config.contextId);
  if (!status) return null;
  if (!context) return null;
  return { config, status, context };
}

function withChart(configKey, onReady, { resetStatus = true } = {}) {
  const chart = getChartNodes(configKey);
  if (!chart) return;
  if (resetStatus) resetPanelStatus(chart.status);
  onReady(chart);
}

function resetPanelStatus(status) {
  if (!status) return;
  status.hidden = true;
}

function showPanelStatus(status, message, { containerId = "" } = {}) {
  if (!status) return;
  status.hidden = false;
  status.textContent = message;
  if (containerId) clearChartContainer(containerId);
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
  withChart("uat", ({ status, context, config }) => {
    if (!state.snapshot || !state.snapshot.uatAging) {
      showPanelStatus(status, "No UAT aging data found in backlog-snapshot.json.");
      return;
    }

    const uat = state.snapshot.uatAging;
    const scopeLabel = String(uat?.scope?.label || "Broadcast");
    const buckets = Array.isArray(uat.buckets) ? uat.buckets : [];

    if (buckets.length === 0) {
      showPanelStatus(status, "UAT aging buckets are missing from backlog-snapshot.json.");
      return;
    }

    const chartRows = buildUatChartRows(uat);
    setPanelContext(context, `${scopeLabel} • n=${toNumber(uat.totalIssues)}`, getSnapshotUpdatedAt());

    renderNamedChart(config, {
      containerId: config.containerId,
      rows: chartRows,
      buckets: chartRows,
      colors: getThemeColors()
    });
  });
}

function renderLeadAndCycleTimeByTeamChartFromPublicAggregates(publicAggregates, yearScope) {
  const panel = getChartNodes("product-cycle");
  const titleNode = document.getElementById("product-cycle-title");
  if (!panel) return;
  const { status, context, config } = panel;
  if (titleNode) titleNode.textContent = "Lead and cycle time by team";

  const teams = orderProductCycleTeams(
    getProductCycleTeamsFromAggregates(publicAggregates, state.productCycle?.teams)
  );
  if (teams.length === 0) {
    showPanelStatus(status, config.missingMessage);
    return;
  }

  const selectedYear = yearScope;

  const totalsNode = publicAggregates?.cycleTime?.totalsByYear?.[selectedYear]?.all || {};
  const samplesNode = totalsNode?.samples && typeof totalsNode.samples === "object" ? totalsNode.samples : {};
  const leadSampleCount = toCount(
    samplesNode?.full_backlog?.lead ??
      samplesNode?.lead ??
      totalsNode.lead_sample ??
      publicAggregates?.lifecyclePhaseDays?.totalsByYear?.[selectedYear]?.lead_sample ??
      0
  );
  const cycleSampleCount = toCount(
    samplesNode?.full_backlog?.cycle ??
      samplesNode?.cycle ??
      totalsNode.cycle_sample ??
      publicAggregates?.lifecyclePhaseDays?.totalsByYear?.[selectedYear]?.cycle_sample ??
      0
  );
  const sampleCount = Math.max(leadSampleCount, cycleSampleCount);
  const sampleLabel = `${cycleSampleCount}/${leadSampleCount} (cycle/lead)`;

  setPanelContext(
    context,
    `${selectedYear} • n=${sampleLabel}`,
    getProductCycleUpdatedAt()
  );

  if (sampleCount === 0) {
    showPanelStatus(status, `No completed product-cycle items found for ${selectedYear}.`, {
      containerId: config.containerId
    });
    return;
  }

  const themeColors = getThemeColors();
  const teamColorMap = buildTeamColorMap(teams);
  const leadTintByTeam = buildTintMap(teamColorMap, 0.35);
  const cycleTintByTeam = buildTintMap(teamColorMap, 0.02);
  const rows = buildProductCycleStackedRowsForYear({ publicAggregates, teams, year: selectedYear });
  const rowsWithCounts = rows.map((row) => {
    const leadN = toCount(row?.meta_lead?.n);
    const cycleN = toCount(row?.meta_cycle?.n);
    const rowSampleCount = Math.max(leadN, cycleN);
    const doneCount = readDoneCountForTeam(publicAggregates, selectedYear, row.team);
    return {
      ...row,
      teamWithSampleBase: `${row.team} (n=${rowSampleCount})`,
      sampleCount: rowSampleCount,
      doneCount
    };
  });
  // Keep axis fixed across year toggles, but snap to a clean boundary.
  const rawYUpper = computeLockedProductCycleStackedYUpper(
    publicAggregates,
    teams,
    PRODUCT_CYCLE_COMPARE_YEARS
  );
  const yUpper = Math.max(50, Math.ceil(rawYUpper / 50) * 50);
  const rowsWithSample = rowsWithCounts;
  const categorySecondaryLabels = Object.fromEntries(
    rowsWithSample.map((row) => [String(row.team || ""), `n=${toCount(row.sampleCount)}, done=${toNumber(row.doneCount)}`])
  );
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
      rows: rowsWithSample,
      seriesDefs,
      colors: themeColors,
      metricLabel: "Average",
      yUpperOverride: yUpper,
      showLegend: true,
      timeWindowLabel: "Lead and cycle time",
      orientation: "columns",
      colorByCategoryKey: "team",
      categoryKey: "team",
      categoryAxisHeight: 72,
      categoryTickTwoLine: true,
      categorySecondaryLabels
    },
    { missingMessage: "Product cycle chart unavailable: Recharts renderer missing." }
  );
}

function renderPublicAggregateChart(configKey, year, onReady) {
  const config = getConfig(configKey);
  if (config?.yearRadioName) syncRadioValue(config.yearRadioName, year);
  withChart(configKey, ({ status, context, config }) => {
    const value = state.productCycle?.publicAggregates;
    const publicAggregates = value && typeof value === "object" ? value : null;
    if (!publicAggregates) {
      showPanelStatus(status, config.missingMessage, { containerId: config.containerId });
      return;
    }
    onReady({ status, context, publicAggregates, config, year });
  });
}

function renderLifecycleTimeSpentPerStageChartFromPublicAggregates(publicAggregates, year) {
  const panel = getChartNodes("lifecycle-days");
  if (!panel) return;
  const { status, context, config } = panel;

  const teams = getProductCycleTeamsFromAggregates(publicAggregates, state.productCycle?.teams);
  if (teams.length === 0) {
    showPanelStatus(status, config.missingMessage);
    return;
  }

  const yearLabel = year;

  const themeColors = getThemeColors();
  const orderedTeams = orderProductCycleTeams(teams);
  const teamColorMap = buildTeamColorMap(orderedTeams, { ensureUnique: true });
  const lifecycleTintByTeam = buildTintMap(teamColorMap, 0.34);
  const { teamDefs: lifecycleTeamDefsBase, rows } = buildLifecycleRowsByPhaseAndTeam(publicAggregates, year, teams);
  const teamDefs = lifecycleTeamDefsBase.map((teamDef) => ({
    ...teamDef,
    color: themeColors.teams.api,
    showSeriesLabel: false,
    metaTeamColorMap: lifecycleTintByTeam
  }));
  const plottedValues = teamDefs
    .flatMap((teamDef) => rows.map((row) => row[teamDef.key]))
    .filter((value) => Number.isFinite(value) && value > 0);
  const categorySecondaryLabels = Object.fromEntries(
    rows.map((row) => [String(row.phaseLabel || ""), ""])
  );
  const lifecycleSampleSize = rows.reduce(
    (sum, row) =>
      sum +
      teamDefs.reduce((inner, def) => inner + toCount(row?.[`meta_${def.key}`]?.n), 0),
    0
  );

  if (plottedValues.length === 0) {
    showPanelStatus(status, `No lifecycle stage time data found for ${yearLabel}.`, {
      containerId: config.containerId
    });
    return;
  }
  const yUpper = computeLockedLifecycleYUpper(publicAggregates, teams, PRODUCT_CYCLE_COMPARE_YEARS);
  renderNamedChart(
    config,
    {
      containerId: config.containerId,
      rows,
      seriesDefs: teamDefs,
      colors: themeColors,
      metricLabel: "Average",
      yUpperOverride: yUpper,
      categoryKey: "phaseLabel",
      categoryAxisHeight: 72,
      categoryTickTwoLine: true,
      categorySecondaryLabels,
      timeWindowLabel: "",
      orientation: "columns",
      showLegend: false
    },
    { missingMessage: "Lifecycle chart unavailable: Recharts renderer missing." }
  );
  setPanelContext(
    context,
    `${yearLabel} • n=${lifecycleSampleSize}`,
    getProductCycleUpdatedAt()
  );
}

function renderLeadAndCycleTimeByTeamChart() {
  const yearScope = normalizeOption(state.productCycleYearScope, PRODUCT_CYCLE_COMPARE_YEARS, "2026");
  syncRadioValue("product-cycle-year-scope", yearScope);
  renderPublicAggregateChart("product-cycle", yearScope, ({ publicAggregates, year }) =>
    renderLeadAndCycleTimeByTeamChartFromPublicAggregates(publicAggregates, year)
  );
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
  renderPublicAggregateChart("lifecycle-days", year, ({ publicAggregates, year: selectedYear }) =>
    renderLifecycleTimeSpentPerStageChartFromPublicAggregates(publicAggregates, selectedYear)
  );
}

function renderDevelopmentTimeVsUatTimeChart() {
  withChart("management", ({ status, context, config }) => {
    const scope = "ongoing";
    const flowVariants = state.snapshot?.kpis?.broadcast?.flow_by_priority_variants;
    const scopedFlow = flowVariants && typeof flowVariants === "object" ? flowVariants[scope] : null;
    const flow = scopedFlow || state.snapshot?.kpis?.broadcast?.flow_by_priority;
    if (!flow || typeof flow !== "object") {
      showPanelStatus(status, "No Broadcast flow_by_priority data found in backlog-snapshot.json.");
      return;
    }

    const rows = buildFlowPriorityRows(flow);

    const totalFlowTickets = rows.reduce((sum, row) => sum + Math.max(row.devCount, row.uatCount), 0);
    setPanelContext(
      context,
      `${getBroadcastScopeLabel()} • ongoing • n=${totalFlowTickets}`,
      getSnapshotUpdatedAt()
    );

    renderNamedChart(config, {
      containerId: config.containerId,
      rows,
      colors: getThemeColors(),
      devColor: readThemeColor("--mgmt-dev", "#2f5f83"),
      uatColor: readThemeColor("--mgmt-uat", "#7fa8c4"),
      yTicks: buildFlowPriorityYTicks(flowVariants, state.snapshot?.kpis?.broadcast?.flow_by_priority)
    });
  });
}

function renderDevelopmentVsUatByFacilityChart() {
  withChart("management-facility", ({ status, context, config }) => {
    const scope = normalizeOption(state.managementFlowScope, MANAGEMENT_FLOW_SCOPES, "ongoing");
    syncRadioValue("management-facility-flow-scope", scope);

    const flowByFacilityVariants = state.snapshot?.kpis?.broadcast?.flow_by_facility_variants;
    const scopedFlowByFacility =
      flowByFacilityVariants && typeof flowByFacilityVariants === "object"
        ? flowByFacilityVariants[scope]
        : null;
    const flowByFacility =
      scopedFlowByFacility ||
      state.snapshot?.kpis?.broadcast?.flow_by_facility ||
      null;
    if (!flowByFacility || typeof flowByFacility !== "object") {
      showPanelStatus(status, "No Broadcast flow_by_facility data found in backlog-snapshot.json.");
      return;
    }

    const rows = buildFacilityRows(flowByFacility);
    if (rows.length === 0) {
      showPanelStatus(status, `No ${scope} facility rows found in flow_by_facility data.`);
      return;
    }

    const totalFlowTickets = rows.reduce((sum, row) => sum + row.sampleCount, 0);
    setPanelContext(
      context,
      `${getBroadcastScopeLabel()} • ${scope === "done" ? "done" : "ongoing"} • n=${totalFlowTickets}`,
      getSnapshotUpdatedAt()
    );

    renderNamedChart(config, {
      containerId: config.containerId,
      rows,
      colors: getThemeColors(),
      jiraBrowseBase: "https://nepgroup.atlassian.net/browse/",
      devColor:
        scope === "done"
          ? readThemeColor("--mgmt-done-dev", "#2f7d4d")
          : readThemeColor("--mgmt-dev", "#2f5f83"),
      uatColor:
        scope === "done"
          ? readThemeColor("--mgmt-done-uat", "#82bd95")
          : readThemeColor("--mgmt-uat", "#7fa8c4")
    });
  });
}

function renderTopContributorsChart() {
  withChart("contributors", ({ status, context, config }) => {
    const contributorsSnapshot = state.contributors;
    if (!Array.isArray(contributorsSnapshot?.top_contributors) || contributorsSnapshot.top_contributors.length === 0) {
      showPanelStatus(status, "No contributor data found in contributors-snapshot.json.", {
        containerId: config.containerId
      });
      return;
    }
    const rows = buildContributorRows(contributorsSnapshot);

    if (rows.length === 0) {
      showPanelStatus(status, "No assigned contributor data found after excluding Unassigned.", {
        containerId: config.containerId
      });
      return;
    }

    const summary = contributorsSnapshot?.summary || {};
    const total = toNumber(summary.total_issues);
    const notDone = toNumber(summary.active_issues);
    const done = toNumber(summary.done_issues);
    setPanelContext(
      context,
      `${notDone} not done • ${done} done • ${total} total`,
      state.contributors?.updatedAt || getSnapshotUpdatedAt()
    );

    renderNamedChart(config, {
      containerId: config.containerId,
      rows,
      colors: getThemeColors(),
      barColor: readThemeColor("--team-react", "#5ba896")
    });
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
