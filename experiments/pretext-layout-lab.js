const PRETEXT_URL = "https://esm.sh/@chenglou/pretext@0.0.2/es2022/pretext.mjs";

const state = {
  width: 520,
  obstacleHeight: 132,
  pretext: null,
  prCycleData: null,
  pilotWindowKey: "",
  pilotTeamKey: ""
};

const copy = {
  summaryLabel: "Release signal",
  summaryText:
    "Development workflow breakdown now makes the slowest stage obvious at a glance, while keeping the team target and open work in the same card without collapsing into abbreviations.",
  summaryMeta: ["1.8 months review", "6 teams", "Target 1 month"],
  editorialText:
    "Shipping accelerated in Broadcast after review time dropped below one month, but Workers still carry the heaviest in-progress load. The next dashboard pass should surface the blocker before users open a second panel, and the composition should still feel intentional when the width budget gets tight.",
  sizingSamples: [
    {
      label: "Product acceptance time by business unit",
      note: "Heavy panel heading"
    },
    {
      label: "Development workflow breakdown",
      note: "Panel heading"
    },
    {
      label: "BC long-standing (60d+)",
      note: "Legend / marker label"
    },
    {
      label: "Target: 1 month",
      note: "Compact submeta"
    },
    {
      label: "Community contributors",
      note: "Card header"
    },
    {
      label: "Legacy FE",
      note: "Short team chip"
    }
  ]
};

const teamColorByKey = {
  all: "#667a4d",
  api: "#4f8fcb",
  legacy: "#c78b2e",
  react: "#2f9fb4",
  bc: "#7b63c7",
  workers: "#5e6b84",
  titanium: "#b07aa1"
};

const nodes = {
  widthRange: document.getElementById("width-range"),
  obstacleRange: document.getElementById("obstacle-range"),
  widthValue: document.getElementById("width-value"),
  obstacleValue: document.getElementById("obstacle-value"),
  status: document.getElementById("lab-status"),
  fixedCard: document.getElementById("fixed-card"),
  tightCard: document.getElementById("tight-card"),
  tightCardLines: document.getElementById("tight-card-lines"),
  fixedCardMetrics: document.getElementById("fixed-card-metrics"),
  tightCardMetrics: document.getElementById("tight-card-metrics"),
  editorialPanel: document.getElementById("editorial-panel"),
  editorialLines: document.getElementById("editorial-lines"),
  editorialObstacle: document.getElementById("editorial-obstacle"),
  editorialMetrics: document.getElementById("editorial-metrics"),
  sizingMatrix: document.getElementById("sizing-matrix"),
  pilotWindow: document.getElementById("pilot-window"),
  pilotTeam: document.getElementById("pilot-team"),
  pilotStatus: document.getElementById("pilot-status"),
  pilotCurrentCard: document.getElementById("pilot-current-card"),
  pilotCurrentMetrics: document.getElementById("pilot-current-metrics"),
  pilotPretextCard: document.getElementById("pilot-pretext-card"),
  pilotPretextMetrics: document.getElementById("pilot-pretext-metrics"),
  pilotPretextObstacle: document.getElementById("pilot-pretext-obstacle"),
  pilotPretextTotal: document.getElementById("pilot-pretext-total"),
  pilotPretextBottleneck: document.getElementById("pilot-pretext-bottleneck"),
  pilotPretextSummary: document.getElementById("pilot-pretext-summary"),
  pilotPretextRows: document.getElementById("pilot-pretext-rows")
};

const fonts = {
  card: "500 16px Inter",
  cardLineHeight: 24,
  editorial: '700 17px "IBM Plex Serif"',
  editorialLineHeight: 27,
  matrix: "600 14px Inter",
  matrixLineHeight: 20,
  workflowSummary: '700 16px "IBM Plex Serif"',
  workflowSummaryLineHeight: 24
};

function setStatus(message) {
  nodes.status.textContent = message;
}

