'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';
import FixerVettingForm from '@/components/agent/FixerVettingForm';

export default function FixerDetailClient({ fixerId }: { fixerId: string }) {
  const router = useRouter();
  const [agentFixer, setAgentFixer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVetting, setShowVetting] = useState(false);

  useEffect(() => {
    fetchFixerDetails();
  }, [fixerId]);

  const fetchFixerDetails = async () => {
    try {
      const res = await fetch(`/api/agent/fixers/${fixerId}`);
      const data = await res.json();

      if (res.ok) {
        setAgentFixer(data.agentFixer);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Error fetching fixer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVetSubmit = async (approved: boolean, notes: string) => {
    const res = await fetch(`/api/agent/fixers/${fixerId}/vet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error);
    }

    setShowVetting(false);
    fetchFixerDetails();
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  if (!agentFixer) {
    return <div style={{ padding: '24px' }}>Fixer not found</div>;
  }

  const fixer = agentFixer.fixer;
  const needsVetting = agentFixer.vetStatus === 'PENDING' && !agentFixer.vetNotes;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: '16px',
          padding: '8px 16px',
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          backgroundColor: colors.white,
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>

      <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
          {fixer.name}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <strong>Email:</strong> {fixer.email}
          </div>
          <div>
            <strong>Phone:</strong> {fixer.phone || 'N/A'}
          </div>
          <div>
            <strong>Vet Status:</strong>{' '}
            <span
              style={{
                backgroundColor: agentFixer.vetStatus === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                color: agentFixer.vetStatus === 'APPROVED' ? '#065F46' : '#92400E',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {agentFixer.vetStatus}
            </span>
          </div>
          {fixer.fixerProfile && (
            <div>
              <strong>Profile Status:</strong>{' '}
              <span
                style={{
                  backgroundColor: fixer.fixerProfile.approvedAt ? '#D1FAE5' : '#FEF3C7',
                  color: fixer.fixerProfile.approvedAt ? '#065F46' : '#92400E',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {fixer.fixerProfile.approvedAt ? 'APPROVED' : 'PENDING'}
              </span>
            </div>
          )}
        </div>

        {agentFixer.vetNotes && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: colors.bgSecondary, borderRadius: '8px' }}>
            <strong>Vetting Notes:</strong>
            <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{agentFixer.vetNotes}</p>
          </div>
        )}

        {needsVetting && !showVetting && (
          <button
            onClick={() => setShowVetting(true)}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: colors.primary,
              color: colors.white,
              cursor: 'pointer',
            }}
          >
            Submit for Admin Approval
          </button>
        )}
      </div>

      {showVetting && (
        <FixerVettingForm
          fixerId={fixerId}
          fixerName={fixer.name}
          onSubmit={handleVetSubmit}
          onCancel={() => setShowVetting(false)}
        />
      )}

      <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
          Services
        </h2>
        {fixer.fixerServices?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {fixer.fixerServices.map((service: any) => (
              <span
                key={service.id}
                style={{
                  padding: '6px 12px',
                  backgroundColor: colors.bgSecondary,
                  borderRadius: '16px',
                  fontSize: '14px',
                }}
              >
                {service.subcategory.category.name} → {service.subcategory.name}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: colors.textLight }}>No services added yet</p>
        )}
      </div>

      {fixer.gigs?.length > 0 && (
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
            Gigs Created
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {fixer.gigs.map((gig: any) => (
              <div
                key={gig.id}
                style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                }}
              >
                <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>{gig.title}</h3>
                <div style={{ fontSize: '14px', color: colors.textLight }}>
                  <span>Status: {gig.status}</span>
                  {gig.subcategory && (
                    <span> • {gig.subcategory.category.name} → {gig.subcategory.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
