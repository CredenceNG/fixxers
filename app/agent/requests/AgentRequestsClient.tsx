'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { colors } from '@/lib/theme';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  urgency: string;
  status: string;
  createdAt: Date;
  subcategory: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  neighborhood: {
    id: string;
    name: string;
    city: {
      name: string;
      state: string;
    };
  };
  client: {
    id: string;
    name: string;
  };
}

export default function AgentRequestsClient() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/service-requests');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return colors.error;
      case 'HIGH':
        return colors.warningDark;
      case 'MEDIUM':
        return colors.warning;
      case 'LOW':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return colors.primary;
      case 'IN_PROGRESS':
        return colors.blue;
      case 'COMPLETED':
        return colors.success;
      case 'CANCELLED':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: colors.textSecondary }}>Loading service requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ backgroundColor: colors.errorLight, border: `1px solid ${colors.error}`, borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: colors.error }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Service Requests
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Browse service requests in your approved territories
          </p>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div style={{ backgroundColor: colors.white, padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: colors.textSecondary, marginBottom: '16px' }}>
              No service requests available in your territories
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map((request) => (
              <div
                key={request.id}
                style={{
                  backgroundColor: colors.white,
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      {request.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          backgroundColor: `${getUrgencyColor(request.urgency)}20`,
                          color: getUrgencyColor(request.urgency),
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        {request.urgency}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          backgroundColor: `${getStatusColor(request.status)}20`,
                          color: getStatusColor(request.status),
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        {request.status}
                      </span>
                      <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                        {request.subcategory.category.name} → {request.subcategory.name}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary, marginBottom: '4px' }}>
                      ₦{Number(request.budget).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      Budget
                    </div>
                  </div>
                </div>

                <p style={{ color: colors.textSecondary, marginBottom: '16px', lineHeight: '1.5' }}>
                  {request.description.length > 200
                    ? `${request.description.substring(0, 200)}...`
                    : request.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Location:</strong> {request.neighborhood.name}, {request.neighborhood.city.name}
                    </div>
                    <div>
                      <strong>Posted:</strong> {new Date(request.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <Link
                    href={`/agent/requests/${request.id}/quote`}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: colors.primary,
                      color: colors.white,
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'inline-block',
                    }}
                  >
                    Submit Quote
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
