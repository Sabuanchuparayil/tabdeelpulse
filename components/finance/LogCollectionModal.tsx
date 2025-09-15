import React, { useState, FormEvent, useEffect } from 'react';
import type { Collection, Project } from '../../types';
import { XMarkIcon } from '../icons/Icons';
import DocumentUpload from './DocumentUpload';

interface LogCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCollection: (collection: Omit<Collection, 'id' | 'status'>) => void;
  projects: Project[];
}

const LogCollectionModal: React.FC<LogCollectionModalProps> = ({ isOpen, onClose, onAddCollection, projects }) => {
    const [project, setProject] = useState('');
    const [payer, setPayer] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [type, setType] = useState<'Cash' | 'Cheque'>('Cash');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [outstandingAmount, setOutstandingAmount] = useState<number | ''>('');
    const [document, setDocument] = useState<File | null>(null);
    const [errors, setErrors] = useState<{ project?: string; payer?: string; amount?: string; date?: string; }>({});

    useEffect(() => {
        if (isOpen) {
            setProject('');
            setPayer('');
            setAmount('');
            setType('Cash');
            setDate(new Date().toISOString().split('T')[0]);
            setOutstandingAmount('');
            setDocument(null);
            setErrors({});
        }
    }, [isOpen]);

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!project) newErrors.project = 'Project is required.';
        if (!payer.trim()) newErrors.payer = 'Payer name is required.';
        if (!amount || amount <= 0) newErrors.amount = 'A valid amount is required.';
        if (!date) newErrors.date = 'Collection date is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onAddCollection({
                project,
                payer,
                amount: Number(amount),
                type,
                date,
                outstandingAmount: outstandingAmount ? Number(outstandingAmount) : undefined,
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
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">Log New Collection</h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                             <div>
                                <label htmlFor="collection-project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
                                <select id="collection-project" value={project} onChange={e => setProject(e.target.value)} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base ${errors.project ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md`}>
                                    <option value="" disabled>Select a project</option>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                                {errors.project && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.project}</p>}
                            </div>
                            <div>
                                <label htmlFor="payer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payer</label>
                                <input type="text" id="payer" value={payer} onChange={e => setPayer(e.target.value.replace(/[0-9]/g, ''))} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.payer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.payer && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.payer}</p>}
                            </div>
                             <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (AED)</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(Number(e.target.value))} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
                            </div>
                            <div>
                                <label htmlFor="outstandingAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Outstanding Amount (Optional)</label>
                                <input type="number" id="outstandingAmount" value={outstandingAmount} onChange={e => setOutstandingAmount(Number(e.target.value))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                <fieldset className="mt-2 flex space-x-4">
                                    <div className="flex items-center"><input type="radio" id="cash" name="type" value="Cash" checked={type === 'Cash'} onChange={() => setType('Cash')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300"/><label htmlFor="cash" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Cash</label></div>
                                    <div className="flex items-center"><input type="radio" id="cheque" name="type" value="Cheque" checked={type === 'Cheque'} onChange={() => setType('Cheque')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300"/><label htmlFor="cheque" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Cheque</label></div>
                                </fieldset>
                             </div>
                             <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Collection Date</label>
                                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
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
                            Log Collection
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

export default LogCollectionModal;