
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { FinancialDataPoint } from '../../types';

interface FinancialChartProps {
  data: FinancialDataPoint[];
}

const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
        <div className="flex items-center justify-center h-full min-h-[250px] text-gray-500 dark:text-gray-400">
            No financial data available for this period.
        </div>
    );
  }
  
  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 20,
                    left: -10,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                <YAxis tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        borderColor: '#334155',
                        color: '#e2e8f0'
                    }} 
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default FinancialChart;