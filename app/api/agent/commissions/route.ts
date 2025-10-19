import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isActiveAgent } from "@/lib/agents/permissions";
import {
  getAgentCommissionSummary,
  getAgentEarningsAnalytics,
} from "@/lib/agents/commissions";

/**
 * GET /api/agent/commissions - Get agent commission history and analytics
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAgent = await isActiveAgent(user.id);
    if (!isAgent) {
      return NextResponse.json(
        { error: "User is not an active agent" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const [summary, analytics] = await Promise.all([
      getAgentCommissionSummary(user.id),
      getAgentEarningsAnalytics(
        user.id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      ),
    ]);

    return NextResponse.json({
      summary,
      analytics,
    });
  } catch (error) {
    console.error("Get agent commissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
}
