
import React, { useState, useMemo, useEffect } from 'react';
import { ServiceJob, JobStatus } from '../../types';
import JobDetailsModal from './JobDetailsModal';
import CreateJobModal from './CreateJobModal';
import { PlusIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';

const PriorityBadge: React.FC<{ priority: ServiceJob['priority'] }> = ({ priority }) => {
    const colors = {
        High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority]}`}>{priority}</span>;
};

const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
    const colors = {
        Assigned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        Completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        Resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>;
};

type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'project' | 'priority' | 'status';

const ServiceJobsPage: React.FC = () => {
    const [jobs, setJobs] = useState<ServiceJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<ServiceJob | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    // State for filters and sorting
    const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<ServiceJob['priority'] | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>(null);

    useEffect(() => {
        fetch('/api/service-jobs')
            .then(res => res.json())
            .then(setJobs);
    }, []);

    const handleSelectJob = (job: ServiceJob) => {
        setSelectedJob(job);
    };

    const handleCloseModal = () => {
        setSelectedJob(null);
    };
    
    const handleAddJob = async (newJobData: Omit<ServiceJob, 'id' | 'status'>) => {
        const response = await fetch('/api/service-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newJobData)
        });
        const newJob = await response.json();
        setJobs(prevJobs => [newJob, ...prevJobs]);
        setCreateModalOpen(false);
    };
    
    const filteredAndSortedJobs = useMemo(() => {
        let filteredJobs = [...jobs];

        if (statusFilter !== 'all') {
            filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
        }
        if (priorityFilter !== 'all') {
            filteredJobs = filteredJobs.filter(job => job.priority === priorityFilter);
        }

        if (sortConfig !== null) {
            const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
            filteredJobs.sort((a, b) => {
                let aValue: string | number = a[sortConfig.key];
                let bValue: string | number = b[sortConfig.key];
                
                if (sortConfig.key === 'priority') {
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredJobs;
    }, [jobs, statusFilter, priorityFilter, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
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
        <div className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Service Jobs</h1>
                <button 
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New Job
                </button>
            </div>
            
             {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
                        className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                    <select
                        id="priority-filter"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as ServiceJob['priority'] | 'all')}
                        className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                        <option value="all">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Job / ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <button onClick={() => requestSort('project')} className="flex items-center focus:outline-none">
                                        Project
                                        <SortIndicator columnKey="project" />
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned To</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <button onClick={() => requestSort('priority')} className="flex items-center focus:outline-none">
                                        Priority
                                        <SortIndicator columnKey="priority" />
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <button onClick={() => requestSort('status')} className="flex items-center focus:outline-none">
                                        Status
                                        <SortIndicator columnKey="status" />
                                    </button>
                                </th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAndSortedJobs.map((job) => (
                                <tr key={job.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{job.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{job.project}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img src={job.technician.avatarUrl} alt={job.technician.name} className="h-8 w-8 rounded-full object-cover"/>
                                            <div className="ml-3 text-sm text-gray-600 dark:text-gray-300">{job.technician.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={job.priority} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={job.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleSelectJob(job)} className="text-primary hover:text-primary/80">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAndSortedJobs.map(job => (
                        <div key={job.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{job.id}</p>
                                </div>
                                <PriorityBadge priority={job.priority} />
                            </div>
                            <div className="mt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300">{job.project}</p>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <div className="flex items-center">
                                    <img src={job.technician.avatarUrl} alt={job.technician.name} className="h-8 w-8 rounded-full object-cover"/>
                                    <div className="ml-3 text-sm text-gray-600 dark:text-gray-300">{job.technician.name}</div>
                                </div>
                                <StatusBadge status={job.status} />
                            </div>
                            <div className="mt-4 text-right">
                                <button onClick={() => handleSelectJob(job)} className="text-sm font-medium text-primary hover:text-primary/80">
                                    View Details &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {selectedJob && (
                <JobDetailsModal
                    job={selectedJob}
                    isOpen={!!selectedJob}
                    onClose={handleCloseModal}
                />
            )}
            
            <CreateJobModal 
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onAddJob={handleAddJob}
            />
        </div>
    );
};

export default ServiceJobsPage;
