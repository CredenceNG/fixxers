import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import AgentDashboardClient from "./AgentDashboardClient";

export default async function AgentDashboardPage() {
  const user = await getCurrentUser();

  console.log('[Agent Dashboard] User:', user?.id, user?.email);

  if (!user) {
    console.log('[Agent Dashboard] No user found, redirecting to login');
    redirect("/auth/login");
  }

  // Check if user has an agent profile
  const agent = await prisma.agent.findUnique({
    where: { userId: user.id },
    select: { id: true, status: true },
  });

  console.log('[Agent Dashboard] Agent found:', agent?.id, 'Status:', agent?.status);

  // If no agent profile, redirect to application
  if (!agent) {
    console.log('[Agent Dashboard] No agent profile, redirecting to application');
    redirect("/agent/application");
  }

  // If rejected or banned, redirect to application to see status
  if (agent.status === 'REJECTED' || agent.status === 'BANNED') {
    console.log('[Agent Dashboard] Agent status is REJECTED or BANNED, redirecting');
    redirect("/agent/application");
  }

  console.log('[Agent Dashboard] Rendering dashboard for agent:', agent.id);
  // Allow PENDING, ACTIVE, and SUSPENDED agents to access dashboard
  return (
    <>
      <Header />
      <AgentDashboardClient />
    </>
  );
}
