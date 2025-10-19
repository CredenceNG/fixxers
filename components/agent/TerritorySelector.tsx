'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';

interface Neighborhood {
  id: string;
  name: string;
  city: {
    id: string;
    name: string;
    state: string;
  };
}

interface TerritorySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function TerritorySelector({
  selectedIds,
  onChange,
}: TerritorySelectorProps) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        fetch('/api/neighborhoods'),
        fetch('/api/cities'),
      ]);
      const nData = await nRes.json();
      const cData = await cRes.json();

      setNeighborhoods(nData.neighborhoods || []);
      setCities(cData.cities || []);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filteredNeighborhoods = neighborhoods.filter((n) => {
    const matchesCity = !selectedCity || n.city.id === selectedCity;
    const matchesSearch =
      !search ||
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.city.name.toLowerCase().includes(search.toLowerCase());
    return matchesCity && matchesSearch;
  });

  if (loading) {
    return <div>Loading neighborhoods...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search neighborhoods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '14px',
          }}
        />
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{
            padding: '10px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}, {city.state}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '8px',
        }}
      >
        {filteredNeighborhoods.map((neighborhood) => (
          <label
            key={neighborhood.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              cursor: 'pointer',
              borderRadius: '4px',
              marginBottom: '4px',
              backgroundColor: selectedIds.includes(neighborhood.id)
                ? `${colors.primary}10`
                : 'transparent',
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(neighborhood.id)}
              onChange={() => handleToggle(neighborhood.id)}
              style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 500, color: colors.textPrimary }}>
                {neighborhood.name}
              </div>
              <div style={{ fontSize: '12px', color: colors.textLight }}>
                {neighborhood.city.name}, {neighborhood.city.state}
              </div>
            </div>
          </label>
        ))}
        {filteredNeighborhoods.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: colors.textLight }}>
            No neighborhoods found
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', fontSize: '14px', color: colors.textLight }}>
        {selectedIds.length} neighborhood{selectedIds.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
}