function setPilotStatus(message) {
  nodes.pilotStatus.textContent = message;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCount(value) {
  const count = Math.trunc(toNumber(value));
  return count > 0 ? count : 0;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getWindowSnapshot(windowKey) {
  return state.prCycleData?.windows?.[windowKey] || null;
}

function getSelectedPilotTeam() {
  const snapshot = getWindowSnapshot(state.pilotWindowKey);
  const teams = Array.isArray(snapshot?.teams) ? snapshot.teams : [];
  return teams.find((team) => String(team?.key || "") === state.pilotTeamKey) || teams[0] || null;
}

function formatDays(days) {
  const value = Math.max(0, toNumber(days));
  return `${value.toFixed(1)} ${Math.abs(value - 1) < 0.05 ? "day" : "days"}`;
}

function setSelectOptions(selectNode, options, value) {
  selectNode.innerHTML = options
    .map(
      ({ value: optionValue, label }) =>
        `<option value="${escapeHtml(optionValue)}"${optionValue === value ? " selected" : ""}>${escapeHtml(label)}</option>`
    )
    .join("");
}

function countLines(prepared, width) {
  let lineCount = 0;
  state.pretext.walkLineRanges(prepared, width, () => {
    lineCount += 1;
  });
  return lineCount;
}

function findTightWidth(prepared, minWidth, maxWidth) {
  const targetLineCount = countLines(prepared, maxWidth);
  let low = minWidth;
  let high = maxWidth;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const lines = countLines(prepared, mid);
    if (lines <= targetLineCount) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return {
    width: low,
    lineCount: targetLineCount
  };
}

function clearElement(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function renderLines(node, lines, { lineHeight, className, x = 0, topPadding = 0 }) {
  clearElement(node);
  node.style.height = `${Math.max(lines.length * lineHeight, 1)}px`;

  lines.forEach((line, index) => {
    const lineNode = document.createElement("div");
    lineNode.className = `line-layer__line ${className}`;
    lineNode.textContent = line.text;
    lineNode.style.top = `${topPadding + index * lineHeight}px`;
    lineNode.style.left = `${x}px`;
    node.appendChild(lineNode);
  });
}

function renderFixedCard(maxWidth) {
  const surfaceWidth = Math.max(
    300,
    Math.min(maxWidth, Math.floor(nodes.fixedCard.parentElement.clientWidth) - 4)
  );
  nodes.fixedCard.style.width = "100%";
  nodes.fixedCard.innerHTML = `
    <div class="message-card__label">${copy.summaryLabel}</div>
    <div class="message-card__text">${copy.summaryText}</div>
    <div class="message-card__meta">
      ${copy.summaryMeta.map((item) => `<span class="metric-pill">${item}</span>`).join("")}
    </div>
  `;
  nodes.fixedCardMetrics.textContent = `${surfaceWidth}px budget`;
}

function renderTightCard(maxWidth) {
  const surfaceBudget = Math.max(
    300,
    Math.min(maxWidth, Math.floor(nodes.tightCard.parentElement.clientWidth) - 4)
  );
  const minWidth = Math.max(220, Math.floor(surfaceBudget * 0.52));
  const prepared = state.pretext.prepareWithSegments(copy.summaryText, fonts.card);
  const { width: tightWidth, lineCount } = findTightWidth(prepared, minWidth, surfaceBudget);
  const laidOut = state.pretext.layoutWithLines(prepared, tightWidth, fonts.cardLineHeight);
  const areaSaved = Math.round(((surfaceBudget - tightWidth) / surfaceBudget) * 100);

  nodes.tightCard.style.width = `${tightWidth + 36}px`;
  nodes.tightCard.style.minHeight = `${laidOut.height + 104}px`;
  nodes.tightCard.innerHTML = `
    <div class="message-card__label">${copy.summaryLabel}</div>
    <div id="tight-card-lines" class="line-layer"></div>
    <div class="message-card__meta">
      ${copy.summaryMeta.map((item) => `<span class="metric-pill">${item}</span>`).join("")}
    </div>
  `;

  const lineLayer = document.getElementById("tight-card-lines");
  renderLines(lineLayer, laidOut.lines, {
    lineHeight: fonts.cardLineHeight,
    className: "line-layer__line--card",
    topPadding: 0
  });

  nodes.tightCardMetrics.textContent = `${tightWidth}px · ${lineCount} lines · ${areaSaved}% tighter`;
}

function renderEditorial(maxWidth, obstacleHeight) {
  const surfaceBudget = Math.max(
    340,
    Math.min(maxWidth, Math.floor(nodes.editorialPanel.parentElement.clientWidth) - 4)
  );
  const textWidth = Math.max(320, surfaceBudget - 44);
  const obstacleWidth = Math.min(138, Math.floor(textWidth * 0.32));
  const gap = 22;
  const prepared = state.pretext.prepareWithSegments(copy.editorialText, fonts.editorial);
  const lines = [];
  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = 0;

  nodes.editorialPanel.style.width = `${textWidth + 44}px`;
  nodes.editorialPanel.style.minHeight = `${Math.max(308, obstacleHeight + 112)}px`;
  nodes.editorialObstacle.style.width = `${obstacleWidth}px`;
  nodes.editorialObstacle.style.minHeight = `${obstacleHeight}px`;

  while (true) {
    const widthBudget = y < obstacleHeight ? textWidth - obstacleWidth - gap : textWidth;
    const line = state.pretext.layoutNextLine(prepared, cursor, widthBudget);
    if (line === null) break;
    lines.push(line);
    cursor = line.end;
    y += fonts.editorialLineHeight;
  }

  renderLines(nodes.editorialLines, lines, {
    lineHeight: fonts.editorialLineHeight,
    className: "line-layer__line--editorial",
    topPadding: 4
  });

  nodes.editorialMetrics.textContent = `${textWidth}px text column · ${lines.length} routed lines`;
}

function renderSizingMatrix(widths) {
  const rows = copy.sizingSamples
    .map((sample) => {
      const prepared = state.pretext.prepare(sample.label, fonts.matrix);
      const metrics = widths
        .map((width) => {
          const result = state.pretext.layout(prepared, width, fonts.matrixLineHeight);
          const alertClass = result.lineCount >= 3 ? " sizing-matrix__metric--alert" : "";
          return `
            <td>
              <span class="sizing-matrix__metric${alertClass}">
                <span>${width}px</span>
                <strong>${result.lineCount} lines</strong>
                <span>${result.height}px</span>
              </span>
            </td>
          `;
        })
        .join("");

      return `
        <tr>
          <td>
            <strong>${sample.label}</strong>
            <span>${sample.note}</span>
          </td>
          ${metrics}
        </tr>
      `;
    })
    .join("");

  nodes.sizingMatrix.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Label</th>
          ${widths.map((width) => `<th>${width}px</th>`).join("")}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function normalizeStageLabel(stage) {
  const key = String(stage?.key || "").trim();
  if (key === "coding") return "In Progress";
  if (key === "review") return "In Review";
  if (key === "merge") return "QA";
  return String(stage?.label || "").trim() || "Stage";
}

function getPilotSummary(team, snapshot) {
  const teamLabel = String(team?.label || "Team").trim();
  const issueCount = toCount(team?.issueCount);
  const inflow = Math.round(toNumber(team?.avgPrInflow));
  const bottleneck = String(team?.bottleneckLabel || "No clear bottleneck").trim();
  return `${teamLabel} spent most of ${String(snapshot?.windowLabel || "this window")
    .trim()
    .toLowerCase()} in ${bottleneck}, with ${issueCount} sampled issues and about ${inflow} pull requests per sprint moving through the workflow.`;
}

function renderCurrentWorkflowCard(team, snapshot) {
  const stages = Array.isArray(team?.stages) ? team.stages : [];
  const maxDays = Math.max(1, ...stages.map((stage) => toNumber(stage?.days)));
  const footerBits = [
    `${toCount(team?.issueCount)} issues sampled`,
    String(snapshot?.windowLabel || "").trim(),
    `PR/sprint ≈ ${Math.round(toNumber(team?.avgPrInflow))}`,
    `Bottleneck: ${String(team?.bottleneckLabel || "").trim()}`
  ].filter(Boolean);

  const rowsMarkup = stages
    .map((stage) => {
      const width = Math.max(12, Math.round((toNumber(stage?.days) / maxDays) * 100));
      const color = teamColorByKey[String(team?.key || "").trim()] || "#5e6b84";
      return `
        <div class="workflow-stage-row">
          <div class="workflow-stage-row__label">
            <strong>${escapeHtml(normalizeStageLabel(stage))}</strong>
            <span>n = ${toCount(stage?.sampleCount)}</span>
          </div>
          <div class="workflow-stage-row__track" aria-hidden="true">
            <div class="workflow-stage-row__fill" style="width:${width}%;background:${escapeHtml(color)}"></div>
          </div>
          <div class="workflow-stage-row__value">${escapeHtml(formatDays(stage?.days))}</div>
        </div>
      `;
    })
    .join("");

  nodes.pilotCurrentCard.innerHTML = `
    <div class="workflow-card__header">
      <div class="workflow-card__meta">
        <div class="workflow-card__team">${escapeHtml(String(team?.label || ""))}</div>
        <div class="workflow-card__submeta">${escapeHtml(String(snapshot?.windowLabel || ""))}</div>
      </div>
      <div class="workflow-card__total">${escapeHtml(formatDays(team?.totalCycleDays))}</div>
    </div>
    <div class="workflow-stage-list">${rowsMarkup}</div>
    <div class="workflow-card__footer">
      ${footerBits.map((bit) => `<span>${escapeHtml(bit)}</span>`).join("")}
    </div>
  `;

  nodes.pilotCurrentMetrics.textContent = "Fixed row shell";
}

function renderPretextWorkflowCard(team, snapshot) {
  const summaryText = getPilotSummary(team, snapshot);
  const summaryPrepared = state.pretext.prepareWithSegments(summaryText, fonts.workflowSummary);
  const stages = Array.isArray(team?.stages) ? team.stages : [];
  const maxDays = Math.max(1, ...stages.map((stage) => toNumber(stage?.days)));
  const cardBudget = Math.max(
    320,
    Math.floor(nodes.pilotPretextCard.parentElement.clientWidth) - 44
  );
  const obstacleWidth = 136;
  const obstacleHeight = 120;
  const gap = 18;
  const textWidth = Math.max(240, cardBudget - 18);
  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = 0;
  const summaryLines = [];

  nodes.pilotPretextCard.style.minHeight = `${Math.max(360, obstacleHeight + 238)}px`;
  nodes.pilotPretextObstacle.style.width = `${obstacleWidth}px`;
  nodes.pilotPretextObstacle.style.minHeight = `${obstacleHeight}px`;
  nodes.pilotPretextTotal.textContent = formatDays(team?.totalCycleDays);
  nodes.pilotPretextBottleneck.textContent = `Bottleneck: ${String(team?.bottleneckLabel || "").trim()}`;

  while (true) {
    const widthBudget = y < obstacleHeight ? textWidth - obstacleWidth - gap : textWidth;
    const line = state.pretext.layoutNextLine(summaryPrepared, cursor, widthBudget);
    if (line === null) break;
    summaryLines.push(line);
    cursor = line.end;
    y += fonts.workflowSummaryLineHeight;
  }

  renderLines(nodes.pilotPretextSummary, summaryLines, {
    lineHeight: fonts.workflowSummaryLineHeight,
    className: "line-layer__line--workflow",
    topPadding: 2
  });

  nodes.pilotPretextRows.innerHTML = `
    <p class="workflow-stage-list__intro">${escapeHtml(String(snapshot?.windowLabel || ""))}</p>
    ${stages
      .map((stage) => {
        const width = Math.max(10, Math.round((toNumber(stage?.days) / maxDays) * 100));
        const color = teamColorByKey[String(team?.key || "").trim()] || "#5e6b84";
        const stageLabel = normalizeStageLabel(stage);
        return `
          <div class="workflow-stage-row workflow-stage-row--pretext">
            <div class="workflow-stage-row__stack">
              <div class="workflow-stage-row__chipline">
                <span class="workflow-stage-row__chip">${escapeHtml(stageLabel)}</span>
                <span class="workflow-stage-row__chip workflow-stage-row__chip--sample">n = ${toCount(stage?.sampleCount)}</span>
              </div>
              <div class="workflow-stage-row__description">
                ${escapeHtml(`${stageLabel} averaged ${formatDays(stage?.days)} across sampled issues in this window.`)}
              </div>
              <div class="workflow-stage-row__rail" aria-hidden="true">
                <div class="workflow-stage-row__rail-fill" style="width:${width}%;background:${escapeHtml(color)}"></div>
              </div>
            </div>
            <div class="workflow-stage-row__value">${escapeHtml(formatDays(stage?.days))}</div>
          </div>
        `;
      })
      .join("")}
    <div class="workflow-card__footer">
      <span>${escapeHtml(`${toCount(team?.issueCount)} sampled issues`)}</span>
      <span>${escapeHtml(`PR/sprint ≈ ${Math.round(toNumber(team?.avgPrInflow))}`)}</span>
      <span>${escapeHtml(`Team: ${String(team?.label || "").trim()}`)}</span>
    </div>
  `;

  nodes.pilotPretextMetrics.textContent = `${summaryLines.length} routed summary lines`;
}

function renderWorkflowPilot() {
  if (!state.pretext || !state.prCycleData) return;

  const snapshot = getWindowSnapshot(state.pilotWindowKey);
  const team = getSelectedPilotTeam();
  if (!snapshot || !team) {
    setPilotStatus("No workflow team data available for the selected window.");
    return;
  }

  renderCurrentWorkflowCard(team, snapshot);
  renderPretextWorkflowCard(team, snapshot);
  setPilotStatus(
    "Loaded real workflow data. The right card keeps fuller language and uses routed composition instead of a fixed row shell."
  );
}

async function loadWorkflowSnapshot() {
  try {
    const response = await fetch("../pr-cycle-snapshot.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.prCycleData = await response.json();

    const windowKeys = Object.keys(state.prCycleData?.windows || {});
    state.pilotWindowKey = state.prCycleData?.defaultWindow || windowKeys[0] || "";
    const initialTeams = Array.isArray(getWindowSnapshot(state.pilotWindowKey)?.teams)
      ? getWindowSnapshot(state.pilotWindowKey).teams
      : [];
    state.pilotTeamKey =
      String(state.prCycleData?.defaultTeam || "").trim() ||
      String(initialTeams[0]?.key || "").trim();

    setSelectOptions(
      nodes.pilotWindow,
      windowKeys.map((key) => ({
        value: key,
        label: String(getWindowSnapshot(key)?.windowLabel || key)
      })),
      state.pilotWindowKey
    );

    syncPilotTeamOptions();
    renderWorkflowPilot();
  } catch (error) {
    setPilotStatus(
      `Could not load workflow snapshot. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function syncPilotTeamOptions() {
  const snapshot = getWindowSnapshot(state.pilotWindowKey);
  const teams = Array.isArray(snapshot?.teams) ? snapshot.teams : [];
  if (!teams.some((team) => String(team?.key || "") === state.pilotTeamKey)) {
    state.pilotTeamKey = String(teams[0]?.key || "");
  }
  setSelectOptions(
    nodes.pilotTeam,
    teams.map((team) => ({
      value: String(team?.key || ""),
      label: String(team?.label || team?.key || "")
    })),
    state.pilotTeamKey
  );
}

function render() {
  if (!state.pretext) return;

  const width = state.width;
  const obstacleHeight = state.obstacleHeight;

  nodes.widthValue.textContent = `${width}px`;
  nodes.obstacleValue.textContent = `${obstacleHeight}px`;

  renderFixedCard(width);
  renderTightCard(width);
  renderEditorial(Math.max(360, width), obstacleHeight);
  renderSizingMatrix([220, 320, Math.max(420, width)]);
  renderWorkflowPilot();

  setStatus(
    "Ready. This lab now shows four production-relevant Pretext advantages: width-tight cards, obstacle-aware summaries, predictive sizing, and a real workflow-card pilot on snapshot data."
  );
}

async function boot() {
  try {
    setStatus("Loading Pretext…");
    const pretext = await import(PRETEXT_URL);
    setStatus("Waiting for fonts…");
    await document.fonts.ready;
    state.pretext = pretext;
    await loadWorkflowSnapshot();
    render();
  } catch (error) {
    setStatus(
      `Could not load Pretext. The lab needs network access to ${PRETEXT_URL}. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

nodes.widthRange.addEventListener("input", (event) => {
  state.width = Number(event.target.value || 520);
  render();
});

nodes.obstacleRange.addEventListener("input", (event) => {
  state.obstacleHeight = Number(event.target.value || 132);
  render();
});

nodes.pilotWindow.addEventListener("change", (event) => {
  state.pilotWindowKey = String(event.target.value || "");
  syncPilotTeamOptions();
  renderWorkflowPilot();
});

nodes.pilotTeam.addEventListener("change", (event) => {
  state.pilotTeamKey = String(event.target.value || "");
  renderWorkflowPilot();
});

void boot();
