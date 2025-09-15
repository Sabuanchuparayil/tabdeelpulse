import React, { useState, FormEvent, useEffect } from 'react';
import type { PaymentInstruction } from '../../types';
import { XMarkIcon } from '../icons/Icons';

interface NewPaymentInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInstruction: (instruction: Omit<PaymentInstruction, 'id' | 'status' | 'currency' | 'submittedBy' | 'history'>) => void;
}

const NewPaymentInstructionModal: React.FC<NewPaymentInstructionModalProps> = ({ isOpen, onClose, onAddInstruction }) => {
    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [nextDueDate, setNextDueDate] = useState('');
    const [balance, setBalance] = useState<number | ''>('');

    const [errors, setErrors] = useState<{ payee?: string; amount?: string; dueDate?: string; nextDueDate?: string; balance?: string; }>({});

    useEffect(() => {
        if (isOpen) {
            setPayee('');
            setAmount('');
            setDueDate(new Date().toISOString().split('T')[0]);
            setIsRecurring(false);
            setNextDueDate('');
            setBalance('');
            setErrors({});
        }
    }, [isOpen]);

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!payee.trim()) newErrors.payee = 'Payee name is required.';
        if (!amount || amount <= 0) newErrors.amount = 'A valid positive amount is required.';
        if (!dueDate) newErrors.dueDate = 'Due date is required.';
        if (isRecurring) {
            if (!nextDueDate) newErrors.nextDueDate = 'Next due date is required for recurring payments.';
            if (balance === '' || balance < 0) newErrors.balance = 'A valid balance is required for recurring payments.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onAddInstruction({
                payee,
                amount: Number(amount),
                dueDate,
                isRecurring,
                nextDueDate: isRecurring ? nextDueDate : undefined,
                balance: isRecurring ? Number(balance) : undefined,
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
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">New Payment Instruction</h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="payee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payee</label>
                                <input type="text" id="payee" value={payee} onChange={e => setPayee(e.target.value.replace(/[0-9]/g, ''))} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.payee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.payee && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.payee}</p>}
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (AED)</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(Number(e.target.value))} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
                            </div>
                            <div>
                                <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                                <input type="date" id="due-date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.dueDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dueDate}</p>}
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input id="is-recurring" name="is-recurring" type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded" />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="is-recurring" className="font-medium text-gray-700 dark:text-gray-300">Recurring Payment</label>
                                    <p className="text-gray-500 dark:text-gray-400">Is this a repeating payment instruction?</p>
                                </div>
                            </div>
                            {isRecurring && (
                                <>
                                    <div>
                                        <label htmlFor="next-due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Next Due Date</label>
                                        <input type="date" id="next-due-date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.nextDueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                        {errors.nextDueDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nextDueDate}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Balance Amount (AED)</label>
                                        <input type="number" id="balance" value={balance} onChange={e => setBalance(Number(e.target.value))} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.balance ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                        {errors.balance && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.balance}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                            Create Instruction
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

export default NewPaymentInstructionModal;