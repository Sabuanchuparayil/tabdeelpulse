import React from 'react';
import type { Kpi } from '../../types';
import { ArrowUpIcon, ArrowDownIcon } from '../icons/Icons';

interface KpiCardProps {
  kpi: Kpi;
  onClick: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ kpi, onClick }) => {
  const isIncrease = kpi.changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-500' : 'text-red-500';
  
  return (
    <button
      onClick={onClick}
      disabled={!kpi.link}
      className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-start justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:shadow-lg hover:-translate-y-1 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
    >
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{kpi.value}</p>
        {kpi.change && kpi.changeType && (
          <div className="flex items-center mt-2 text-sm">
            <span className={`flex items-center font-semibold ${changeColor}`}>
              {isIncrease ? <ArrowUpIcon className="h-4 w-4 mr-1"/> : <ArrowDownIcon className="h-4 w-4 mr-1"/>}
              {kpi.change}
            </span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">vs last month</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default KpiCard;