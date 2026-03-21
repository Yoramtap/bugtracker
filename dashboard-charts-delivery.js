"use strict";

(function initDashboardDeliveryCharts() {
  const React = window.React;
  const core = window.DashboardChartCore;
  const svgCore = window.DashboardSvgCore;
  if (!React || !core) {
    throw new Error("Dashboard chart core not loaded.");
  }
  if (!svgCore) {
    throw new Error("Dashboard SVG core not loaded.");
  }

  const {
    formatAverageLabel,
    h,
    isCompactViewport,
    toNumber,
    toWhole
  } = core;
  const {
    SvgChartShell,
    createBandLayout,
    estimateTextWidth,
    formatMonthTick,
    formatTooltipDuration,
    linearScale,
    renderSvgChart,
    truncateTextToWidth,
    withAlpha
  } = svgCore;

  function toChartRows(rows) {
    return Array.isArray(rows) ? rows : [];
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
        fill: options.fill || "rgba(255,255,255,0.95)",
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

  function computeFacilityMonthAxis(rows) {
    const maxMonths = rows.reduce((highest, row) => {
      return Math.max(highest, toNumber(row?.devTime), toNumber(row?.uatTime));
    }, 0);
    const upper = maxMonths <= 3 ? 3 : 5;
    return {
      upper,
      ticks: Array.from({ length: upper + 1 }, (_, index) => index)
    };
  }

  function formatFacilityTooltipAverage(valueInDays) {
    const days = toNumber(valueInDays);
    if (days < 28) return String(formatAverageLabel(days, "weeks")).replace(/\s+avg$/, "");
    return formatTooltipDuration(days, "months");
  }

  function formatFacilityTooltipSummary(valueInDays, sampleCount) {
    const duration = formatFacilityTooltipAverage(valueInDays);
    return toWhole(sampleCount) === 1 ? duration : `${duration} average`;
  }

  function formatFacilityMonths(valueInMonths) {
    const safeValue = Math.max(0, toNumber(valueInMonths));
    return safeValue === 0 ? "0" : safeValue.toFixed(1);
  }

  function getFacilityUatFill(months) {
    const value = toNumber(months);
    if (value >= 2) return "#c98b84";
    if (value >= 1) return "#d8bf93";
    return "#a7cfb4";
  }

  function buildJiraSearchUrl(issueItems, jiraBrowseBase) {
    const issueKeys = Array.from(
      new Set(
        (Array.isArray(issueItems) ? issueItems : [])
          .map((item) => String(item?.issueId || item || "").trim())
          .filter(Boolean)
      )
    );
    if (issueKeys.length === 0) return "";
    const root = String(jiraBrowseBase || "https://nepgroup.atlassian.net/browse/").replace(
      /\/browse\/?$/,
      ""
    );
    const jql = `issueKey in (${issueKeys.join(", ")}) ORDER BY updated DESC`;
    return `${root}/issues/?jql=${encodeURIComponent(jql)}`;
  }

  function FacilityUatListCard({ rows, groupingLabel, jiraBrowseBase, scope = "ongoing" }) {
    const displayRows = toChartRows(rows).map((row) => ({
      ...row,
      uatMonths: toNumber(row?.uatAvg) / 30.4375
    }));
    const maxMonths = Math.max(1, ...displayRows.map((row) => toNumber(row?.uatMonths)));

    return h(
      "div",
      { className: "product-cycle-team-card-wrap" },
      h(
        "article",
        { className: "pr-cycle-stage-card management-uat-card" },
        h(
          "div",
          { className: "pr-cycle-stage-card__header" },
          h(
            "div",
            { className: "pr-cycle-stage-card__meta" },
            h("div", { className: "pr-cycle-stage-card__team" }, "All business units"),
            h(
              "div",
              { className: "pr-cycle-stage-card__submeta" },
              `${String(groupingLabel || "Business Unit")} • Measured in months • Target: 1 month`
            )
          )
        ),
        h(
          "div",
          { className: "pr-cycle-stage-list" },
          ...displayRows.map((row) => {
            const uatMonths = toNumber(row?.uatMonths);
            const sampleCount = toWhole(row?.sampleCount);
            const hasLink = sampleCount > 0;
            const needsAction = scope === "ongoing" && hasLink;
            const alertLevel = uatMonths >= 2 ? "critical" : uatMonths > 1 ? "warning" : "";
            const width = sampleCount > 0 ? Math.max(0, Math.round((uatMonths / maxMonths) * 100)) : 0;
            return h(
              "div",
              {
                key: `uat-row-${String(row?.label || "")}`,
                className: "pr-cycle-stage-row management-uat-row",
                "data-stage": "uat"
              },
              h(
                "div",
                { className: "pr-cycle-stage-row__label" },
                h("span", { className: "pr-cycle-stage-row__label-text" }, String(row?.label || "")),
                h("span", { className: "pr-cycle-stage-row__sample" }, `n=${sampleCount}`)
              ),
              h(
                "div",
                { className: "pr-cycle-stage-row__track", "aria-hidden": "true" },
                h("div", {
                  className: "pr-cycle-stage-row__fill",
                  style: {
                    width: `${width}%`,
                    background: getFacilityUatFill(uatMonths)
                  }
                })
              ),
              h(
                "div",
                { className: "pr-cycle-stage-row__value management-uat-row__value" },
                needsAction
                  ? h(
                      "a",
                      {
                        className: "management-uat-row__action management-uat-row__action--inline",
                        href: buildJiraSearchUrl(row?.issueItems, jiraBrowseBase),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        "aria-label": `Take action on ${String(row?.label || "")} Jira issues in new tab`,
                        title: "Open Jira search in new tab"
                      },
                      alertLevel
                        ? h("span", {
                            className: `management-uat-row__alert management-uat-row__alert--${alertLevel}`,
                            "aria-hidden": "true"
                          })
                        : null,
                      h("span", { className: "management-uat-row__action-value" }, formatFacilityMonths(uatMonths)),
                      h(
                        "svg",
                        {
                          viewBox: "0 0 16 16",
                          width: 13,
                          height: 13,
                          "aria-hidden": "true",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: 1.6,
                          strokeLinecap: "round",
                          strokeLinejoin: "round"
                        },
                        h("path", { d: "M9.5 2.5h4v4" }),
                        h("path", { d: "M13.5 2.5L7.75 8.25" }),
                        h("path", { d: "M6 4.5H3.5v8h8V10" })
                      )
                    )
                  : h(
                      "span",
                      { className: "management-uat-row__plain-value" },
                      alertLevel
                        ? h("span", {
                            className: `management-uat-row__alert management-uat-row__alert--${alertLevel}`,
                            "aria-hidden": "true"
                          })
                        : null,
                      formatFacilityMonths(uatMonths)
                    )
              )
            );
          })
        )
      )
    );
  }

  function buildIssueSubItems(issueItems, jiraBrowseBase, colors) {
    const safeIssueItems = Array.isArray(issueItems) ? issueItems : [];
    const issueDisplayLimit = isCompactViewport() ? 5 : 8;
    const browseBase = String(jiraBrowseBase || "").replace(/\/$/, "");
    const items = safeIssueItems
      .slice(0, issueDisplayLimit)
      .map((item, index) => {
        const key = String(item?.issueId || item || "").trim();
        if (!key) return null;
        const facilityLabel = String(item?.facilityLabel || "").trim();
        return h(
          "span",
          { key: `issue-item-${key}-${index}` },
          h(
            "a",
            {
              href: `${browseBase}/${encodeURIComponent(key)}`,
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                color: colors.text,
                textDecoration: "underline"
              }
            },
            key
          ),
          facilityLabel ? ` (${facilityLabel})` : ""
        );
      })
      .filter(Boolean);
    if (safeIssueItems.length > issueDisplayLimit) {
      items.push(`+${safeIssueItems.length - issueDisplayLimit} more`);
    }
    return items.length > 0 ? items : ["-"];
  }

  function FacilitySvgChart({
    rows,
    groupingLabel,
    colors,
    devColor,
    uatColor,
    jiraBrowseBase
  }) {
    const compactViewport = isCompactViewport();
    const [tooltipContent, setTooltipContent] = React.useState(null);
    const width = 960;
    const height = compactViewport ? 410 : 450;
    const margin = compactViewport
      ? { top: 30, right: 26, bottom: 74, left: 78 }
      : { top: 38, right: 46, bottom: 84, left: 86 };
    const plotLeft = margin.left;
    const plotRight = width - margin.right;
    const plotTop = margin.top;
    const plotBottom = height - margin.bottom;
    const plotHeight = plotBottom - plotTop;
    const displayRows = rows.map((row) => ({
      ...row,
      devTime: toNumber(row?.devAvg) / 30.4375,
      uatTime: toNumber(row?.uatAvg) / 30.4375
    }));
    const monthAxis = computeFacilityMonthAxis(displayRows);
    const ticks = monthAxis.ticks;
    const groupLayout = createBandLayout(
      displayRows.map((row) => String(row?.label || "")),
      { start: plotLeft, end: plotRight, gap: compactViewport ? 0.28 : 0.24, paddingOuter: 0.06 }
    );
    const barGap = compactViewport ? 6 : 8;
    const barWidth = Math.max(10, (groupLayout.bandwidth - barGap) / 2);
    const isBusinessUnitGrouping =
      String(groupingLabel || "")
        .trim()
        .toLowerCase() === "business unit";
    const goalY = linearScale(1, 0, monthAxis.upper, plotBottom, plotTop);
    const legendItems = [
      { key: "dev", label: "Time in Development", color: devColor },
      {
        key: "uat",
        label: "Time in UAT",
        swatchBackground:
          "linear-gradient(90deg, #a7cfb4 0 33%, #d8bf93 33% 66%, #c98b84 66% 100%)",
        color: uatColor
      }
    ];

    const showTooltip = (row) => {
      const devAvg = toNumber(row?.devAvg);
      const uatAvg = toNumber(row?.uatAvg);
      setTooltipContent(
        h(
          "div",
          null,
          h("p", null, h("strong", null, String(row?.label || ""))),
          h("p", null, `n=${toWhole(row?.sampleCount)}`),
          h("p", null, `Time in Development: ${formatFacilityTooltipSummary(devAvg, row?.devCount)}`),
          h("p", null, `Time in UAT: ${formatFacilityTooltipSummary(uatAvg, row?.uatCount)}`),
          h(
            "p",
            null,
            h("strong", null, "Issues: "),
            ...buildIssueSubItems(
              isBusinessUnitGrouping ? row?.issueItems : row?.issueIds,
              jiraBrowseBase,
              colors
            )
          )
        )
      );
    };

    return h(
      SvgChartShell,
      {
        width,
        height,
        colors,
        legendItems,
        tooltipContent
      },
      h(
        "g",
        null,
        ...ticks.map((tick) => {
          const y = linearScale(tick, 0, monthAxis.upper, plotBottom, plotTop);
          return h(
            "g",
            { key: `grid-${tick}` },
            h("line", {
              x1: plotLeft,
              x2: plotRight,
              y1: y,
              y2: y,
              stroke: colors.grid,
              strokeWidth: 1
            }),
            h(
              "text",
              {
                x: plotLeft - 8,
                y: y + 4,
                fill: colors.text,
                fontSize: compactViewport ? 10 : 11,
                textAnchor: "end"
              },
              formatMonthTick(tick, compactViewport)
            )
          );
        }),
        h("line", {
          x1: plotLeft,
          x2: plotRight,
          y1: goalY,
          y2: goalY,
          stroke: "rgba(31, 51, 71, 0.92)",
          strokeDasharray: "7 5",
          strokeWidth: 2.1
        }),
        ...groupLayout.positions.flatMap((position, index) => {
          const row = displayRows[index];
          const devHeight = Math.max(
            0,
            plotBottom - linearScale(row?.devTime, 0, monthAxis.upper, plotBottom, plotTop)
          );
          const uatHeight = Math.max(
            0,
            plotBottom - linearScale(row?.uatTime, 0, monthAxis.upper, plotBottom, plotTop)
          );
          const devX = position.x;
          const uatX = position.x + barWidth + barGap;
          const uatValue = toNumber(row?.uatTime);
          const uatFill =
            uatValue >= 2 ? "#c98b84" : uatValue >= 1 ? "#d8bf93" : "#a7cfb4";
          return [
            h("rect", {
              key: `hit-${position.label}`,
              x: position.x - 4,
              y: plotTop,
              width: groupLayout.bandwidth + 8,
              height: plotHeight + 44,
              fill: "transparent",
              onMouseEnter: () => showTooltip(row),
              onMouseLeave: () => setTooltipContent(null)
            }),
            h("rect", {
              key: `dev-${position.label}`,
              x: devX,
              y: plotBottom - devHeight,
              width: barWidth,
              height: Math.max(0, devHeight),
              rx: 8,
              fill: devColor,
              stroke: withAlpha(devColor, 0.5),
              strokeWidth: 1
            }),
            h("rect", {
              key: `uat-${position.label}`,
              x: uatX,
              y: plotBottom - uatHeight,
              width: barWidth,
              height: Math.max(0, uatHeight),
              rx: 8,
              fill: uatFill,
              stroke: withAlpha(uatFill, 0.48),
              strokeWidth: 1
            }),
            h(
              "text",
              {
                key: `label-${position.label}`,
                x: position.center,
                y: plotBottom + 16,
                fill: colors.text,
                fontSize: compactViewport ? 10 : 11,
                fontWeight: 600,
                textAnchor: "middle"
              },
              String(row?.label || "")
            ),
            h(
              "text",
              {
                key: `meta-${position.label}`,
                x: position.center,
                y: plotBottom + 31,
                fill: "rgba(31, 51, 71, 0.58)",
                fontSize: compactViewport ? 9 : 10,
                fontWeight: 600,
                textAnchor: "middle"
              },
              `n=${toWhole(row?.sampleCount)}`
            )
          ];
        }),
        renderBadge("UAT goal", plotRight - 4, goalY - 10, {
          key: "uat-goal-badge",
          anchor: "end",
          fontSize: compactViewport ? 10 : 11,
          fill: "rgba(255,255,255,0.96)",
          stroke: "rgba(31, 51, 71, 0.28)",
          textFill: "rgba(31, 51, 71, 0.92)"
        }),
        h(
          "text",
          {
            x: plotLeft - 54,
            y: plotTop + plotHeight / 2,
            fill: colors.text,
            fontSize: compactViewport ? 10 : 11,
            fontWeight: 700,
            textAnchor: "middle",
            transform: `rotate(-90 ${plotLeft - 54} ${plotTop + plotHeight / 2})`
          },
          "Average time"
        ),
        h(
          "text",
          {
            x: (plotLeft + plotRight) / 2,
            y: height - 20,
            fill: colors.text,
            fontSize: compactViewport ? 10 : 11,
            fontWeight: 700,
            textAnchor: "middle"
          },
          isBusinessUnitGrouping ? "Business Unit" : "Facility"
        )
      )
    );
  }

  function ContributorsSvgChart({ rows, colors, barColor }) {
    const compactViewport = isCompactViewport();
    const [tooltipContent, setTooltipContent] = React.useState(null);
    const width = 960;
    const height = compactViewport ? 400 : 442;
    const margin = compactViewport
      ? { top: 26, right: 90, bottom: 52, left: 150 }
      : { top: 28, right: 188, bottom: 58, left: 184 };
    const plotLeft = margin.left;
    const plotRight = width - margin.right;
    const plotTop = margin.top;
    const plotBottom = height - margin.bottom;
    const maxTotal = Math.max(1, ...rows.map((row) => toNumber(row?.totalIssues)));
    const xTicks = Array.from({ length: maxTotal + 1 }, (_, index) => index);
    const yLayout = createBandLayout(
      rows.map((row) => String(row?.contributor || "")),
      { start: plotTop, end: plotBottom, gap: compactViewport ? 0.3 : 0.22, paddingOuter: 0.04 }
    );
    const fillColor = String(barColor || "").trim() || colors.teams.react;

    const showTooltip = (row) => {
      setTooltipContent(
        h(
          "div",
          null,
          h("p", null, h("strong", null, String(row?.contributor || ""))),
          h("p", null, `Total contributions: ${toWhole(row?.totalIssues)}`),
          h("p", null, `Done contributions: ${toWhole(row?.doneIssues)}`),
          ...(Array.isArray(row?.ticketStateItems) ? row.ticketStateItems : []).map((item, index) =>
            h("p", { key: `state-${index}` }, String(item))
          )
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
          const x = linearScale(tick, 0, maxTotal, plotLeft, plotRight);
          return h(
            "g",
            { key: `tick-${tick}` },
            h(
              "text",
              {
                x,
                y: plotBottom + 22,
                fill: colors.text,
                fontSize: compactViewport ? 10 : 11,
                fontWeight: 600,
                textAnchor: "middle"
              },
              String(tick)
            )
          );
        }),
        ...yLayout.positions.flatMap((position, index) => {
          const row = rows[index];
          const totalIssues = toNumber(row?.totalIssues);
          const doneIssues = toWhole(row?.doneIssues);
          const barWidth = Math.max(0, linearScale(totalIssues, 0, maxTotal, 0, plotRight - plotLeft));
          const barY = position.x;
          const clippedText = truncateTextToWidth(
            `✅ ${doneIssues}`,
            compactViewport ? 52 : 62,
            compactViewport ? 10 : 11
          );
          const labelX = plotLeft + 14;
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
              width: plotRight - plotLeft,
              height: yLayout.bandwidth,
              rx: yLayout.bandwidth / 2,
              fill: withAlpha(fillColor, 0.12)
            }),
            h("rect", {
              key: `bar-${position.label}`,
              x: plotLeft,
              y: barY,
              width: Math.max(4, barWidth),
              height: yLayout.bandwidth,
              rx: yLayout.bandwidth / 2,
              fill: fillColor,
              stroke: withAlpha(fillColor, 0.48),
              strokeWidth: 1
            }),
            h(
              "text",
              {
                key: `name-${position.label}`,
                x: plotLeft - 12,
                y: barY + yLayout.bandwidth / 2 + 4,
                fill: colors.text,
                fontSize: compactViewport ? 11 : 12,
                fontWeight: 600,
                textAnchor: "end"
              },
              String(row?.contributor || "")
            ),
            h(
              "text",
              {
                key: `done-${position.label}`,
                x: labelX,
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
        h(
          "text",
          {
            x: (plotLeft + plotRight) / 2,
            y: height - 8,
            fill: colors.text,
            fontSize: compactViewport ? 10 : 11,
            fontWeight: 700,
            textAnchor: "middle"
          },
          "Total contributions"
        )
      )
    );
  }

  function renderDevelopmentVsUatByFacilityChart({
    containerId,
    rows,
    groupingLabel = "facility",
    colors,
    jiraBrowseBase = "https://nepgroup.atlassian.net/browse/",
    scope = "ongoing"
  }) {
    const chartRows = toChartRows(rows).slice();
    renderSvgChart(containerId, chartRows.length > 0, () =>
      h(FacilityUatListCard, {
        rows: chartRows,
        groupingLabel,
        colors,
        jiraBrowseBase,
        scope
      })
    );
  }

  function renderTopContributorsChart({ containerId, rows, colors, barColor }) {
    const chartRows = toChartRows(rows);
    renderSvgChart(containerId, chartRows.length > 0, () =>
      h(ContributorsSvgChart, {
        rows: chartRows,
        colors,
        barColor
      })
    );
  }

  Object.assign(window.DashboardCharts || (window.DashboardCharts = {}), {
    renderDevelopmentVsUatByFacilityChart,
    renderTopContributorsChart
  });
})();
