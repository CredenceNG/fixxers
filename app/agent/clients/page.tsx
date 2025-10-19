import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isActiveAgent } from "@/lib/agents/permissions";
import Header from "@/components/Header";
import AgentClientsClient from "./AgentClientsClient";

export default async function AgentClientsPage() {
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
      <AgentClientsClient />
    </>
  );
}
