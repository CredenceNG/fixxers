import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isActiveAgent } from "@/lib/agents/permissions";
import Header from "@/components/Header";
import AgentProfileClient from "./AgentProfileClient";

export default async function AgentProfilePage() {
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
      <AgentProfileClient />
    </>
  );
}
