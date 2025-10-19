import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isActiveAgent } from "@/lib/agents/permissions";
import Header from "@/components/Header";
import CreateRequestForm from "./CreateRequestForm";

export default async function CreateRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isAgent = await isActiveAgent(user.id);
  if (!isAgent) {
    redirect("/agent/application");
  }

  const { id } = await params;

  return (
    <>
      <Header />
      <CreateRequestForm clientId={id} />
    </>
  );
}
