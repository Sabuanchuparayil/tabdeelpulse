import React, { useState, useMemo, useEffect } from 'react';
import { Deposit } from '../../types';
import { PlusIcon, ArrowDownTrayIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import LogDepositModal from './LogDepositModal';

// CORRECTED: Define the absolute URL for the backend API
const BASE_API_URL = 'https://tabeel-backend.onrender.com';

type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'date' | 'amount';

const DepositsTab: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>({ key: 'date', direction: 'descending' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // CORRECTED: Use absolute URL
    fetch(`${BASE_API_URL}/api/finance/deposits`)
      .then(res => res.json())
      .then(setDeposits);
  }, []);

  const sortedDeposits = useMemo(() => {
    let sortableItems = [...deposits];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            if (sortConfig.key === 'date') {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            if (a[sortConfig.key]! < b[sortConfig.key]!) {
                return -1;
            }
            if (a[sortConfig.key]! > b[sortConfig.key]!) {
                return 1;
            }
            return 0;
        });
        if (sortConfig.direction === 'descending') {
            sortableItems.reverse();
        }
    }
    return sortableItems;
  }, [deposits, sortConfig]);

  const requestSort = (key: SortableKeys) => {
      let direction: SortDirection = 'ascending';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
      }
      setSortConfig({ key, direction });
  };

   const handleAddDeposit = (newDepositData: Omit<Deposit, 'id' | 'status'>) => {
    const newDeposit: Deposit = {
      ...newDepositData,
      id: `D-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
    };
    setDeposits(prev => [newDeposit, ...prev]);
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const filteredData = sortedDeposits.filter(d => {
      if (!startDate || !endDate) return true;
      const depositDate = new Date(d.date);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      return depositDate >= new Date(startDate) && depositDate < end;
    });

    if (filteredData.length === 0) {
      alert("No data available for the selected date range.");
      return;
    }

    const headers = Object.keys(filteredData[0]).join(',');
    const csvContent = filteredData.map(row =>
        Object.values(row).join(',')
    ).join('\n');
    const csvData = `data:text/csv;charset=utf-8,${headers}\n${csvContent}`;

    const encodedUri = encodeURI(csvData);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "deposits_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Exporting ${filteredData.length} deposit records...`);
  };

  const StatusBadge: React.FC<{ status: Deposit['status'] }> = ({ status }) => {
    const isConfirmed = status === 'Confirmed';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isConfirmed
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        }`}
      >
        {status}
      </span>
    );
  };

  const SortIndicator: React.FC<{ columnKey: SortableKeys }> = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
        return <ChevronUpDownIcon className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'ascending' ?
        <ChevronUpIcon className="h-4 w-4 ml-1" /> :
        <ChevronDownIcon className="h-4 w-4 ml-1" />;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary"/>
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary"/>
          <button onClick={handleExport} className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
        <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
          <PlusIcon className="h-5 w-5 mr-2" />
          Log Deposit
        </button>
      </div>
      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deposit ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Head</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => requestSort('amount')} className="flex items-center focus:outline-none">
                        Amount (AED)
                        <SortIndicator columnKey="amount" />
                    </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => requestSort('date')} className="flex items-center focus:outline-none">
                        Date
                        <SortIndicator columnKey="date" />
                    </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {sortedDeposits.map(dep => (
                <tr key={dep.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{dep.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{dep.accountHead}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{dep.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(dep.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={dep.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {sortedDeposits.map(dep => (
            <div key={dep.id} className="p-4">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{dep.accountHead}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {dep.id}</div>
                  </div>
                  <StatusBadge status={dep.status} />
              </div>
              <div className="mt-2 flex justify-between items-baseline">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{dep.amount.toFixed(2)} AED</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(dep.date).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LogDepositModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddDeposit={handleAddDeposit}
      />
    </div>
  );
};

export default DepositsTab;
