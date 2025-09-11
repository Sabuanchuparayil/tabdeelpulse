import React, { useState, FormEvent, useEffect } from 'react';
// FIX: Added AccountHead type for fetched data.
import type { Deposit, AccountHead } from '../../types';
import { XMarkIcon } from '../icons/Icons';
// FIX: Removed incorrect import of mockAccountHeads as it is not exported.
import DocumentUpload from './DocumentUpload';

// CORRECTED: Define the absolute URL for the backend API
const BASE_API_URL = 'https://tabeel-backend.onrender.com';

interface LogDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDeposit: (deposit: Omit<Deposit, 'id' | 'status'>) => void;
}

const LogDepositModal: React.FC<LogDepositModalProps> = ({ isOpen, onClose, onAddDeposit }) => {
    const [accountHead, setAccountHead] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [document, setDocument] = useState<File | null>(null);
    const [errors, setErrors] = useState<{ accountHead?: string; amount?: string; date?: string; }>({});
    // FIX: Add state to hold fetched account heads.
    const [accountHeads, setAccountHeads] = useState<AccountHead[]>([]);

    useEffect(() => {
        if (isOpen) {
            // CORRECTED: Fetch account heads from the absolute API URL
            fetch(`${BASE_API_URL}/api/account-heads`).then(res => res.json()).then(setAccountHeads);
            setAccountHead('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setDocument(null);
            setErrors({});
        }
    }, [isOpen]);

    const activeAccountHeads = accountHeads.filter(acc => acc.status === 'Active');

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!accountHead) newErrors.accountHead = 'Account Head is required.';
        if (!amount || amount <= 0) newErrors.amount = 'A valid amount is required.';
        if (!date) newErrors.date = 'Deposit date is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onAddDeposit({
                accountHead,
                amount: Number(amount),
                date,
                document: document ?? undefined,
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
            <div className="relative inline-block align-bottom bg-white dark:bg-dark-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="bg-white dark:bg-dark-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">Log New Deposit</h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                             <div>
                                <label htmlFor="deposit-account-head" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Head</label>
                                <select id="deposit-account-head" value={accountHead} onChange={e => setAccountHead(e.target.value)} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base ${errors.accountHead ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md`}>
                                    <option value="" disabled>Select an account</option>
                                    {activeAccountHeads.map(acc => <option key={acc.id} value={acc.name}>{acc.name} ({acc.bankName})</option>)}
                                </select>
                                {errors.accountHead && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.accountHead}</p>}
                            </div>
                            <div>
                                <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (AED)</label>
                                <input type="number" id="deposit-amount" value={amount} onChange={e => setAmount(Number(e.target.value))} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
                            </div>
                             <div>
                                <label htmlFor="deposit-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit Date</label>
                                <input type="date" id="deposit-date" value={date} onChange={e => setDate(e.target.value)} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supporting Document</label>
                                <DocumentUpload onFileSelect={setDocument} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                            Log Deposit
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogDepositModal;
