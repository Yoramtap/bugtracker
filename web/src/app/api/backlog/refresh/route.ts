import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getBacklogSnapshot } from "../../../backlog/server-snapshot";

const execFileAsync = promisify(execFile);
let inFlightRefresh: Promise<void> | null = null;

export const runtime = "nodejs";

export async function POST() {
  if (inFlightRefresh) {
    return NextResponse.json(
      { error: "Backlog refresh is already running. Please wait a moment and retry." },
      { status: 409 },
    );
  }

  try {
    const scriptPath = path.resolve(process.cwd(), "scripts/refresh-backlog-trends.mjs");
    inFlightRefresh = execFileAsync(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    }).then(() => undefined);
    await inFlightRefresh;

    return NextResponse.json(await getBacklogSnapshot());
  } catch (error) {
    let message = "Failed to refresh backlog trends.";
    if (typeof error === "object" && error !== null) {
      const maybeError = error as { message?: string; stderr?: string };
      if (maybeError.stderr && maybeError.stderr.trim()) {
        message = maybeError.stderr.trim();
      } else if (maybeError.message) {
        message = maybeError.message;
      }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    inFlightRefresh = null;
  }
}
