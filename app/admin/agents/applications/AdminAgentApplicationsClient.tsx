"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AgentApplication {
  id: string;
  businessName: string;
  status: string;
  pendingChanges: boolean;
  commissionPercentage: number;
  maxFixers: number;
  maxClients: number;
  requestedNeighborhoodIds: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  approvedNeighborhoods: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
  }>;
  _count: {
    managedFixers: number;
    managedClients: number;
  };
}

export default function AdminAgentApplicationsClient() {
  const router = useRouter();
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/admin/agents/applications");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load applications");
      }

      setApplications(data.applications);
    } catch (err: any) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agentId: string) => {
    const maxFixers = prompt("Maximum fixers (default 50):", "50");
    if (!maxFixers) return;

    const maxClients = prompt("Maximum clients (default 100):", "100");
    if (!maxClients) return;

    const commissionPercentage = prompt("Commission percentage (default 5):", "5");
    if (!commissionPercentage) return;

    if (!confirm("Approve this agent application?")) return;

    setProcessingId(agentId);

    try {
      const response = await fetch(`/api/admin/agents/${agentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxFixers: parseInt(maxFixers),
          maxClients: parseInt(maxClients),
          commissionPercentage: parseFloat(commissionPercentage),
          approvedNeighborhoodIds: applications.find((a) => a.id === agentId)?.requestedNeighborhoodIds || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve application");
      }

      alert("Agent approved successfully!");
      fetchApplications();
    } catch (err: any) {
      alert(err.message || "Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (agentId: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason || !reason.trim()) {
      alert("Rejection reason is required");
      return;
    }

    if (!confirm("Reject this agent application?")) return;

    setProcessingId(agentId);

    try {
      const response = await fetch(`/api/admin/agents/${agentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject application");
      }

      alert("Agent rejected successfully!");
      fetchApplications();
    } catch (err: any) {
      alert(err.message || "Failed to reject application");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Applications</h1>
          <p className="mt-2 text-gray-600">Review and manage agent applications</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">No pending applications</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <ul className="divide-y divide-gray-200">
              {applications.map((app) => (
                <li key={app.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{app.businessName}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            app.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : app.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {app.status}
                        </span>
                        {app.pendingChanges && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Has Changes
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        <p>Applicant: {app.user.name} ({app.user.email})</p>
                        <p>Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <span className="text-xs text-gray-500">Commission Rate</span>
                          <p className="text-sm font-medium text-gray-900">{Number(app.commissionPercentage)}%</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Max Fixers</span>
                          <p className="text-sm font-medium text-gray-900">{app.maxFixers}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Max Clients</span>
                          <p className="text-sm font-medium text-gray-900">{app.maxClients}</p>
                        </div>
                      </div>

                      {app.requestedNeighborhoodIds.length > 0 && (
                        <div className="mt-3">
                          <span className="text-xs text-gray-500">
                            Requested {app.requestedNeighborhoodIds.length} neighborhoods
                          </span>
                        </div>
                      )}

                      {app.approvedNeighborhoods.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {app.approvedNeighborhoods.map((n) => (
                            <span
                              key={n.id}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                            >
                              {n.name}, {n.city}, {n.state}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {app.status === "PENDING" && (
                      <div className="ml-6 flex gap-3">
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={processingId === app.id}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingId === app.id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={processingId === app.id}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
