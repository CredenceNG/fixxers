import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isActiveAgent } from "@/lib/agents/permissions";
import Header from "@/components/Header";
import AgentEarningsClient from "./AgentEarningsClient";

export default async function AgentEarningsPage() {
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
      <AgentEarningsClient />
    </>
  );
}
