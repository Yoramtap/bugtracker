import { NextResponse } from "next/server";
import { getBacklogSnapshot } from "../../../backlog/server-snapshot";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getBacklogSnapshot());
}
