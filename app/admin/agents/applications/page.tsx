import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminAgentApplicationsClient from "./AdminAgentApplicationsClient";

export default async function AdminAgentApplicationsPage() {
  const user = await getCurrentUser();

  const roles = user?.roles || [];
  if (!user || !roles.includes("ADMIN")) {
    redirect("/");
  }

  return <AdminAgentApplicationsClient />;
}
