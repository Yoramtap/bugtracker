"use strict";

(function initDashboardRuntimeContract() {
  const DEFAULT_SECTION = "community";
  const SECTION_FILTER_ITEMS = [
    { value: "community" },
    { value: "shipped" },
    { value: "product" },
    { value: "development" },
    { value: "bug" },
    { value: "all" }
  ];

  function normalizeSectionFilter(value) {
    const section = String(value || "")
      .trim()
      .toLowerCase();
    return SECTION_FILTER_ITEMS.some((item) => item.value === section) ? section : DEFAULT_SECTION;
  }

  function getModeFromUrl(search = window.location.search) {
    try {
      const params = new URLSearchParams(search);
      const chart = String(params.get("chart") || "")
        .trim()
        .toLowerCase();
      if (chart === "trend") return "trend";
      if (chart === "composition") return "composition";
      if (chart === "uat") return "uat";
      if (
        chart === "dev-uat-ratio" ||
        chart === "management" ||
        chart === "dev-uat-facility" ||
        chart === "management-facility"
      ) {
        return "management-facility";
      }
      if (chart === "pr" || chart === "prs") {
        return "workflow-breakdown";
      }
      if (chart === "pr-activity" || chart === "pr-activity-legacy") {
        return "pr-activity-legacy";
      }
      if (
        chart === "pr-cycle" ||
        chart === "pr-cycle-experiment" ||
        chart === "workflow-breakdown"
      ) {
        return "workflow-breakdown";
      }
      if (chart === "contributors") return "contributors";
      if (chart === "product-cycle" || chart === "cycle-time") return "product-cycle";
      if (chart === "lifecycle-days") return "lifecycle-days";
      return "all";
    } catch {
      return "all";
    }
  }

  function getSectionFilterFromUrl(search = window.location.search) {
    return normalizeSectionFilter(new URLSearchParams(search).get("report-section"));
  }

  function getRequiredSourceKeys(mode, availableSourceKeys = [], sectionKey = DEFAULT_SECTION) {
    if (mode === "all") {
      const desiredSourceKeysBySection = {
        community: ["contributors"],
        shipped: ["productCycleShipments"],
        product: ["managementFacility", "productCycle"],
        development: ["prActivity", "prCycle"],
        bug: ["snapshot"],
        all: availableSourceKeys.slice()
      };
      const desiredSourceKeys =
        desiredSourceKeysBySection[normalizeSectionFilter(sectionKey)] ||
        desiredSourceKeysBySection.community;
      return desiredSourceKeys.filter((sourceKey) => availableSourceKeys.includes(sourceKey));
    }
    if (mode === "contributors") return ["contributors"];
    if (mode === "management-facility") return ["managementFacility"];
    if (mode === "pr-activity-legacy") return ["prActivity"];
    if (mode === "workflow-breakdown" || mode === "pr-cycle-experiment") return ["prCycle"];
    if (mode === "product-cycle" || mode === "lifecycle-days") return ["productCycle"];
    return ["snapshot"];
  }

  if (typeof window.getSharedPrActivityHiddenKeys !== "function") {
    window.getSharedPrActivityHiddenKeys = () => new Set();
  }
  if (typeof window.setSharedPrActivityHiddenKeys !== "function") {
    window.setSharedPrActivityHiddenKeys = () => {};
  }

  window.DashboardRuntimeContract = Object.freeze({
    ensureHeavyPanelShell: () => Promise.resolve(),
    ensureHeavyScripts: () => Promise.resolve(),
    getModeFromUrl,
    getRequiredSourceKeys,
    getSectionFilterFromUrl
  });
})();
