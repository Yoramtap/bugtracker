#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { build as esbuildBuild, transform } from "esbuild";

const JS_BUNDLE_PATH = "dashboard.bundle.js";
const CSS_BUNDLE_PATH = "dashboard.bundle.css";
const ICON_ASSET_PATHS = [
  "assets/icons/share-3735079.png",
  "assets/icons/bookmark-3735089.png",
  "assets/icons/chart-3735080.png",
  "assets/icons/search-3735055.png"
];
const JS_SOURCE_PATHS = [
  "dashboard-runtime.js",
  "dashboard-view-utils.js",
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "dashboard-chart-core.js",
  "dashboard-pretext-layout.js",
  "dashboard-charts-shipped.js",
  "dashboard-charts-product.js",
  "dashboard-app.js"
];
const PANEL_SHELL_PATH = "dashboard-heavy-panels.html";
const INDEX_PATH = "index.html";
const STYLESHEET_PATH = "dashboard-styles.css";
const FONT_STYLESHEET_PATH = "dashboard-fonts.css";
const PRETEXT_MODULE_PATH = "vendor/pretext.mjs";
const FONT_URL_PATTERN =
  /url\((["']?)\.\/(node_modules\/@fontsource\/[^"')]+\.(?:woff2|woff))\1\)/g;

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return "";
  return (process.argv[index + 1] ?? "").trim();
}

function shortHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function removeDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

async function writeFileEnsured(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents);
}

async function copyFileEnsured(sourcePath, targetPath) {
  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(sourcePath, targetPath);
}

async function readUtf8(sourceDir, relativePath) {
  return await fs.readFile(path.join(sourceDir, relativePath), "utf8");
}

async function buildPretextIife(sourceDir) {
  const source = await readUtf8(sourceDir, PRETEXT_MODULE_PATH);
  const result = await esbuildBuild({
    stdin: {
      contents: source,
      resolveDir: sourceDir,
      sourcefile: PRETEXT_MODULE_PATH,
      loader: "js"
    },
    bundle: false,
    format: "iife",
    globalName: "DashboardPretextModule",
    minify: false,
    write: false,
    platform: "browser",
    target: "es2020"
  });
  return result.outputFiles[0].text;
}

async function buildJsBundle(sourceDir) {
  const chunks = [];
  for (const relativePath of JS_SOURCE_PATHS) {
    chunks.push(await readUtf8(sourceDir, relativePath));
  }
  chunks.splice(6, 0, await buildPretextIife(sourceDir));
  const concatenated = chunks.join("\n\n");
  const transformed = await transform(concatenated, {
    loader: "js",
    minify: true,
    target: "es2020"
  });
  return transformed.code;
}

async function buildCssBundle(sourceDir, outDir) {
  const styles = await readUtf8(sourceDir, STYLESHEET_PATH);
  const fontStyles = await readUtf8(sourceDir, FONT_STYLESHEET_PATH);
  const copiedFontPaths = new Map();
  let rewrittenFontStyles = fontStyles;

  for (const match of fontStyles.matchAll(FONT_URL_PATTERN)) {
    const sourceRelativePath = String(match[2] || "").trim();
    if (!sourceRelativePath) continue;
    if (copiedFontPaths.has(sourceRelativePath)) continue;
    const fileName = path.basename(sourceRelativePath);
    const publicRelativePath = path.posix.join("assets", "fonts", fileName);
    await copyFileEnsured(
      path.join(sourceDir, sourceRelativePath),
      path.join(outDir, publicRelativePath)
    );
    copiedFontPaths.set(sourceRelativePath, `./${publicRelativePath}`);
  }

  rewrittenFontStyles = rewrittenFontStyles.replace(
    FONT_URL_PATTERN,
    (_match, quote, assetPath) => {
      const rewrittenPath = copiedFontPaths.get(String(assetPath || "").trim());
      const safeQuote = quote || '"';
      return rewrittenPath ? `url(${safeQuote}${rewrittenPath}${safeQuote})` : _match;
    }
  );

  const transformed = await transform(`${rewrittenFontStyles}\n\n${styles}`, {
    loader: "css",
    minify: true,
    target: "es2020"
  });
  return {
    code: transformed.code,
    copiedAssetPaths: Array.from(copiedFontPaths.values()).map((relativePath) =>
      relativePath.replace(/^\.\//, "")
    )
  };
}

function buildBundledIndexHtml(indexHtml, panelShellHtml, { cssHash, jsHash }) {
  let output = indexHtml;
  output = output.replace(
    /<link rel="stylesheet" href="\.\/dashboard-styles\.css[^"]*" \/>\s*\n\s*<link rel="stylesheet" href="\.\/dashboard-fonts\.css[^"]*" \/>/,
    `<link rel="stylesheet" href="./${CSS_BUNDLE_PATH}?v=${cssHash}" />`
  );
  output = output.replace(
    /<script defer src="\.\/dashboard-bootstrap\.js[^"]*"><\/script>/,
    `<script defer src="./${JS_BUNDLE_PATH}?v=${jsHash}"></script>`
  );
  output = output.replace('<div id="dashboard-heavy-panels"></div>', panelShellHtml.trim());
  return output;
}

export async function buildPublicDashboard({
  sourceDir = process.cwd(),
  outDir = path.join(os.tmpdir(), `dashboard-public-build-${Date.now()}`)
} = {}) {
  await removeDir(outDir);
  await ensureDir(outDir);

  const [indexHtml, panelShellHtml, jsBundle, cssBundle] = await Promise.all([
    readUtf8(sourceDir, INDEX_PATH),
    readUtf8(sourceDir, PANEL_SHELL_PATH),
    buildJsBundle(sourceDir),
    buildCssBundle(sourceDir, outDir)
  ]);

  const jsHash = shortHash(jsBundle);
  const cssHash = shortHash(cssBundle.code);
  const bundledIndexHtml = buildBundledIndexHtml(indexHtml, panelShellHtml, { cssHash, jsHash });

  await Promise.all([
    writeFileEnsured(path.join(outDir, INDEX_PATH), bundledIndexHtml),
    writeFileEnsured(path.join(outDir, JS_BUNDLE_PATH), jsBundle),
    writeFileEnsured(path.join(outDir, CSS_BUNDLE_PATH), cssBundle.code),
    ...ICON_ASSET_PATHS.map((assetPath) =>
      copyFileEnsured(path.join(sourceDir, assetPath), path.join(outDir, assetPath))
    )
  ]);

  return {
    outDir,
    jsBundlePath: path.join(outDir, JS_BUNDLE_PATH),
    cssBundlePath: path.join(outDir, CSS_BUNDLE_PATH),
    indexPath: path.join(outDir, INDEX_PATH),
    assetPaths: [
      INDEX_PATH,
      JS_BUNDLE_PATH,
      CSS_BUNDLE_PATH,
      ...ICON_ASSET_PATHS,
      ...cssBundle.copiedAssetPaths
    ]
  };
}

async function main() {
  const targetDir = path.resolve(
    getArg("--target") || path.join(os.tmpdir(), "dashboard-public-build")
  );
  const result = await buildPublicDashboard({ sourceDir: process.cwd(), outDir: targetDir });
  console.log(`Built public dashboard at ${result.outDir}`);
}

if (import.meta.url === new URL(process.argv[1], "file://").href) {
  main().catch((error) => {
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
  });
}
