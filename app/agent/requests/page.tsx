import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isActiveAgent } from "@/lib/agents/permissions";
import Header from "@/components/Header";
import AgentRequestsClient from "./AgentRequestsClient";

export default async function AgentRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isAgent = await isActiveAgent(user.id);
  if (!isAgent) {
    redirect("/agent/application");
  }

  return (
    <>
      <Header />
      <AgentRequestsClient />
    </>
  );
}
