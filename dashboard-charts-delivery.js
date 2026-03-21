"use strict";

(function initDashboardDeliveryCharts() {
  const core = window.DashboardChartCore;
  const svgCore = window.DashboardSvgCore;
  if (!core) {
    throw new Error("Dashboard chart core not loaded.");
  }
  if (!svgCore) {
    throw new Error("Dashboard SVG core not loaded.");
  }

  const { h, toNumber, toWhole } = core;
  const { renderSvgChart } = svgCore;

  function toChartRows(rows) {
    return Array.isArray(rows) ? rows : [];
  }

  function formatFacilityMonthsParts(valueInMonths) {
    const safeValue = Math.max(0, toNumber(valueInMonths));
    return {
      value: safeValue === 0 ? "0" : safeValue.toFixed(1),
      unit: Math.abs(safeValue - 1) < 0.05 ? "month" : "months"
    };
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
            const monthParts = formatFacilityMonthsParts(uatMonths);
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
                      h(
                        "span",
                        { className: "management-uat-row__action-value metric-duration" },
                        h("span", { className: "metric-duration__value" }, monthParts.value),
                        h("span", { className: "metric-duration__unit" }, monthParts.unit)
                      ),
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
                      h(
                        "span",
                        { className: "metric-duration" },
                        h("span", { className: "metric-duration__value" }, monthParts.value),
                        h("span", { className: "metric-duration__unit" }, monthParts.unit)
                      )
                    )
              )
            );
          })
        )
      )
    );
  }

  function renderDevelopmentVsUatByFacilityChart({
    containerId,
    rows,
    groupingLabel = "facility",
    jiraBrowseBase = "https://nepgroup.atlassian.net/browse/",
    scope = "ongoing"
  }) {
    const chartRows = toChartRows(rows).slice();
    renderSvgChart(containerId, chartRows.length > 0, () =>
      h(FacilityUatListCard, {
        rows: chartRows,
        groupingLabel,
        jiraBrowseBase,
        scope
      })
    );
  }

  Object.assign(window.DashboardCharts || (window.DashboardCharts = {}), {
    renderDevelopmentVsUatByFacilityChart
  });
})();
