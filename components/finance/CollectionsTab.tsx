
import React, { useState, useMemo, useEffect } from 'react';
import { Collection } from '../../types';
import { PlusIcon, ArrowDownTrayIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import LogCollectionModal from './LogCollectionModal';

type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'date' | 'amount';

const CollectionsTab: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>({ key: 'date', direction: 'descending' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/finance/collections')
      .then(res => res.json())
      .then(setCollections);
  }, []);

  const sortedCollections = useMemo(() => {
    let sortableItems = [...collections];
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
  }, [collections, sortConfig]);

  const requestSort = (key: SortableKeys) => {
      let direction: SortDirection = 'ascending';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
      }
      setSortConfig({ key, direction });
  };
  
  const handleAddCollection = (newCollectionData: Omit<Collection, 'id' | 'status'>) => {
    const newCollection: Collection = {
      ...newCollectionData,
      id: `C-${Date.now().toString().slice(-4)}`,
      status: 'Collected',
    };
    setCollections(prev => [newCollection, ...prev]);
    setIsModalOpen(false);
  };


  const handleExport = () => {
    // In a real app, this would trigger a CSV download.
    const filteredData = sortedCollections.filter(c => {
      if (!startDate || !endDate) return true; // No filter if dates are not set
      const collectionDate = new Date(c.date);
      // Add one day to end date to include the whole day
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      return collectionDate >= new Date(startDate) && collectionDate < end;
    });

    if (filteredData.length === 0) {
      alert("No data available for the selected date range.");
      return;
    }
    
    // Simple CSV generation
    const headers = Object.keys(filteredData[0]).join(',');
    const csvContent = filteredData.map(row => 
        Object.values(row).join(',')
    ).join('\n');
    const csvData = `data:text/csv;charset=utf-8,${headers}\n${csvContent}`;

    // Create a temporary link to trigger the download
    const encodedUri = encodeURI(csvData);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "collections_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Exporting ${filteredData.length} collection records...`);
  };
    
  const StatusBadge: React.FC<{ status: Collection['status'] }> = ({ status }) => {
    const isDeposited = status === 'Deposited';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isDeposited
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
          Log Collection
        </button>
      </div>
      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Collection ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project / Payer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button onClick={() => requestSort('amount')} className="flex items-center focus:outline-none">
                        Amount (AED)
                        <SortIndicator columnKey="amount" />
                    </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Outstanding Amount (AED)</th>
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
              {sortedCollections.map(col => (
                <tr key={col.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{col.id}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{col.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-300">{col.project}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{col.payer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{col.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">{col.outstandingAmount?.toFixed(2) ?? 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(col.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={col.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {sortedCollections.map(col => (
              <div key={col.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{col.project}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{col.payer}</div>
                  </div>
                  <StatusBadge status={col.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{col.amount.toFixed(2)}</div>
                  </div>
                   <div>
                    <div className="text-xs text-gray-500">Outstanding</div>
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">{col.outstandingAmount?.toFixed(2) ?? 'N/A'}</div>
                  </div>
                   <div>
                    <div className="text-xs text-gray-500">Date</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(col.date).toLocaleDateString()}</div>
                  </div>
                   <div>
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{col.type} ({col.id})</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
       <LogCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCollection={handleAddCollection}
      />
    </div>
  );
};

export default CollectionsTab;
