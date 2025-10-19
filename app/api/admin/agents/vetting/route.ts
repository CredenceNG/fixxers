import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPendingVettingRequests, approveVettedFixer, rejectVettedFixer } from "@/lib/agents/vetting";

/**
 * GET /api/admin/agents/vetting - Get all pending vetting requests
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    const roles = user?.roles || [];
    if (!user || !roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const pending = await getPendingVettingRequests();

    return NextResponse.json({ requests: pending });
  } catch (error) {
    console.error("Get vetting requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vetting requests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agents/vetting - Approve or reject a vetting request
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const roles = user?.roles || [];
    if (!user || !roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { agentId, fixerId, action, notes } = body;

    if (!agentId || !fixerId || !action) {
      return NextResponse.json(
        { error: "Agent ID, Fixer ID, and action are required" },
        { status: 400 }
      );
    }

    let result;

    if (action === "approve") {
      result = await approveVettedFixer(agentId, fixerId, user.id, notes);
    } else if (action === "reject") {
      if (!notes || !notes.trim()) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }
      result = await rejectVettedFixer(agentId, fixerId, notes);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Vetting request ${action}d successfully`,
      result,
    });
  } catch (error: any) {
    console.error("Vetting action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process vetting request" },
      { status: 500 }
    );
  }
}
