import React, { useState, useEffect } from 'react';
import KpiCard from './KpiCard';
import FinancialChart from './FinancialChart';
import ActivityFeed from './ActivityFeed';
import type { Kpi, Announcement, PaymentInstruction, ServiceJob, Collection, FinancialDataPoint, ActivityItem } from '../../types';
import { MegaphoneIcon } from '../icons/Icons';
import { backendUrl } from '../../config';

interface DashboardPageProps {
  onNavigate: (pageId: string) => void;
  announcements: Announcement[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, announcements }) => {
    // State for existing KPIs
    const [collections, setCollections] = useState<Collection[]>([]);
    const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
    const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);
    
    // State for restored components
    const [financialData, setFinancialData] = useState<FinancialDataPoint[]>([]);
    const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const results = await Promise.allSettled([
                    fetch(`${backendUrl}/api/finance/collections`),
                    fetch(`${backendUrl}/api/finance/payment-instructions`),
                    fetch(`${backendUrl}/api/service-jobs`),
                    // The following endpoints are placeholders and may fail until implemented
                    // fetch(`${backendUrl}/api/finance/overview`),
                    // fetch(`${backendUrl}/api/activity`),
                    // fetch(`${backendUrl}/api/messages/unread-count`),
                ]);

                const [colRes, instRes, jobRes] = results;

                if (colRes.status === 'fulfilled' && colRes.value.ok) {
                    const colData = await colRes.value.json();
                    setCollections(colData);
                } else {
                    console.warn('Dashboard Warning: Failed to fetch collections data.', colRes.status === 'rejected' ? colRes.reason : colRes.value.statusText);
                }

                if (instRes.status === 'fulfilled' && instRes.value.ok) {
                    const instData = await instRes.value.json();
                    setInstructions(instData);
                } else {
                    console.warn('Dashboard Warning: Failed to fetch payment instructions data.', instRes.status === 'rejected' ? instRes.reason : instRes.value.statusText);
                }
                
                if (jobRes.status === 'fulfilled' && jobRes.value.ok) {
                    const jobData = await jobRes.value.json();
                    setServiceJobs(jobData);
                } else {
                    console.warn('Dashboard Warning: Failed to fetch service jobs data.', jobRes.status === 'rejected' ? jobRes.reason : jobRes.value.statusText);
                }

                // Mock data until backend is ready for these
                setFinancialData([
                    { name: 'Jan', income: 4000, expenses: 2400 },
                    { name: 'Feb', income: 3000, expenses: 1398 },
                    { name: 'Mar', income: 2000, expenses: 9800 },
                    { name: 'Apr', income: 2780, expenses: 3908 },
                    { name: 'May', income: 1890, expenses: 4800 },
                    { name: 'Jun', income: 2390, expenses: 3800 },
                ]);
                setActivityItems([]);
                setUnreadMessagesCount(0);


            } catch (err: any) {
                // This catch is for more critical, unexpected errors.
                console.error("Dashboard critical fetch error:", err);
                setError("A critical error occurred while loading the dashboard.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    }

    // Calculate KPIs dynamically
    const totalCollections = collections.reduce((sum, c) => sum + c.amount, 0);
    const pendingApprovals = instructions.filter(i => i.status === 'Pending');
    const pendingApprovalsCount = pendingApprovals.length;
    const pendingApprovalsValue = pendingApprovals.reduce((sum, i) => sum + i.amount, 0);
    const activeJobsCount = serviceJobs.filter(j => j.status === 'In Progress' || j.status === 'Assigned').length;

    const kpiData: Kpi[] = [
        {
            title: 'Total Collections',
            value: `AED ${totalCollections.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            link: 'finance',
        },
        {
            title: 'Pending Approvals',
            value: `${pendingApprovalsCount} (AED ${pendingApprovalsValue.toLocaleString()})`,
            link: 'finance',
        },
        {
            title: 'Active Service Jobs',
            value: String(activeJobsCount),
            link: 'service-jobs',
        },
        {
            title: 'Unread Messages',
            value: String(unreadMessagesCount),
            link: 'messages',
        },
    ];

  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h1>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {kpiData.map((kpi, index) => <KpiCard key={index} kpi={kpi} onClick={() => kpi.link && onNavigate(kpi.link)} />)}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Financial Overview */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-lg shadow-md min-h-[300px]">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Financial Overview</h2>
            <FinancialChart data={financialData} />
          </div>

          {/* Right Column for Feeds */}
          <div className="space-y-8">
            {/* Announcements Feed */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Announcements</h2>
                  <button onClick={() => onNavigate('announcements')} className="text-sm font-medium text-primary hover:text-primary/80">
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {announcements && announcements.length > 0 ? (
                    announcements.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MegaphoneIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.content}</p>
                      </div>
                    </div>
                  ))
                  ) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400">No recent announcements.</p>
                  )}
                </div>
            </div>
            
            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md min-h-[200px]">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
              <ActivityFeed items={activityItems} />
            </div>
          </div>
        </div>
    </div>
  );
};

export default DashboardPage;