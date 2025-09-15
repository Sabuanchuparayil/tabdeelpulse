import React, { useState, useEffect, useCallback } from 'react';
import { Project } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';
import AddProjectModal from './AddProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteConfirmationModal from '../users/DeleteConfirmationModal';
import { backendUrl } from '../../config';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProjects([]); // Clear current data before fetching
      const response = await fetch(`${backendUrl}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAddProject = async (newProjectData: Omit<Project, 'id'>) => {
    try {
      const response = await fetch(`${backendUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProjectData)
      });
      if (!response.ok) throw new Error('Failed to add project');
      fetchProjects();
      setAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      const response = await fetch(`${backendUrl}/api/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject)
      });
      if (!response.ok) throw new Error('Failed to update project');
      fetchProjects();
      setEditModalOpen(false);
      setSelectedProject(null);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      try {
        const response = await fetch(`${backendUrl}/api/projects/${selectedProject.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete project');
        fetchProjects();
        setDeleteModalOpen(false);
        setSelectedProject(null);
      } catch (err) {
        console.error(err);
      }
    }
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
        {isLoading && <div className="p-4 text-center">Loading projects...</div>}
        {error && <div className="p-4 text-center text-red-500">Error: {error}</div>}
        {!isLoading && !error && (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Name</th>
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
                    <div className="mt-4 flex justify-end items-center">
                        <div className="flex items-center space-x-4">
                        {hasPermission('projects:update') && <button onClick={() => { setSelectedProject(proj); setEditModalOpen(true); }} className="text-primary hover:text-primary/80"><PencilIcon className="h-5 w-5"/></button>}
                        {hasPermission('projects:delete') && <button onClick={() => { setSelectedProject(proj); setDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            </>
        )}
      </div>

      <AddProjectModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleAddProject} />
      {selectedProject && <EditProjectModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleUpdateProject} project={selectedProject}/>}
      {selectedProject && <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} itemName={selectedProject.name} itemType="Project"/>}
    </div>
  );
};

export default ProjectsPage;