import React from 'react';
import { DateFinanciareType } from '../../types';

interface RandDateFinanciareProps {
  data: DateFinanciareType;
}

const RandDateFinanciare: React.FC<RandDateFinanciareProps> = ({ data }) => {
  // Formatează valori financiare
  const formatCurrency = (value: any): string => {
    if (value === undefined || value === null || value === '') return '-';
    
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    return numericValue.toLocaleString('ro-RO', {
      maximumFractionDigits: 0
    }) + ' RON';
  };
  
  return (
    <div className="grid grid-cols-6 gap-4 py-4 px-6 border-b border-gray-200">
      <div className="text-sm font-medium text-gray-900 truncate">
        {data["DENUMIRE"]}
      </div>
      <div className="text-sm text-gray-500">
        {data["AN DE REFERINTA"]}
      </div>
      <div className={`text-sm ${
        parseFloat(data["PROFIT_PIERDERE"] || '0') >= 0 
          ? 'text-green-600' 
          : 'text-red-600'
      }`}>
        {formatCurrency(data["PROFIT_PIERDERE"])}
      </div>
      <div className="text-sm text-gray-500">
        {formatCurrency(data["INCASARI LA BUGETUL GENESAL CONSOLIDAT"])}
      </div>
      <div className="text-sm text-gray-500">
        {data["NR_MEDIU SALARIATI"] || '-'}
      </div>
      <div className="text-sm text-gray-500">
        {formatCurrency(data["FOND_SALARII"])}
      </div>
    </div>
  );
};

export default RandDateFinanciare;