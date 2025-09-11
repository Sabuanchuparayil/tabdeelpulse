import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';
import AddProjectModal from './AddProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteConfirmationModal from '../users/DeleteConfirmationModal';

// CORRECTED: Define the absolute URL for the backend API
const BASE_API_URL = 'https://tabeel-backend.onrender.com';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { hasPermission } = useAuth();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // CORRECTED: Use absolute URL
    fetch(`${BASE_API_URL}/api/projects`)
      .then(res => res.json())
      .then(data => setProjects(data));
  }, []);

  const handleAddProject = async (newProjectData: Omit<Project, 'id'>) => {
    // CORRECTED: Use absolute URL
    const response = await fetch(`${BASE_API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectData)
    });
    const newProject = await response.json();
    setProjects(prev => [...prev, newProject]);
    setAddModalOpen(false);
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    // CORRECTED: Use absolute URL
    const response = await fetch(`${BASE_API_URL}/api/projects/${updatedProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    });
    const returnedProject = await response.json();
    setProjects(prev => prev.map(p => p.id === returnedProject.id ? returnedProject : p));
    setEditModalOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      // CORRECTED: Use absolute URL
      await fetch(`${BASE_API_URL}/api/projects/${selectedProject.id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
    }
    setDeleteModalOpen(false);
    setSelectedProject(null);
  };


  const StatusBadge: React.FC<{ status: Project['status'] }> = ({ status }) => {
    let colors;
    switch (status) {
      case 'Active':
        colors = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        break;
      case 'On Hold':
        colors = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        break;
      case 'Completed':
        colors = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        break;
      default:
        colors = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>{status}</span>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Projects</h1>
        {hasPermission('projects:create') && (
            <button onClick={() => setAddModalOpen(true)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Project
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map((proj) => (
                <tr key={proj.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{proj.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">PROJ-{proj.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{proj.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={proj.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                        {hasPermission('projects:update') && <button onClick={() => { setSelectedProject(proj); setEditModalOpen(true); }} className="text-primary hover:text-primary/80"><PencilIcon className="h-5 w-5"/></button>}
                        {hasPermission('projects:delete') && <button onClick={() => { setSelectedProject(proj); setDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {projects.map(proj => (
            <div key={proj.id} className="p-4">
              <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{proj.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">PROJ-{proj.id}</div>
                  </div>
                  <StatusBadge status={proj.status} />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Client</div>
                    <div className="text-sm text-gray-900 dark:text-gray-300">{proj.client}</div>
                </div>
                <div className="flex items-center space-x-4">
                  {hasPermission('projects:update') && <button onClick={() => { setSelectedProject(proj); setEditModalOpen(true); }} className="text-primary hover:text-primary/80"><PencilIcon className="h-5 w-5"/></button>}
                  {hasPermission('projects:delete') && <button onClick={() => { setSelectedProject(proj); setDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddProjectModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleAddProject} />
      {selectedProject && <EditProjectModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleUpdateProject} project={selectedProject}/>}
      {selectedProject && <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} itemName={selectedProject.name} itemType="Project"/>}
    </div>
  );
};

export default ProjectsPage;
