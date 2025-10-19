'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

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
  }, [neighborhoodId, onChange]);

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

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-xs font-medium text-gray-600 mb-1">
            Country
          </label>
          <select
            id="country"
            value={countryId}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <label htmlFor="state" className="block text-xs font-medium text-gray-600 mb-1">
            State
          </label>
          <select
            id="state"
            value={stateId}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled || !countryId}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <label htmlFor="city" className="block text-xs font-medium text-gray-600 mb-1">
            City/LGA
          </label>
          <select
            id="city"
            value={cityId}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={disabled || !stateId}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <label htmlFor="neighborhood" className="block text-xs font-medium text-gray-600 mb-1">
            Neighborhood
          </label>
          <select
            id="neighborhood"
            value={neighborhoodId}
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
            disabled={disabled || !cityId}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
