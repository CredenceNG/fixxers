import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isActiveAgent } from "@/lib/agents/permissions";
import AgentTerritoryClient from "./AgentTerritoryClient";

export default async function AgentTerritoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isAgent = await isActiveAgent(user.id);
  if (!isAgent) {
    redirect("/agent/application");
  }

  return <AgentTerritoryClient />;
}
