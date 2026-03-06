/* global React, ReactDOM, Recharts */
"use strict";

(function initDashboardChartCore() {
  if (!window.React || !window.ReactDOM || !window.Recharts) {
    return;
  }

  const dashboardUiUtils = window.DashboardViewUtils;
  if (!dashboardUiUtils) {
    throw new Error("Dashboard UI helpers not loaded.");
  }

  const h = React.createElement;
  const {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    ReferenceDot,
    ReferenceLine,
    Cell,
    LabelList,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip
  } = Recharts;
  const { toNumber, formatDateShort, getModeFromUrl } = dashboardUiUtils;
  const SHARED_CATEGORY_BLUE_TINTS = ["#CFE0F8", "#9EBAE3", "#6D95D1", "#3F73B8", "#295996"];
  const BAR_LAYOUT = { categoryGap: "14%", groupGap: 2, denseMax: 14, normalMax: 20 };
  const CHART_HEIGHTS = { standard: 280, dense: 320 };
  const EMBED_CHART_HEIGHTS = {
    trend: 520,
    composition: 560,
    uat: 460,
    management: 440,
    "management-facility": 520,
    contributors: 520,
    "product-cycle": 560,
    "lifecycle-days": 560
  };
  const HORIZONTAL_CATEGORY_AXIS_WIDTH = 190;
  const BAR_CURSOR_FILL = "rgba(31,51,71,0.04)";
  const roots = new Map();
  const TEAM_CONFIG = [
    { key: "api", label: "API" },
    { key: "legacy", label: "Legacy FE" },
    { key: "react", label: "React FE" },
    { key: "bc", label: "BC" }
  ];
  const PRIORITY_CONFIG = [
    { key: "medium", label: "Medium" },
    { key: "high", label: "High" },
    { key: "highest", label: "Highest" }
  ];
  const PRIORITY_STACK_ORDER = [
    { key: "lowest", label: "Lowest" },
    { key: "low", label: "Low" },
    { key: "medium", label: "Medium" },
    { key: "high", label: "High" },
    { key: "highest", label: "Highest" }
  ];
  const MAX_SPRINT_POINTS = 10;
  const TREND_TEAM_LINES = [
    ["api", "API", "api"],
    ["legacy", "Legacy FE", "legacy"],
    ["react", "React FE", "react"],
    ["bc", "BC", "bc"]
  ];
  const TREND_LONG_LINES = [
    { dataKey: "bcLong30", name: "BC long-standing (30d+)", stroke: "#8e9aaa", strokeDasharray: "4 3" },
    { dataKey: "bcLong60", name: "BC long-standing (60d+)", stroke: "#6f7f92", strokeDasharray: "7 4" }
  ];

  function toWhole(value) {
    return Math.round(toNumber(value));
  }

  function toWeeks(valueInDays) {
    return toNumber(valueInDays) / 7;
  }

  function toWholeWeeksForChart(valueInDays) {
    const days = toNumber(valueInDays);
    if (days <= 0) return 0;
    if (days < 7) return 1;
    return Math.max(1, Math.round(toWeeks(days)));
  }

  function formatWeeksFromDays(valueInDays) {
    const days = toNumber(valueInDays);
    if (days <= 0) return "0 weeks";
    if (days < 7) return "<1 week";
    const weeks = Math.max(1, Math.round(toWeeks(days)));
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }

  function formatAverageLabel(value, unit = "days") {
    if (unit === "weeks") {
      const text = formatWeeksFromDays(value).replace("<1 week", "< 1 week");
      return `${text} avg`;
    }
    return `${toWhole(value)} ${unit} avg`;
  }

  function buildWeekAxis(maxValueWeeks, options = {}) {
    const majorStep = Math.max(1, toWhole(options?.majorStep || 0));
    const fixedStep = Number.isFinite(majorStep) && majorStep > 0 ? majorStep : null;
    const maxWeeks = Math.max(1, Math.ceil(toNumber(maxValueWeeks)));
    if (fixedStep) {
      const axisWeeks = Math.max(fixedStep, Math.ceil(maxWeeks / fixedStep) * fixedStep);
      const ticks = [0];
      for (let week = fixedStep; week <= axisWeeks; week += fixedStep) ticks.push(week);
      return { upper: axisWeeks, ticks };
    }

    const targetSteps = 6;
    const roughStep = maxWeeks / targetSteps;
    let step = 1;
    if (roughStep > 1 && roughStep <= 2) step = 2;
    else if (roughStep > 2 && roughStep <= 5) step = 5;
    else if (roughStep > 5) step = 10;

    const upper = Math.max(step, Math.ceil(maxWeeks / step) * step);
    const ticks = [];
    for (let week = 0; week <= upper; week += step) ticks.push(week);
    return { upper, ticks };
  }

  function trendTickInterval(pointsCount) {
    const count = Math.max(0, toWhole(pointsCount));
    if (count <= 8) return 0;
    if (count <= 16) return 1;
    return 2;
  }

  function viewportWidthPx() {
    if (typeof window === "undefined") return 1280;
    const direct = Number(window.innerWidth);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const fallback = Number(document?.documentElement?.clientWidth);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 1280;
  }

  function singleChartHeightForMode(modeKey, baseHeight) {
    if (getModeFromUrl() !== modeKey) return baseHeight;
    return EMBED_CHART_HEIGHTS[modeKey] || baseHeight;
  }

  function isCompactViewport() {
    return viewportWidthPx() <= 680;
  }

  function tickIntervalForMobileLabels(pointsCount) {
    const count = Math.max(0, toWhole(pointsCount));
    if (count <= 8) return 0;
    if (count <= 12) return 1;
    if (count <= 18) return 2;
    return 3;
  }

  function trendLayoutForViewport(pointsCount) {
    const width = viewportWidthPx();
    if (width <= 680) {
      return {
        chartHeight: singleChartHeightForMode("trend", 224),
        margin: { top: 10, right: 8, bottom: 24, left: 8 },
        xTickFontSize: 10,
        yTickFontSize: 10,
        xTickMargin: 4,
        minTickGap: 8,
        legendCompact: true,
        xAxisInterval: trendTickInterval(pointsCount)
      };
    }
    if (width <= 1024) {
      return {
        chartHeight: singleChartHeightForMode("trend", 252),
        margin: { top: 12, right: 10, bottom: 28, left: 10 },
        xTickFontSize: 11,
        yTickFontSize: 11,
        xTickMargin: 5,
        minTickGap: 6,
        legendCompact: false,
        xAxisInterval: pointsCount > 14 ? 1 : 0
      };
    }
    return {
      chartHeight: singleChartHeightForMode("trend", CHART_HEIGHTS.standard),
      margin: { top: 12, right: 12, bottom: 32, left: 12 },
      xTickFontSize: 11,
      yTickFontSize: 11,
      xTickMargin: 6,
      minTickGap: 4,
      legendCompact: false,
      xAxisInterval: 0
    };
  }

  function computeYUpper(values, { min = 1, pad = 1.12 } = {}) {
    const finiteValues = (Array.isArray(values) ? values : []).filter(Number.isFinite);
    if (finiteValues.length === 0) return min;
    return Math.max(min, Math.ceil(Math.max(...finiteValues) * pad));
  }

  function buildNiceNumberAxis(maxValue) {
    const max = Math.max(0, toNumber(maxValue));
    if (max <= 1) return { upper: 1, ticks: [0, 1] };
    const targetSteps = 6;
    const roughStep = max / targetSteps;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    const niceBase = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const step = niceBase * magnitude;
    const upper = Math.max(step, Math.ceil(max / step) * step);
    const ticks = [];
    for (let value = 0; value <= upper; value += step) ticks.push(value);
    return { upper, ticks };
  }

  function groupedBarGeometry(rowsCount, seriesCount = 2) {
    const safeSeriesCount = Math.max(1, Math.floor(toNumber(seriesCount) || 1));
    let categoryGap = BAR_LAYOUT.categoryGap;
    let targetGroupWidth = 68;
    if (rowsCount <= 8) {
      categoryGap = "30%";
      targetGroupWidth = 88;
    } else if (rowsCount <= 14) {
      categoryGap = "14%";
      targetGroupWidth = 102;
    }
    const rawBarSize = (targetGroupWidth - BAR_LAYOUT.groupGap * (safeSeriesCount - 1)) / safeSeriesCount;
    const barSize = Math.max(12, Math.round(rawBarSize));
    return {
      categoryGap,
      barSize,
      maxBarSize: Math.max(barSize, Math.round(barSize * 1.25))
    };
  }

  function makeTooltipLine(
    key,
    text,
    colors,
    {
      margin = "2px 0",
      fontSize = "12px",
      fontWeight,
      color,
      lineHeight = "1.4",
      subItems = null,
      isTitle = false
    } = {}
  ) {
    return {
      key,
      text: String(text ?? ""),
      style: {
        margin,
        color: color || colors.text,
        fontSize: fontSize || undefined,
        fontWeight: fontWeight || undefined,
        lineHeight: lineHeight || undefined
      },
      subItems: Array.isArray(subItems) ? subItems : null,
      isTitle: Boolean(isTitle)
    };
  }

  function tooltipTitleLine(key, text, colors) {
    return makeTooltipLine(key, text, colors, {
      margin: "0 0 6px",
      fontWeight: 700,
      fontSize: null,
      isTitle: true
    });
  }

  function createTooltipContent(colors, buildLines) {
    return function renderTooltip({ active, payload }) {
      if (!active || !Array.isArray(payload) || payload.length === 0) return null;
      const row = payload[0]?.payload || {};
      return renderTooltipCard(colors, buildLines(row, payload));
    };
  }

  function isCoarsePointerDevice() {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  function dismissTooltipFromTap(node) {
    if (!node || typeof node.closest !== "function" || typeof window === "undefined") return;
    const wrapper = node.closest(".recharts-wrapper");
    if (!wrapper) return;
    try {
      wrapper.dispatchEvent(
        new MouseEvent("mouseleave", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    } catch {
      // no-op
    }
    try {
      wrapper.dispatchEvent(
        new Event("touchend", {
          bubbles: true,
          cancelable: true
        })
      );
    } catch {
      // no-op
    }
  }

  function toggleLegendKey(prevSet, key) {
    const next = new Set(prevSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  }

  function renderTooltipCard(colors, blocks) {
    const suppressHoverPropagation = (event) => {
      if (!event) return;
      event.stopPropagation();
    };
    const suppressHoverPropagationCapture = (event) => {
      if (!event) return;
      event.stopPropagation();
      if (typeof event.preventDefault === "function") event.preventDefault();
    };
    const normalizeLine = (entry, index) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        return { key: `line-${index}`, text: entry, subItems: null, isTitle: false, style: {} };
      }
      if (typeof entry === "object" && "text" in entry) return entry;
      return null;
    };
    const asSubItems = (line) => {
      if (!line || line.isTitle) return [];
      if (Array.isArray(line.subItems) && line.subItems.length > 0) {
        return line.subItems
          .map((item) => (typeof item === "string" ? item.trim() : item))
          .filter((item) => {
            if (item === null || item === undefined) return false;
            if (typeof item === "string") return item.length > 0;
            return true;
          });
      }
      const rawText = String(line.text || "").trim();
      const colonIndex = rawText.indexOf(":");
      if (colonIndex > 0) {
        const label = rawText.slice(0, colonIndex).trim();
        const detail = rawText.slice(colonIndex + 1).trim();
        const parts = detail.split(",").map((part) => part.trim()).filter(Boolean);
        if (parts.length > 1) {
          line.text = label;
          return parts;
        }
      }
      return [];
    };
    const normalizeMainText = (line) => {
      if (!line || line.isTitle) return String(line?.text || "");
      const rawText = String(line.text || "").trim();
      const colonIndex = rawText.indexOf(":");
      if (colonIndex > 0) {
        const label = rawText.slice(0, colonIndex).trim();
        const detail = rawText.slice(colonIndex + 1).trim();
        const parts = detail.split(",").map((part) => part.trim()).filter(Boolean);
        if (parts.length > 1) return label;
      }
      return rawText;
    };
    const flattenSingleSubItem = (line, subItems) => {
      if (!line || line.isTitle) return String(line?.text || "");
      if (!Array.isArray(subItems) || subItems.length !== 1) return normalizeMainText(line);
      const [onlyItem] = subItems;
      if (typeof onlyItem !== "string") return normalizeMainText(line);
      return `${normalizeMainText(line)}, ${onlyItem}`;
    };
    const lines = (Array.isArray(blocks) ? blocks : []).map(normalizeLine).filter(Boolean);

    return h(
      "div",
      {
        style: {
          border: `1px solid ${colors.tooltip.border}`,
          background: colors.tooltip.bg,
          color: colors.tooltip.text,
          borderRadius: "6px",
          padding: "8px 10px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
        },
        onMouseEnter: suppressHoverPropagation,
        onMouseMove: suppressHoverPropagation,
        onMouseOver: suppressHoverPropagation,
        onMouseEnterCapture: suppressHoverPropagationCapture,
        onMouseMoveCapture: suppressHoverPropagationCapture,
        onMouseOverCapture: suppressHoverPropagationCapture,
        onPointerEnter: suppressHoverPropagation,
        onPointerMove: suppressHoverPropagation,
        onPointerEnterCapture: suppressHoverPropagationCapture,
        onPointerMoveCapture: suppressHoverPropagationCapture,
        onClick: (event) => {
          if (!isCoarsePointerDevice()) return;
          event.preventDefault();
          event.stopPropagation();
          dismissTooltipFromTap(event.currentTarget);
        }
      },
      ...lines.map((line, index) => {
        if (line.isTitle) {
          return h(
            "p",
            {
              key: line.key || `tooltip-title-${index}`,
              style: {
                margin: "0 0 6px",
                color: line?.style?.color || colors.text,
                fontSize: line?.style?.fontSize || "12px",
                fontWeight: line?.style?.fontWeight || 700,
                lineHeight: line?.style?.lineHeight || "1.4"
              }
            },
            String(line.text || "")
          );
        }

        const subItems = asSubItems(line);
        const flattenedText = flattenSingleSubItem(line, subItems);
        const showNestedItems =
          subItems.length > 1 || (subItems.length === 1 && !flattenedText.includes(String(subItems[0])));
        return h(
          "ul",
          {
            key: line.key || `tooltip-ul-${index}`,
            style: {
              margin: 0,
              paddingLeft: "18px",
              listStyleType: "disc"
            }
          },
          h(
            "li",
            {
              style: {
                margin: "2px 0",
                color: line?.style?.color || colors.text,
                fontSize: line?.style?.fontSize || "12px",
                fontWeight: 500,
                lineHeight: line?.style?.lineHeight || "1.4"
              }
            },
            h("span", null, flattenedText),
            showNestedItems
              ? h(
                  "ul",
                  {
                    style: {
                      margin: "4px 0 0",
                      paddingLeft: "16px",
                      listStyleType: "circle"
                    }
                  },
                  subItems.map((sub, subIndex) =>
                    h(
                      "li",
                      {
                        key: `${line.key || index}-sub-${subIndex}`,
                        style: {
                          margin: "1px 0",
                          fontSize: "11px",
                          fontWeight: 500,
                          lineHeight: "1.35",
                          color: "rgba(31,51,71,0.9)"
                        }
                      },
                      React.isValidElement(sub) ? sub : String(sub)
                    )
                  )
                )
              : null
          )
        );
      })
    );
  }

  function renderLegendNode({ colors, defs, hiddenKeys, setHiddenKeys, compact = false }) {
    const shortLabel = (value) => {
      const raw = String(value || "");
      if (!compact) return raw;
      if (raw === "BC long-standing (30d+)") return "BC 30d+";
      if (raw === "BC long-standing (60d+)") return "BC 60d+";
      if (raw === "Median Dev") return "Dev";
      if (raw === "Median UAT") return "UAT";
      return raw;
    };
    return h(
      "details",
      {
        className: "series-drawer",
        open: true
      },
      h("summary", { className: "series-drawer__summary" }, "Series"),
      h(
        "div",
        { className: "series-drawer__items" },
        defs.map((item) => {
          const key = item?.dataKey || "";
          const hidden = hiddenKeys.has(key);
          const swatchColor = item?.stroke || item?.fill || colors.text;
          return h(
            "button",
            {
              type: "button",
              className: "series-drawer__item",
              "aria-pressed": hidden ? "false" : "true",
              title: hidden ? `Show ${item.name}` : `Hide ${item.name}`,
              onClick: () => setHiddenKeys((prev) => toggleLegendKey(prev, key))
            },
            h("span", {
              className: "series-drawer__swatch",
              style: { background: swatchColor, opacity: hidden ? 0.35 : 1 }
            }),
            h(
              "span",
              {
                className: "series-drawer__label",
                style: {
                  color: "var(--text, #1f3347)",
                  opacity: hidden ? 0.45 : 1,
                  textDecoration: hidden ? "line-through" : "none",
                  fontSize: compact ? 11 : 12
                }
              },
              shortLabel(item.name)
            )
          );
        })
      )
    );
  }

  function axisTick(colors) {
    return { fill: colors.text, fontSize: 12, fontWeight: 500 };
  }

  function buildCategoryColorsFromRows(rows, categoryKey) {
    const uniqueLabels = [];
    const seen = new Set();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const label = String(row?.[categoryKey] || "");
      if (!label || seen.has(label)) return;
      seen.add(label);
      uniqueLabels.push(label);
    });
    const mapped = {};
    uniqueLabels.forEach((label, index) => {
      mapped[label] = SHARED_CATEGORY_BLUE_TINTS[index % SHARED_CATEGORY_BLUE_TINTS.length];
    });
    return mapped;
  }

  function twoLineCategoryTickFactory(
    colors,
    { textAnchor = "end", dy = 3, line2Dy = 14, secondaryLabels = null } = {}
  ) {
    return function twoLineCategoryTick(props) {
      const { x, y, payload } = props || {};
      const raw = String(payload?.value || "");
      const splitIndex = raw.indexOf(" (n=");
      const fallbackLine2 = splitIndex > 0 ? raw.slice(splitIndex + 1) : "";
      const mappedLine2 =
        secondaryLabels && typeof secondaryLabels === "object"
          ? String(secondaryLabels[raw] || "")
          : "";
      const line1 = raw;
      const line2 = mappedLine2 || fallbackLine2;
      if (secondaryLabels && textAnchor === "middle") {
        return h(
          "g",
          { transform: `translate(${x},${y})` },
          h(
            "text",
            {
              x: 0,
              y: 12,
              textAnchor: "middle",
              fill: colors.text,
              fontSize: 12
            },
            line1
          ),
          line2
            ? h(
                "text",
                {
                  x: 0,
                  y: 28,
                  textAnchor: "middle",
                  fill: "rgba(31,51,71,0.78)",
                  fontSize: 11
                },
                line2
              )
            : null
        );
      }
      return h(
        "g",
        { transform: `translate(${x},${y})` },
        h(
          "text",
          {
            x: 0,
            y: 0,
            dy,
            textAnchor,
            fill: colors.text,
            fontSize: 12
          },
          h("tspan", { x: 0, dy: 0 }, line1),
          line2
            ? h("tspan", { x: 0, dy: line2Dy, fill: "rgba(31,51,71,0.75)", fontSize: 11 }, line2)
            : null
        )
      );
    };
  }

  function baseYAxisProps(colors, domain = null) {
    return {
      stroke: colors.text,
      tick: axisTick(colors),
      allowDecimals: false,
      ...(domain ? { domain } : {})
    };
  }

  function ensureRoot(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    if (!roots.has(containerId)) {
      roots.set(containerId, ReactDOM.createRoot(container));
    }
    return roots.get(containerId);
  }

  function clearChart({ containerId }) {
    if (!containerId) return;
    const root = roots.get(containerId);
    if (root) {
      root.render(null);
      return;
    }
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";
  }

  function renderWithRoot(containerId, canRender, renderFn) {
    const root = ensureRoot(containerId);
    if (!root) return;
    if (!canRender) {
      root.render(null);
      return;
    }
    renderFn(root);
  }

  function renderBarChartShell({
    rows,
    colors,
    height,
    margin,
    chartLayout,
    layout,
    xAxisProps,
    yAxisProps,
    tooltipProps,
    legendDrawerNode,
    barNodes,
    overlayNodes = [],
    gridVertical = false,
    gridHorizontal = true
  }) {
    return h(
      "div",
      { className: "chart-series-shell" },
      legendDrawerNode,
      h(
        ResponsiveContainer,
        { width: "100%", height },
        h(
          BarChart,
          {
            data: rows,
            layout: chartLayout,
            margin,
            barCategoryGap: layout.categoryGap,
            barGap: BAR_LAYOUT.groupGap,
            maxBarSize: layout.maxBarSize
          },
          h(CartesianGrid, { stroke: colors.grid, vertical: gridVertical, horizontal: gridHorizontal }),
          h(XAxis, xAxisProps),
          h(YAxis, yAxisProps),
          h(Tooltip, tooltipProps),
          ...barNodes,
          ...overlayNodes
        )
      )
    );
  }

  const ACTIVE_BAR_STYLE = { fillOpacity: 1 };

  function barBaseStyle(colors) {
    return {
      stroke: colors.barBorder || "#111111",
      strokeOpacity: 1,
      strokeWidth: 0.7
    };
  }

  function activeLineDot(colors) {
    return {
      r: 6,
      stroke: colors.tooltip.bg,
      strokeWidth: 2.2
    };
  }

  function GroupedBarChartView({
    rows,
    defs,
    colors,
    yUpper,
    xAxisProps,
    yAxisProps,
    tooltipProps,
    showLegend = true,
    chartLayout = "horizontal",
    colorByCategoryKey = "",
    categoryColors = null,
    overlayDots = [],
    gridVertical = false,
    gridHorizontal = true,
    height = CHART_HEIGHTS.standard,
    margin = { top: 12, right: 12, bottom: 34, left: 12 }
  }) {
    const [hiddenKeys, setHiddenKeys] = React.useState(() => new Set());
    const stackIds = defs.map((def) => String(def?.stackId || "").trim()).filter(Boolean);
    const isFullyStacked = stackIds.length > 0 && new Set(stackIds).size === 1;
    const isHorizontalSingleSeries = chartLayout === "vertical" && defs.length === 1;
    const geometry = isFullyStacked
      ? { categoryGap: "10%", barSize: null, maxBarSize: 96 }
      : isHorizontalSingleSeries
        ? { categoryGap: "18%", barSize: 30, maxBarSize: 30 }
        : groupedBarGeometry(rows.length, defs.length);
    const effectiveCategoryColors =
      colorByCategoryKey && (!categoryColors || Object.keys(categoryColors).length === 0)
        ? buildCategoryColorsFromRows(rows, colorByCategoryKey)
        : categoryColors;
    const barNodes = defs.map((def) => {
      const barChildren = [];
      if (def.showValueLabel) {
        barChildren.push(
          h(LabelList, {
            key: `value-label-${def.dataKey}`,
            dataKey: def.dataKey,
            position: chartLayout === "vertical" ? "right" : "top",
            formatter: (value, entry) => {
              const numericValue = Number(value);
              const roundedValue = Number.isFinite(numericValue) ? Math.round(numericValue) : 0;
              const sampleCount = Number(entry?.payload?.[`meta_${def.dataKey}`]?.n);
              const n = Number.isFinite(sampleCount) ? sampleCount : 0;
              return `${roundedValue}d · n=${n}`;
            },
            fill: colors.text,
            fontSize: 11,
            offset: 8
          })
        );
      }
      if (def.showSeriesLabel) {
        barChildren.push(
          h(LabelList, {
            key: `series-label-${def.dataKey}`,
            dataKey: def.dataKey,
            position: chartLayout === "vertical" ? "right" : "top",
            formatter: (value) => (toWhole(value) > 0 ? String(def.seriesLabel || def.name || "") : ""),
            fill: "rgba(31,51,71,0.75)",
            fontSize: 9,
            offset: 2
          })
        );
      }
      const shouldColorByCategory = !isFullyStacked && colorByCategoryKey && effectiveCategoryColors;
      if (shouldColorByCategory) {
        rows.forEach((row, index) => {
          const categoryValue = String(row?.[colorByCategoryKey] || "");
          const fill =
            def?.categoryColors?.[categoryValue] ||
            effectiveCategoryColors?.[categoryValue] ||
            def.fill;
          barChildren.push(h(Cell, { key: `cell-${def.dataKey}-${index}`, fill }));
        });
      } else if (def?.metaTeamColorMap && typeof def.metaTeamColorMap === "object") {
        rows.forEach((row, index) => {
          const metaTeam = String(row?.[`meta_${def.dataKey}`]?.team || "");
          const fill = def.metaTeamColorMap?.[metaTeam] || def.fill;
          barChildren.push(h(Cell, { key: `cell-meta-team-${def.dataKey}-${index}`, fill }));
        });
      }
      return h(
        Bar,
        {
          key: def.dataKey,
          dataKey: def.dataKey,
          name: def.name,
          fill: def.fill,
          stackId: def.stackId,
          barSize: Number.isFinite(geometry.barSize) ? geometry.barSize : undefined,
          radius: isFullyStacked
            ? undefined
            : chartLayout === "vertical"
              ? [0, 4, 4, 0]
              : [4, 4, 0, 0],
          ...barBaseStyle(colors),
          activeBar: ACTIVE_BAR_STYLE,
          hide: hiddenKeys.has(def.dataKey),
          isAnimationActive: false
        },
        ...barChildren
      );
    });
    const overlayNodes = chartLayout === "horizontal"
      ? (Array.isArray(overlayDots) ? overlayDots : []).flatMap((dot, index) => {
          const keyBase = `overlay-dot-${index}`;
          const x = dot?.x;
          const y = toNumber(dot?.y);
          const yBase = toNumber(dot?.yBase);
          const r = Math.max(2, toNumber(dot?.r));
          const haloR = Math.max(r + 3, toNumber(dot?.haloR));
          const fill = dot?.fill || colors.teams.api;
          const stem = Number.isFinite(yBase) && Number.isFinite(y) && y > yBase;
          const nodes = [];
          if (stem) {
            nodes.push(
              h(ReferenceLine, {
                key: `${keyBase}-stem`,
                segment: [{ x, y: yBase }, { x, y }],
                stroke: dot?.stemColor || "rgba(31,51,71,0.5)",
                strokeWidth: Number.isFinite(dot?.stemWidth) ? dot.stemWidth : 1
              })
            );
          }
          nodes.push(
            h(ReferenceDot, {
              key: `${keyBase}-halo`,
              x,
              y,
              r: haloR,
              fill,
              fillOpacity: Number.isFinite(dot?.haloOpacity) ? dot.haloOpacity : 0.22,
              stroke: "none",
              isFront: true
            })
          );
          nodes.push(
            h(ReferenceDot, {
              key: `${keyBase}-core`,
              x,
              y,
              r,
              fill,
              stroke: dot?.stroke || "rgba(255,255,255,0.95)",
              strokeWidth: Number.isFinite(dot?.strokeWidth) ? dot.strokeWidth : 1.4,
              isFront: true
            })
          );
          return nodes;
        })
      : [];
    return renderBarChartShell({
      rows,
      colors,
      height,
      margin,
      chartLayout,
      layout: geometry,
      xAxisProps: {
        ...xAxisProps,
        stroke: colors.text,
        tick: xAxisProps?.tick || axisTick(colors)
      },
      yAxisProps: yAxisProps
        ? {
            ...yAxisProps,
            stroke: colors.text,
            tick: yAxisProps?.tick || axisTick(colors)
          }
        : baseYAxisProps(colors, yUpper ? [0, yUpper] : null),
      tooltipProps,
      legendDrawerNode: showLegend
        ? renderLegendNode({ colors, defs, hiddenKeys, setHiddenKeys })
        : null,
      barNodes,
      overlayNodes,
      gridVertical,
      gridHorizontal
    });
  }

  function renderGroupedBars(containerId, canRender, props) {
    renderWithRoot(containerId, canRender, (root) => {
      root.render(h(GroupedBarChartView, props));
    });
  }

  function renderMultiSeriesBars({
    modeKey = "all",
    containerId,
    rows,
    defs,
    colors,
    yUpperOverride = null,
    showLegend = true,
    timeWindowLabel = "",
    orientation = "columns",
    categoryKey = "team",
    categoryTickTwoLine = false,
    categorySecondaryLabels = null,
    overlayDots = [],
    colorByCategoryKey = "",
    categoryColors = null,
    categoryAxisHeight = null,
    gridVertical = false,
    valueTicks = null,
    tooltipCursor = { fill: BAR_CURSOR_FILL },
    valueUnit = "days"
  }) {
    const sourceRows = Array.isArray(rows) ? rows : [];
    const compactViewport = isCompactViewport();
    const seriesDefs = (Array.isArray(defs) ? defs : []).map((def) => ({
      key: def.key,
      name: def.name || def.label || def.key,
      color: def.color,
      stackId: def.stackId,
      categoryColors: def.categoryColors,
      showValueLabel: Boolean(def.showValueLabel),
      showSeriesLabel: Boolean(def.showSeriesLabel),
      seriesLabel: def.seriesLabel || def.name || def.label || def.key,
      metaTeamColorMap: def.metaTeamColorMap
    }));
    const displayInWeeks = String(valueUnit || "").toLowerCase() === "weeks";
    const chartRows = displayInWeeks
      ? sourceRows.map((row) => {
          const next = { ...row };
          seriesDefs.forEach((series) => {
            next[series.key] = toWholeWeeksForChart(row?.[series.key]);
          });
          return next;
        })
      : sourceRows;
    const yValues = seriesDefs.flatMap((series) => chartRows.map((row) => toNumber(row?.[series.key])));
    const normalizedYUpperOverride =
      Number.isFinite(yUpperOverride) && yUpperOverride > 0
        ? displayInWeeks
          ? toWholeWeeksForChart(yUpperOverride)
          : yUpperOverride
        : null;
    const yUpper =
      Number.isFinite(normalizedYUpperOverride) && normalizedYUpperOverride > 0
        ? Math.ceil(normalizedYUpperOverride)
        : computeYUpper(yValues, { min: 1, pad: 1.15 });
    const isHorizontal = orientation === "horizontal";
    const effectiveCategoryTickTwoLine = categoryTickTwoLine && !compactViewport;
    const weeklyAxis = displayInWeeks ? buildWeekAxis(yUpper, { majorStep: 4 }) : null;
    const niceAxis = isHorizontal
      ? displayInWeeks
        ? weeklyAxis
        : buildNiceNumberAxis(yUpper)
      : null;
    const niceYAxis = !isHorizontal
      ? displayInWeeks
        ? weeklyAxis
        : buildNiceNumberAxis(yUpper)
      : null;
    const normalizedValueTicks =
      Array.isArray(valueTicks) && valueTicks.length > 1 ? valueTicks.map((value) => toNumber(value)) : null;
    const twoLineCategoryTickHorizontal = twoLineCategoryTickFactory(colors, {
      textAnchor: "end",
      dy: 3,
      line2Dy: 14,
      secondaryLabels: categorySecondaryLabels
    });
    const twoLineCategoryTickColumns = twoLineCategoryTickFactory(colors, {
      textAnchor: "middle",
      dy: 0,
      line2Dy: 0,
      secondaryLabels: categorySecondaryLabels
    });
    renderGroupedBars(containerId, chartRows.length > 0 && seriesDefs.length > 0, {
      rows: chartRows,
      defs: seriesDefs.map((series) => ({
        dataKey: series.key,
        name: series.name,
        fill: series.color,
        stackId: series.stackId,
        categoryColors: series.categoryColors,
        showValueLabel: Boolean(series.showValueLabel),
        showSeriesLabel: Boolean(series.showSeriesLabel),
        seriesLabel: series.seriesLabel || series.name,
        metaTeamColorMap: series.metaTeamColorMap
      })),
      colors,
      yUpper,
      showLegend,
      colorByCategoryKey,
      categoryColors,
      overlayDots,
      gridVertical,
      height: singleChartHeightForMode(modeKey, CHART_HEIGHTS.dense),
      margin: { top: 14, right: 12, bottom: 34, left: 12 },
      xAxisProps: {
        ...(isHorizontal
          ? {
              type: "number",
              domain: normalizedValueTicks ? [0, normalizedValueTicks.at(-1)] : [0, niceAxis.upper],
              ticks: normalizedValueTicks || niceAxis.ticks,
              allowDecimals: false,
              tickFormatter: displayInWeeks ? (value) => String(toWhole(value)) : undefined
            }
          : {
              dataKey: categoryKey,
              interval: compactViewport ? tickIntervalForMobileLabels(chartRows.length) : 0,
              angle: compactViewport ? -28 : 0,
              textAnchor: compactViewport ? "end" : "middle",
              height:
                Number.isFinite(categoryAxisHeight) && categoryAxisHeight > 0
                  ? categoryAxisHeight
                  : effectiveCategoryTickTwoLine
                    ? 72
                    : compactViewport
                      ? 52
                      : 34,
              minTickGap: compactViewport ? 10 : 4,
              tick: effectiveCategoryTickTwoLine
                ? twoLineCategoryTickColumns
                : { ...axisTick(colors), fontSize: compactViewport ? 11 : 12 }
            })
      },
      yAxisProps: isHorizontal
        ? {
            dataKey: categoryKey,
            type: "category",
            width: HORIZONTAL_CATEGORY_AXIS_WIDTH,
            tick: effectiveCategoryTickTwoLine ? twoLineCategoryTickHorizontal : undefined
          }
        : {
            domain: normalizedValueTicks ? [0, normalizedValueTicks.at(-1)] : [0, niceYAxis.upper],
            ticks: normalizedValueTicks || niceYAxis.ticks,
            allowDecimals: false,
            tickFormatter: displayInWeeks ? (value) => String(toWhole(value)) : undefined
          },
      chartLayout: isHorizontal ? "vertical" : "horizontal",
      tooltipProps: {
        content: createTooltipContent(colors, (row, payload) => {
          const categoryLabel = row?.teamWithSampleBase || row?.[categoryKey] || row.team || "Category";
          const teamLabel = String(categoryLabel).replace(/\s*\(.*\)\s*$/, "");
          const hasDone = Number.isFinite(row?.doneCount);
          const lines = [
            tooltipTitleLine(
              "team",
              hasDone ? teamLabel : timeWindowLabel ? `${categoryLabel} • ${timeWindowLabel}` : `${categoryLabel}`,
              colors
            )
          ];
          payload.forEach((item) => {
            const key = item?.dataKey;
            const meta = row?.[`meta_${key}`] || {};
            const valueDays = toWhole(item?.value);
            if (valueDays <= 0) return;
            const sampleRaw = Number(meta.n);
            const sampleText = Number.isFinite(sampleRaw) && sampleRaw >= 0 ? String(toWhole(sampleRaw)) : "-";
            const seriesName = meta.team || item.name;
            const customSubItems = Array.isArray(meta.subItems) && meta.subItems.length > 0 ? meta.subItems : null;
            lines.push(
              makeTooltipLine(key, `${String(seriesName)} n=${sampleText}`, colors, {
                margin: "2px 0",
                fontSize: "12px",
                lineHeight: "1.45",
                subItems:
                  customSubItems ||
                  [
                    displayInWeeks ? formatAverageLabel(meta.average, "weeks") : formatAverageLabel(meta.average, "days")
                  ]
              })
            );
          });
          return lines;
        }),
        cursor: tooltipCursor
      }
    });
  }

  window.DashboardChartCore = {
    React,
    h,
    ResponsiveContainer,
    LineChart,
    Line,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ACTIVE_BAR_STYLE,
    BAR_CURSOR_FILL,
    BAR_LAYOUT,
    CHART_HEIGHTS,
    HORIZONTAL_CATEGORY_AXIS_WIDTH,
    MAX_SPRINT_POINTS,
    PRIORITY_CONFIG,
    PRIORITY_STACK_ORDER,
    TEAM_CONFIG,
    TREND_LONG_LINES,
    TREND_TEAM_LINES,
    activeLineDot,
    axisTick,
    barBaseStyle,
    baseYAxisProps,
    buildNiceNumberAxis,
    buildWeekAxis,
    computeYUpper,
    createTooltipContent,
    formatAverageLabel,
    formatDateShort,
    isCompactViewport,
    makeTooltipLine,
    renderBarChartShell,
    renderGroupedBars,
    renderLegendNode,
    renderMultiSeriesBars,
    renderWithRoot,
    singleChartHeightForMode,
    tickIntervalForMobileLabels,
    toNumber,
    toWhole,
    toWholeWeeksForChart,
    tooltipTitleLine,
    trendLayoutForViewport,
    twoLineCategoryTickFactory
  };
  window.DashboardCharts = { ...(window.DashboardCharts || {}), clearChart };
})();
