
import React from 'react';
import type { ActivityItem } from '../../types';

interface ActivityFeedProps {
  items: ActivityItem[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 py-8">
            No recent activity to display.
        </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {items.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {itemIdx !== items.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-dark-card">
                    <img className="h-full w-full rounded-full object-cover" src={item.user.avatarUrl} alt={item.user.name} />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{item.user.name}</span> {item.action}{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{item.target}</span>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    <time>{item.timestamp}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityFeed;