import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PaymentInstruction } from '../../types';
import { PlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon, DocumentDuplicateIcon, EllipsisVerticalIcon, HandThumbUpIcon, HandThumbDownIcon, BellAlertIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import NewPaymentInstructionModal from './NewPaymentInstructionModal';
import { useAuth } from '../../hooks/useAuth';
import TransactionDetailsModal from './TransactionDetailsModal';
import { backendUrl } from '../../config';

type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'dueDate' | 'amount';

const PaymentInstructionsTab: React.FC = () => {
    const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>({ key: 'dueDate', direction: 'descending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedInstruction, setSelectedInstruction] = useState<PaymentInstruction | null>(null);
    const { user, hasPermission } = useAuth();

    const fetchInstructions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // NOTE: The following data fetching is temporarily disabled to clear the view
            // of demo data for the go-live. The backend database should be cleared,
            // and then this code can be uncommented to show live data.
            /*
            const response = await fetch(`${backendUrl}/api/finance/payment-instructions`);
            if (!response.ok) throw new Error('Failed to fetch payment instructions');
            const data = await response.json();
            setInstructions(data);
            */
           setInstructions([]); // Clear sample data
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInstructions();
    }, [fetchInstructions]);

    const sortedInstructions = useMemo(() => {
        let sortableItems = [...instructions];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'dueDate') {
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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
    }, [instructions, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
        if (!user) return;
        const instruction = instructions.find(inst => inst.id === id);
        if (!instruction) return;
        
        const updatedHistory = [...instruction.history, { status: newStatus, user: user.name, timestamp: new Date().toLocaleString() }];

        try {
             const response = await fetch(`${backendUrl}/api/finance/payment-instructions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, history: updatedHistory }),
            });
            if (!response.ok) throw new Error('Failed to update instruction status');
            fetchInstructions();
        } catch (err) {
            console.error(err);
        }
    }
    
    const handleViewDetails = (instruction: PaymentInstruction) => {
        setSelectedInstruction(instruction);
        setDetailsModalOpen(true);
    };

    const handleAddInstruction = async (data: Omit<PaymentInstruction, 'id' | 'status' | 'currency' | 'submittedBy' | 'history'>) => {
        if (!user) return;
        try {
            const response = await fetch(`${backendUrl}/api/finance/payment-instructions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, submittedBy: user.name }),
            });
            if (!response.ok) throw new Error('Failed to add instruction');
            fetchInstructions();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

  const StatusBadge: React.FC<{ status: PaymentInstruction['status'] }> = ({ status }) => {
    let icon, colors;
    switch (status) {
      case 'Approved':
        icon = <CheckCircleIcon className="h-4 w-4 mr-1.5" />;
        colors = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        break;
      case 'Rejected':
        icon = <XCircleIcon className="h-4 w-4 mr-1.5" />;
        colors = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        break;
      default:
        icon = <ClockIcon className="h-4 w-4 mr-1.5" />;
        colors = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>{icon}{status}</span>;
  };

  const SortIndicator: React.FC<{ columnKey: SortableKeys }> = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
        return <ChevronUpDownIcon className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'ascending' ? 
        <ChevronUpIcon className="h-4 w-4 ml-1" /> : 
        <ChevronDownIcon className="h-4 w-4 ml-1" />;
  };

  const Actions: React.FC<{inst: PaymentInstruction}> = ({ inst }) => {
    const canApprove = hasPermission('finance:approve') && inst.amount <= user!.financialLimit;

    if (inst.status === 'Pending' && canApprove) {
      return (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleAction(inst.id, 'Approved')} className="p-2 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"><HandThumbUpIcon className="h-5 w-5"/></button>
          <button onClick={() => handleAction(inst.id, 'Rejected')} className="p-2 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"><HandThumbDownIcon className="h-5 w-5"/></button>
          <button onClick={() => handleViewDetails(inst)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"><EllipsisVerticalIcon className="h-5 w-5"/></button>
        </div>
      );
    }
    return <button onClick={() => handleViewDetails(inst)} className="text-primary hover:text-primary/80 text-sm font-medium">View Details</button>;
  };

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Payment Instruction
        </button>
      </div>
      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
        {isLoading && <div className="p-4 text-center">Loading instructions...</div>}
        {error && <div className="p-4 text-center text-red-500">Error: {error}</div>}
        {!isLoading && !error && (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Instruction ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <button onClick={() => requestSort('amount')} className="flex items-center focus:outline-none">
                                Amount
                                <SortIndicator columnKey="amount" />
                            </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <button onClick={() => requestSort('dueDate')} className="flex items-center focus:outline-none">
                                Due Date
                                <SortIndicator columnKey="dueDate" />
                            </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Repeating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Next Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedInstructions.map(inst => (
                        <tr key={inst.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{inst.id}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">By: {inst.submittedBy}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{inst.payee}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white font-semibold">{inst.amount.toFixed(2)} {inst.currency}</div>
                            {inst.isRecurring && <div className="text-xs text-blue-500 flex items-center"><DocumentDuplicateIcon className="h-3 w-3 mr-1"/>Recurring</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(inst.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            {inst.isRecurring ? (
                                <div className="flex items-center" title="A reminder will be created 3 days before the due date.">
                                <span className="mr-2">Yes</span>
                                <BellAlertIcon className="h-5 w-5 text-blue-500" />
                                </div>
                            ) : 'No'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {inst.isRecurring && inst.nextDueDate ? (
                                <div>
                                <div className="text-gray-900 dark:text-white font-medium">{new Date(inst.nextDueDate).toLocaleDateString()}</div>
                                <div className="text-gray-500 dark:text-gray-400">{inst.balance?.toFixed(2)} {inst.currency}</div>
                                </div>
                            ) : (
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                            </td>
                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={inst.status} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><Actions inst={inst}/></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedInstructions.map(inst => (
                    <div key={inst.id} className="p-4">
                        <div className="flex justify-between items-start">
                        <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{inst.payee}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{inst.id} by {inst.submittedBy}</div>
                        </div>
                        <StatusBadge status={inst.status} />
                        </div>
                        <div className="mt-2">
                        <div className="text-lg text-gray-900 dark:text-white font-semibold">{inst.amount.toFixed(2)} {inst.currency}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Due: {new Date(inst.dueDate).toLocaleDateString()}</div>
                        </div>
                        {inst.isRecurring && (
                        <div className="mt-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                            <div className="font-semibold text-blue-600 dark:text-blue-400">Recurring Payment</div>
                            <div>Next Due: <span className="font-medium">{inst.nextDueDate ? new Date(inst.nextDueDate).toLocaleDateString() : ''}</span></div>
                            <div>Balance: <span className="font-medium">{inst.balance?.toFixed(2)} {inst.currency}</span></div>
                        </div>
                        )}
                        <div className="mt-4 flex justify-end">
                        <Actions inst={inst} />
                        </div>
                    </div>
                    ))}
                </div>
            </>
        )}
      </div>
      <NewPaymentInstructionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddInstruction={handleAddInstruction}
      />
      {selectedInstruction && (
          <TransactionDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            instruction={selectedInstruction}
          />
      )}
    </div>
  );
};

export default PaymentInstructionsTab;