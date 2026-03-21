"use strict";

(function initDashboardProductCharts() {
  const React = window.React;
  const core = window.DashboardChartCore;
  const svgCore = window.DashboardSvgCore;
  if (!React || !core) {
    throw new Error("Dashboard chart core not loaded.");
  }
  if (!svgCore) {
    throw new Error("Dashboard SVG core not loaded.");
  }

  const { h, isCompactViewport, toNumber, toWhole } = core;
  const {
    SvgChartShell,
    createBandLayout,
    estimateTextWidth,
    formatMonthTick,
    formatTooltipDuration,
    linearScale,
    renderSvgChart,
    teamColorForLabel,
    truncateTextToWidth,
    withAlpha
  } = svgCore;

  function monthValueFromDays(value) {
    return toNumber(value) / 30.4375;
  }

  function axisLabel(text, x, y, options = {}) {
    return h(
      "text",
      {
        x,
        y,
        fill: options.fill || "rgba(31, 51, 71, 0.92)",
        fontSize: options.fontSize || 11,
        fontWeight: options.fontWeight || 700,
        textAnchor: options.textAnchor || "middle",
        transform: options.transform
      },
      text
    );
  }

  function axisTickBubble(lines, x, y, options = {}) {
    const safeLines = (Array.isArray(lines) ? lines : [lines])
      .map((line) => String(line || "").trim())
      .filter(Boolean);
    if (safeLines.length === 0) return null;
    const fontSize = options.fontSize || 11;
    const lineHeight = options.lineHeight || 13;
    const width = Math.max(
      52,
      ...safeLines.map((line) => estimateTextWidth(line, fontSize) + 22)
    );
    const height = options.height || Math.max(24, 14 + safeLines.length * lineHeight);
    return h(
      "g",
      { key: options.key },
      h("rect", {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
        rx: height / 2,
        ry: height / 2,
        fill: options.fill || "rgba(255,255,255,0.98)",
        stroke: options.stroke || "rgba(31, 51, 71, 0.32)",
        strokeWidth: options.strokeWidth || 1.2
      }),
      h(
        "text",
        {
          x,
          y: y - ((safeLines.length - 1) * lineHeight) / 2 + 1,
          fill: options.textFill || "rgba(31, 51, 71, 0.96)",
          fontSize,
          fontWeight: options.fontWeight || 700,
          textAnchor: "middle",
          dominantBaseline: "middle"
        },
        safeLines.map((line, index) =>
          h(
            "tspan",
            {
              key: `line-${index}`,
              x,
              dy: index === 0 ? 0 : lineHeight
            },
            line
          )
        )
      )
    );
  }

  function renderBadge(text, x, y, options = {}) {
    const safeText = String(text || "").trim();
    if (!safeText) return null;
    const fontSize = options.fontSize || 11;
    const horizontalPadding = options.horizontalPadding || 7;
    const height = options.height || 20;
    const width = Math.max(options.minWidth || 34, estimateTextWidth(safeText, fontSize) + horizontalPadding * 2);
    let rectX = x;
    let textX = x + width / 2;
    if (options.anchor === "end") {
      rectX = x - width;
      textX = x - width / 2;
    } else if (options.anchor === "middle") {
      rectX = x - width / 2;
      textX = x;
    }
    return h(
      "g",
      { key: options.key },
      h("rect", {
        x: rectX,
        y: y - height / 2,
        width,
        height,
        rx: height / 2,
        ry: height / 2,
        fill: options.fill || "rgba(255,255,255,0.94)",
        stroke: options.stroke || "rgba(31, 51, 71, 0.24)",
        strokeWidth: options.strokeWidth || 1
      }),
      h(
        "text",
        {
          x: textX,
          y,
          fill: options.textFill || "rgba(31, 51, 71, 0.9)",
          fontSize,
          fontWeight: options.fontWeight || 700,
          textAnchor: "middle",
          dominantBaseline: "middle"
        },
        safeText
      )
    );
  }

  function buildLifecycleTicks(upper) {
    const safeUpper = Math.max(1, Math.ceil(toNumber(upper)));
    if (safeUpper <= 6) return Array.from({ length: safeUpper + 1 }, (_, index) => index);
    const step = safeUpper <= 12 ? 2 : 3;
    const ticks = [];
    for (let tick = 0; tick <= safeUpper; tick += step) ticks.push(tick);
    if (ticks[ticks.length - 1] !== safeUpper) ticks.push(safeUpper);
    return ticks;
  }

  function formatLifecycleTick(value) {
    const months = toWhole(value);
    if (months <= 0) return "0";
    if (months === 12) return "1 year";
    if (months > 12) return `+${months - 12}m`;
    return `${months}m`;
  }

  function CycleTimeSvgChart({ rows, colors }) {
    const compactViewport = isCompactViewport();
    const [tooltipContent, setTooltipContent] = React.useState(null);
    const width = 960;
    const height = compactViewport ? 430 : 480;
    const margin = compactViewport
      ? { top: 34, right: 92, bottom: 72, left: 118 }
      : { top: 42, right: 196, bottom: 82, left: 148 };
    const plotLeft = margin.left;
    const plotRight = width - margin.right;
    const plotTop = margin.top;
    const plotBottom = height - margin.bottom;
    const xTicks = [0, 1, 2, 3, 4, 5];
    const yLayout = createBandLayout(
      rows.map((row) => String(row?.team || "")),
      { start: plotTop, end: plotBottom, gap: compactViewport ? 0.3 : 0.24, paddingOuter: 0.04 }
    );
    const ambitionX = linearScale(1, 0, 5, plotLeft, plotRight);

    const showTooltip = (row) => {
      const cycleMonths = monthValueFromDays(row?.cycle);
      setTooltipContent(
        h(
          "div",
          null,
          h("p", null, h("strong", null, String(row?.team || ""))),
          h("p", null, `Cycle time: ${formatTooltipDuration(cycleMonths * 30.4375, "months")}`),
          h("p", null, `Ideas shipped: ${toWhole(row?.cycleDoneCount)}`),
          h("p", null, `Cycle sample: ${toWhole(row?.meta_cycle?.n)}`)
        )
      );
    };

    return h(
      SvgChartShell,
      { width, height, colors, tooltipContent },
      h(
        "g",
        null,
        ...xTicks.map((tick) => {
          const x = linearScale(tick, 0, 5, plotLeft, plotRight);
          return h(
            "g",
            { key: `tick-${tick}` },
            tick === 1
              ? axisTickBubble(["1 month", "ambition"], x, plotBottom + 34, {
                  key: "ambition-tick-bubble",
                  fontSize: compactViewport ? 10 : 11,
                  height: compactViewport ? 34 : 36
                })
              : axisLabel(formatMonthTick(tick, compactViewport), x, plotBottom + 22, {
                  fontSize: compactViewport ? 10 : 11,
                  fontWeight: 600
                })
          );
        }),
        ...yLayout.positions.flatMap((position, index) => {
          const row = rows[index];
          const color = teamColorForLabel(colors, row?.team);
          const valueMonths = monthValueFromDays(row?.cycle);
          const barWidth = Math.max(0, linearScale(valueMonths, 0, 5, 0, plotRight - plotLeft));
          const barY = position.x;
          const shippedCount = toWhole(row?.cycleDoneCount);
          const clippedText = truncateTextToWidth(
            `${shippedCount} shipped`,
            compactViewport ? 74 : 94,
            compactViewport ? 10 : 11
          );
          const shippedTextX = plotLeft + 14;
          return [
            h("rect", {
              key: `hit-${position.label}`,
              x: plotLeft,
              y: barY - 4,
              width: plotRight - plotLeft,
              height: yLayout.bandwidth + 8,
              fill: "transparent",
              onMouseEnter: () => showTooltip(row),
              onMouseLeave: () => setTooltipContent(null)
            }),
            h("rect", {
              key: `track-${position.label}`,
              x: plotLeft,
              y: barY,
              width: 0,
              height: yLayout.bandwidth,
              rx: yLayout.bandwidth / 2,
              fill: "transparent"
            }),
            h("rect", {
              key: `bar-${position.label}`,
              x: plotLeft,
              y: barY,
              width: Math.max(4, barWidth),
              height: yLayout.bandwidth,
              rx: yLayout.bandwidth / 2,
              fill: color,
              stroke: withAlpha(color, 0.48),
              strokeWidth: 1
            }),
            axisLabel(String(row?.team || ""), plotLeft - 12, barY + yLayout.bandwidth / 2 + 4, {
              textAnchor: "end",
              fontSize: compactViewport ? 11 : 12,
              fontWeight: 600
            }),
            h(
              "text",
              {
                key: `done-${position.label}`,
                x: shippedTextX,
                y: barY + yLayout.bandwidth / 2 + 1,
                fill: "rgba(31, 51, 71, 0.92)",
                fontSize: compactViewport ? 10 : 11,
                fontWeight: 700,
                textAnchor: "start",
                dominantBaseline: "middle"
              },
              clippedText
            )
          ];
        }),
        axisLabel("Cycle time to ship", (plotLeft + plotRight) / 2, height - 8, {
          fontSize: compactViewport ? 10 : 11
        })
      )
    );
  }

  function LifecycleSvgChart({ rows, seriesDefs, colors, categorySecondaryLabels, yUpperOverride }) {
    const compactViewport = isCompactViewport();
    const [tooltipContent, setTooltipContent] = React.useState(null);
    const width = 960;
    const height = compactViewport ? 440 : 490;
    const margin = compactViewport
      ? { top: 26, right: 18, bottom: 72, left: 58 }
      : { top: 28, right: 18, bottom: 78, left: 64 };
    const plotLeft = margin.left;
    const plotRight = width - margin.right;
    const plotTop = margin.top;
    const plotBottom = height - margin.bottom;
    const filteredSeries = (Array.isArray(seriesDefs) ? seriesDefs : []).filter(Boolean);
    const yUpperMonths = Math.max(1, Math.ceil(monthValueFromDays(yUpperOverride)));
    const yTicks = buildLifecycleTicks(yUpperMonths);
    const groupLayout = createBandLayout(
      rows.map((row) => String(row?.phaseLabel || "")),
      { start: plotLeft, end: plotRight, gap: compactViewport ? 0.32 : 0.24, paddingOuter: 0.05 }
    );
    const innerGap = compactViewport ? 2 : 3;
    const barWidth = Math.max(
      6,
      (groupLayout.bandwidth - innerGap * Math.max(0, filteredSeries.length - 1)) /
        Math.max(1, filteredSeries.length)
    );

    const showTooltip = (row, seriesDef) => {
      const meta = row?.[`meta_${seriesDef.key}`] || {};
      setTooltipContent(
        h(
          "div",
          null,
          h("p", null, h("strong", null, `${row?.phaseLabel || ""} • ${seriesDef.name || ""}`)),
          h(
            "p",
            null,
            `Average time: ${formatTooltipDuration(toNumber(meta?.average), "months")}`
          ),
          h("p", null, `n=${toWhole(meta?.n)}`)
        )
      );
    };

    return h(
      SvgChartShell,
      { width, height, colors, tooltipContent },
      h(
        "g",
        null,
        ...yTicks.map((tick) => {
          const y = linearScale(tick, 0, yUpperMonths, plotBottom, plotTop);
          return h(
            "g",
            { key: `tick-${tick}` },
            h("line", {
              x1: plotLeft,
              x2: plotRight,
              y1: y,
              y2: y,
              stroke: colors.grid,
              strokeWidth: tick === 0 ? 1.25 : 1
            }),
            axisLabel(formatLifecycleTick(tick), plotLeft - 8, y + 4, {
              textAnchor: "end",
              fontSize: compactViewport ? 10 : 11,
              fontWeight: 600
            })
          );
        }),
        ...groupLayout.positions.flatMap((position, rowIndex) => {
          const row = rows[rowIndex];
          const secondaryLabel = categorySecondaryLabels?.[row?.phaseLabel] || "";
          const bars = filteredSeries.map((seriesDef, seriesIndex) => {
            const valueMonths = monthValueFromDays(row?.[seriesDef.key]);
            const barHeight = Math.max(
              0,
              plotBottom - linearScale(valueMonths, 0, yUpperMonths, plotBottom, plotTop)
            );
            const x = position.x + seriesIndex * (barWidth + innerGap);
            const y = plotBottom - barHeight;
            const color = teamColorForLabel(colors, seriesDef?.name || seriesDef?.team);
            return h("rect", {
              key: `bar-${position.label}-${seriesDef.key}`,
              x,
              y,
              width: barWidth,
              height: barHeight,
              rx: 5,
              fill: color,
              stroke: withAlpha(color, 0.5),
              strokeWidth: 1,
              opacity: valueMonths > 0 ? 0.96 : 0.12,
              onMouseEnter: () => showTooltip(row, seriesDef),
              onMouseLeave: () => setTooltipContent(null)
            });
          });
          return [
            ...bars,
            axisLabel(String(row?.phaseLabel || ""), position.center, plotBottom + 18, {
              fontSize: compactViewport ? 10 : 11,
              fontWeight: 600
            }),
            axisLabel(String(secondaryLabel), position.center, plotBottom + 33, {
              fontSize: compactViewport ? 9 : 10,
              fontWeight: 600,
              fill: "rgba(31, 51, 71, 0.58)"
            })
          ];
        }),
        axisLabel("Average time (months)", plotLeft - 48, plotTop + (plotBottom - plotTop) / 2, {
          fontSize: compactViewport ? 10 : 11,
          transform: `rotate(-90 ${plotLeft - 48} ${plotTop + (plotBottom - plotTop) / 2})`
        })
      )
    );
  }

  function renderLeadAndCycleTimeByTeamChart({ containerId, rows, colors }) {
    const chartRows = Array.isArray(rows) ? rows : [];
    return renderSvgChart(containerId, chartRows.length > 0, () =>
      h(CycleTimeSvgChart, {
        rows: chartRows,
        colors
      })
    );
  }

  function renderLifecycleTimeSpentPerStageChart({
    containerId,
    rows,
    seriesDefs,
    colors,
    categorySecondaryLabels,
    yUpperOverride
  }) {
    const chartRows = Array.isArray(rows) ? rows : [];
    return renderSvgChart(containerId, chartRows.length > 0, () =>
      h(LifecycleSvgChart, {
        rows: chartRows,
        seriesDefs,
        colors,
        categorySecondaryLabels,
        yUpperOverride
      })
    );
  }

  Object.assign(window.DashboardCharts || (window.DashboardCharts = {}), {
    renderLeadAndCycleTimeByTeamChart,
    renderLifecycleTimeSpentPerStageChart
  });
})();
