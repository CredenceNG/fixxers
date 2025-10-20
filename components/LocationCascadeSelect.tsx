'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { colors, borderRadius } from '@/lib/theme';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LocationCascadeSelectProps {
  value: string; // neighborhoodId
  onChange: (neighborhoodId: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

export default function LocationCascadeSelect({
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  label = 'Location',
  className = '',
}: LocationCascadeSelectProps) {
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState(value || '');

  // Fetch data for each level
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
  const neighborhoods = neighborhoodsData?.neighborhoods || [];

  // Auto-select Nigeria as default country
  useEffect(() => {
    if (countries.length > 0 && !countryId) {
      const nigeria = countries.find((c: any) => c.code === 'NG');
      if (nigeria) {
        setCountryId(nigeria.id);
      }
    }
  }, [countries, countryId]);

  // When neighborhoodId changes externally (e.g., from initial value), update internal state
  useEffect(() => {
    if (value !== neighborhoodId) {
      setNeighborhoodId(value);
    }
  }, [value]);

  // Notify parent when neighborhood changes
  useEffect(() => {
    if (neighborhoodId !== value) {
      onChange(neighborhoodId);
    }
  }, [neighborhoodId, value]);

  const handleCountryChange = (newCountryId: string) => {
    setCountryId(newCountryId);
    setStateId('');
    setCityId('');
    setNeighborhoodId('');
  };

  const handleStateChange = (newStateId: string) => {
    setStateId(newStateId);
    setCityId('');
    setNeighborhoodId('');
  };

  const handleCityChange = (newCityId: string) => {
    setCityId(newCityId);
    setNeighborhoodId('');
  };

  const handleNeighborhoodChange = (newNeighborhoodId: string) => {
    setNeighborhoodId(newNeighborhoodId);
  };

  const selectStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: '14px',
    backgroundColor: colors.white,
    color: colors.textPrimary,
  };

  const disabledSelectStyle = {
    ...selectStyle,
    backgroundColor: colors.bgSecondary,
    cursor: 'not-allowed',
    opacity: 0.6,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: '500' as const,
    color: colors.textSecondary,
  };

  return (
    <div className={className}>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
          {label} {required && <span style={{ color: colors.error }}>*</span>}
        </label>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Country */}
        <div>
          <label htmlFor="country" style={labelStyle}>
            Country
          </label>
          <select
            id="country"
            value={countryId}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled}
            required={required}
            style={disabled ? disabledSelectStyle : selectStyle}
          >
            <option value="">Select Country</option>
            {countries.map((country: any) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" style={labelStyle}>
            State
          </label>
          <select
            id="state"
            value={stateId}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled || !countryId}
            required={required}
            style={(disabled || !countryId) ? disabledSelectStyle : selectStyle}
          >
            <option value="">Select State</option>
            {states.map((state: any) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" style={labelStyle}>
            City/LGA
          </label>
          <select
            id="city"
            value={cityId}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={disabled || !stateId}
            required={required}
            style={(disabled || !stateId) ? disabledSelectStyle : selectStyle}
          >
            <option value="">Select City/LGA</option>
            {cities.map((city: any) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Neighborhood */}
        <div>
          <label htmlFor="neighborhood" style={labelStyle}>
            Neighborhood
          </label>
          <select
            id="neighborhood"
            value={neighborhoodId}
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
            disabled={disabled || !cityId}
            required={required}
            style={(disabled || !cityId) ? disabledSelectStyle : selectStyle}
          >
            <option value="">Select Neighborhood</option>
            {neighborhoods.map((neighborhood: any) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p style={{ marginTop: '8px', fontSize: '14px', color: colors.error }}>{error}</p>}
    </div>
  );
}
