// Claude's Instagram MCP endpoint: https://dueduo.com/api/instagram/mcp
import { handleMcp } from "../../../../lib/instagram/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleMcp(request);
}

export async function GET(request: Request) {
  return handleMcp(request);
}

export async function DELETE(request: Request) {
  return handleMcp(request);
}
