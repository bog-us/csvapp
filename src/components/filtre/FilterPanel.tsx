import React, { useState } from 'react';
import { useExchangeData } from '../../hooks/useExchangeData';
import Button from '../ui/Button';

interface FilterPanelProps {
  filters: any;
  updateFilters: (filters: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, updateFilters }) => {
  const { getAllNormalizedLocations } = useExchangeData();
  const [localFilters, setLocalFilters] = useState({
    judet: filters.judet || '',
    status: filters.status || 'all',
    dataStart: filters.dataStart || '',
    dataEnd: filters.dataEnd || '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApplyFilters = () => {
    updateFilters(localFilters);
  };
  
  const handleResetFilters = () => {
    const resetFilters = {
      judet: '',
      status: 'all',
      dataStart: '',
      dataEnd: '',
    };
    setLocalFilters(resetFilters);
    updateFilters(resetFilters);
  };
  
  const locations = getAllNormalizedLocations ? getAllNormalizedLocations() : [];
  
  return (
    <div className="filter-panel">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="judet" className="block text-sm font-medium text-gray-700 mb-1">
            Județ / Sector
          </label>
          <select
            id="judet"
            name="judet"
            value={localFilters.judet}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Toate județele/sectoarele</option>
            {locations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={localFilters.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="all">Toate</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="dataStart" className="block text-sm font-medium text-gray-700 mb-1">
            De la data
          </label>
          <input
            type="date"
            id="dataStart"
            name="dataStart"
            value={localFilters.dataStart}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        
        <div>
          <label htmlFor="dataEnd" className="block text-sm font-medium text-gray-700 mb-1">
            Până la data
          </label>
          <input
            type="date"
            id="dataEnd"
            name="dataEnd"
            value={localFilters.dataEnd}
            onChange={handleChange}
            className="input-field"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-4">
        <Button 
          variant="secondary" 
          onClick={handleResetFilters}
        >
          Resetare
        </Button>
        <Button 
          variant="primary" 
          onClick={handleApplyFilters}
        >
          Aplică filtre
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;