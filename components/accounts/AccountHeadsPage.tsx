
import React, { useState, useEffect } from 'react';
import { AccountHead } from '../../types';
import { PlusIcon, CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';
import AddAccountHeadModal from './AddAccountHeadModal';
import EditAccountHeadModal from './EditAccountHeadModal';
import DeleteConfirmationModal from '../users/DeleteConfirmationModal';
import ConfirmationModal from '../users/ConfirmationModal';

const AccountHeadsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const { hasPermission } = useAuth();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setApproveModalOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<AccountHead | null>(null);

  useEffect(() => {
    fetch('/api/account-heads')
        .then(res => res.json())
        .then(setAccounts);
  }, []);

  const handleApproveConfirm = () => {
    if (selectedAccount) {
      setAccounts(accounts.map(acc => acc.id === selectedAccount.id ? { ...acc, status: 'Active' } : acc));
    }
    setApproveModalOpen(false);
    setSelectedAccount(null);
  };
  
  const handleAddAccount = async (newAccountData: Omit<AccountHead, 'id'>) => {
    const response = await fetch('/api/account-heads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccountData)
    });
    const newAccount = await response.json();
    setAccounts([...accounts, newAccount]);
    setAddModalOpen(false);
  };
  
  const handleUpdateAccount = (updatedAccount: AccountHead) => {
    setAccounts(accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    setEditModalOpen(false);
    setSelectedAccount(null);
  };
  
  const handleDeleteConfirm = () => {
    if (selectedAccount) {
      setAccounts(accounts.filter(acc => acc.id !== selectedAccount.id));
    }
    setDeleteModalOpen(false);
    setSelectedAccount(null);
  };

  const StatusBadge: React.FC<{ status: AccountHead['status'] }> = ({ status }) => {
    const isActive = status === 'Active';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        }`}
      >
        {isActive ? <CheckCircleIcon className="h-4 w-4 mr-1.5" /> : <ClockIcon className="h-4 w-4 mr-1.5" />}
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Account Heads</h1>
        {hasPermission('accounts:create') && (
            <button onClick={() => setAddModalOpen(true)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Account Head
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bank Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{acc.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: {acc.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-300">{acc.bankName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{acc.accountNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={acc.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      {acc.status === 'Pending Approval' && hasPermission('finance:approve') && (
                        <button onClick={() => { setSelectedAccount(acc); setApproveModalOpen(true); }} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          Approve
                        </button>
                      )}
                      {hasPermission('accounts:update') && (
                        <button onClick={() => { setSelectedAccount(acc); setEditModalOpen(true); }} className="text-primary hover:text-primary/80">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                      {hasPermission('accounts:delete') && (
                        <button onClick={() => { setSelectedAccount(acc); setDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {accounts.map(acc => (
            <div key={acc.id} className="p-4">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{acc.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: {acc.id}</div>
                  </div>
                  <StatusBadge status={acc.status} />
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-900 dark:text-gray-300">{acc.bankName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{acc.accountNumber}</div>
              </div>
               <div className="mt-4 flex items-center space-x-4">
                  {acc.status === 'Pending Approval' && hasPermission('finance:approve') &&(
                    <button onClick={() => { setSelectedAccount(acc); setApproveModalOpen(true); }} className="text-sm font-semibold text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                      Approve
                    </button>
                  )}
                  {hasPermission('accounts:update') && (
                    <button onClick={() => { setSelectedAccount(acc); setEditModalOpen(true); }} className="text-primary hover:text-primary/80">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                  {hasPermission('accounts:delete') && (
                    <button onClick={() => { setSelectedAccount(acc); setDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modals */}
      <AddAccountHeadModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleAddAccount} />
      {selectedAccount && <EditAccountHeadModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleUpdateAccount} accountHead={selectedAccount} />}
      {selectedAccount && <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} itemName={selectedAccount.name} itemType="Account Head" />}
      {selectedAccount && <ConfirmationModal isOpen={isApproveModalOpen} onClose={() => setApproveModalOpen(false)} onConfirm={handleApproveConfirm} title="Approve Account Head" message={`Are you sure you want to approve the account head "${selectedAccount.name}"?`} confirmButtonText="Approve" />}

    </div>
  );
};

export default AccountHeadsPage;
