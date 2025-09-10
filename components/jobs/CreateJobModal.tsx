import React, { useState, FormEvent, useEffect } from 'react';
// FIX: Added Project type for fetched data.
import type { ServiceJob, Project } from '../../types';
import { XMarkIcon } from '../icons/Icons';
// FIX: Removed incorrect import of mockProjects as it is not exported.

const mockTechnicians = [
    { id: 1, name: 'NOUMAN', avatarUrl: 'https://picsum.photos/seed/nouman/40/40' },
    { id: 2, name: 'Benhur', avatarUrl: 'https://picsum.photos/seed/benhur/40/40' },
    { id: 3, name: 'Nakul', avatarUrl: 'https://picsum.photos/seed/nakul/40/40' },
];

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (job: Omit<ServiceJob, 'id' | 'status'>) => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onAddJob }) => {
    const [title, setTitle] = useState('');
    const [project, setProject] = useState('');
    const [technicianName, setTechnicianName] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [errors, setErrors] = useState<{ title?: string; project?: string; technicianName?: string; }>({});
    // FIX: Add state to hold fetched projects.
    const [projects, setProjects] = useState<Project[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            // FIX: Fetch projects from the API when the modal is opened.
            fetch('/api/projects')
                .then(res => res.json())
                .then(setProjects);
            setTitle('');
            setProject('');
            setTechnicianName('');
            setPriority('Medium');
            setErrors({});
        }
    }, [isOpen]);

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!title.trim()) newErrors.title = 'Job title is required.';
        if (!project) newErrors.project = 'Please select a project.';
        if (!technicianName) newErrors.technicianName = 'Please assign a technician.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const selectedTechnician = mockTechnicians.find(t => t.name === technicianName);
            if (selectedTechnician) {
                onAddJob({
                    title,
                    project,
                    technician: selectedTechnician,
                    priority,
                });
            }
        }
    };
    
    if (!isOpen) return null;

    const isFormValid = title.trim() && project && technicianName;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
            <div className="relative inline-block align-bottom bg-white dark:bg-dark-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="bg-white dark:bg-dark-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">Create New Service Job</h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="job-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
                                <input type="text" id="job-title" value={title} onChange={e => setTitle(e.target.value)} required className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                                {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
                            </div>
                            <div>
                                <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
                                <select id="project" value={project} onChange={e => setProject(e.target.value)} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base ${errors.project ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md`}>
                                    <option value="" disabled>Select a project</option>
                                    {/* FIX: Use fetched projects state instead of mock data. */}
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                                {errors.project && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.project}</p>}
                            </div>
                            <div>
                                <label htmlFor="technician" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Technician</label>
                                <select id="technician" value={technicianName} onChange={e => setTechnicianName(e.target.value)} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base ${errors.technicianName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md`}>
                                    <option value="" disabled>Select a technician</option>
                                    {mockTechnicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                                {errors.technicianName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.technicianName}</p>}
                            </div>
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                <select id="priority" value={priority} onChange={e => setPriority(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button type="submit" disabled={!isFormValid} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            Create Job
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

export default CreateJobModal;
