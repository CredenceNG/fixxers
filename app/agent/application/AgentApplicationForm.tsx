"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { colors, spacing, borderRadius, shadows, typography } from "@/lib/theme";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AgentApplicationFormProps {
  neighborhoods?: any[]; // Legacy prop, no longer used
}

export default function AgentApplicationForm({ neighborhoods }: AgentApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedNeighborhoodIds, setSelectedNeighborhoodIds] = useState<string[]>([]);

  // Cascading location selection
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");

  // Fetch location data using SWR
  const { data: countriesData } = useSWR('/api/locations/countries', fetcher);
  const { data: statesData } = useSWR(
    countryId ? `/api/locations/states?countryId=${countryId}` : null,
    fetcher
  );
  const { data: citiesData } = useSWR(
    stateId ? `/api/locations/cities?stateId=${stateId}` : null,
    fetcher
  );
  const { data: neighborhoodsData } = useSWR(
    cityId ? `/api/neighborhoods?cityId=${cityId}` : null,
    fetcher
  );

  const countries = countriesData?.countries || [];
  const states = statesData?.states || [];
  const cities = citiesData?.cities || [];
  const availableNeighborhoods = neighborhoodsData?.neighborhoods || [];

  const toggleNeighborhood = (id: string) => {
    setSelectedNeighborhoodIds((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]
    );
  };

  // Get selected neighborhood objects for display
  const selectedNeighborhoodObjects = availableNeighborhoods.filter((n: any) =>
    selectedNeighborhoodIds.includes(n.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }

    if (selectedNeighborhoodIds.length === 0) {
      setError("Please select at least one neighborhood");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/agent/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          requestedNeighborhoodIds: selectedNeighborhoodIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      router.push("/agent/application?success=true");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {error && (
        <div style={{
          borderRadius: borderRadius.md,
          backgroundColor: colors.errorLight,
          padding: spacing.lg,
          border: `1px solid ${colors.error}`,
        }}>
          <p style={{ fontSize: '14px', color: colors.errorDark }}>{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="businessName" style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}>
          Business Name *
        </label>
        <input
          type="text"
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = colors.primary}
          onBlur={(e) => e.target.style.borderColor = colors.border}
          placeholder="Your Agency Name"
          required
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}>
          Select Territory ({selectedNeighborhoodIds.length} neighborhoods selected)
        </label>

        {/* Cascading Dropdowns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
          <div>
            <label htmlFor="country" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}>
              Country
            </label>
            <select
              id="country"
              value={countryId}
              onChange={(e) => {
                setCountryId(e.target.value);
                setStateId('');
                setCityId('');
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '15px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                backgroundColor: colors.white,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Select Country</option>
              {countries.map((country: any) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="state" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}>
              State
            </label>
            <select
              id="state"
              value={stateId}
              onChange={(e) => {
                setStateId(e.target.value);
                setCityId('');
              }}
              disabled={!countryId}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '15px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                backgroundColor: countryId ? colors.white : colors.bgSecondary,
                outline: 'none',
                cursor: countryId ? 'pointer' : 'not-allowed',
                opacity: countryId ? 1 : 0.6,
              }}
            >
              <option value="">Select State</option>
              {states.map((state: any) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}>
              City/LGA
            </label>
            <select
              id="city"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!stateId}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '15px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                backgroundColor: stateId ? colors.white : colors.bgSecondary,
                outline: 'none',
                cursor: stateId ? 'pointer' : 'not-allowed',
                opacity: stateId ? 1 : 0.6,
              }}
            >
              <option value="">Select City/LGA</option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected neighborhoods display */}
        {selectedNeighborhoodIds.length > 0 && (
          <div style={{ marginBottom: spacing.md, display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
            {selectedNeighborhoodObjects.map((n: any) => (
              <span
                key={n.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing.xs} ${spacing.md}`,
                  borderRadius: borderRadius.full,
                  fontSize: '13px',
                  backgroundColor: colors.primaryLight,
                  color: colors.primaryDark,
                  fontWeight: '500',
                  border: `1px solid ${colors.primary}`,
                }}
              >
                {n.name}, {n.city?.name || 'Unknown'}
                <button
                  type="button"
                  onClick={() => toggleNeighborhood(n.id)}
                  style={{
                    marginLeft: spacing.sm,
                    color: colors.primary,
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    lineHeight: '1',
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Neighborhood list */}
        {cityId && (
          <div style={{
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            maxHeight: '320px',
            overflowY: 'auto',
          }}>
            {availableNeighborhoods.map((neighborhood: any) => (
              <label
                key={neighborhood.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: `${spacing.md} ${spacing.lg}`,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.borderLight}`,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgSecondary}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={selectedNeighborhoodIds.includes(neighborhood.id)}
                  onChange={() => toggleNeighborhood(neighborhood.id)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: colors.primary,
                  }}
                />
                <span style={{
                  marginLeft: spacing.md,
                  fontSize: '14px',
                  color: colors.textPrimary,
                }}>
                  {neighborhood.name}
                </span>
              </label>
            ))}
            {availableNeighborhoods.length === 0 && (
              <p style={{
                padding: `${spacing.md} ${spacing.lg}`,
                fontSize: '14px',
                color: colors.textSecondary,
                textAlign: 'center',
              }}>
                No neighborhoods found in selected city
              </p>
            )}
          </div>
        )}

        {!cityId && (
          <div style={{
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: colors.bgSecondary,
          }}>
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              textAlign: 'center',
              margin: 0,
            }}>
              Please select Country, State, and City to view neighborhoods
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            color: colors.textPrimary,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgSecondary}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.white}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            color: colors.white,
            backgroundColor: loading ? colors.gray400 : colors.primary,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = colors.primaryHover;
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
