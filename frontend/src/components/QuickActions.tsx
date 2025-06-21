import React from 'react';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  onClick: () => void;
  disabled?: boolean;
  badge?: string | number;
}

export interface QuickActionsProps {
  onNewTrade: () => void;
  onAnalytics?: () => void;
  onImport?: () => void;
  onPlayBook?: () => void;
  onCalendar?: () => void;
  onExport?: () => void;
  customActions?: QuickAction[];
  layout?: 'grid' | 'list';
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onNewTrade,
  onAnalytics,
  onImport,
  onPlayBook,
  onCalendar,
  onExport,
  customActions = [],
  layout = 'grid'
}) => {
  const getColorClasses = (color: QuickAction['color'], isHovered: boolean = false) => {
    const colorMap = {
      primary: {
        bg: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-white',
        ring: 'focus:ring-blue-500',
        light: 'bg-blue-50 hover:bg-blue-100 text-blue-700'
      },
      secondary: {
        bg: 'bg-gray-600 hover:bg-gray-700',
        text: 'text-white',
        ring: 'focus:ring-gray-500',
        light: 'bg-gray-50 hover:bg-gray-100 text-gray-700'
      },
      success: {
        bg: 'bg-green-600 hover:bg-green-700',
        text: 'text-white',
        ring: 'focus:ring-green-500',
        light: 'bg-green-50 hover:bg-green-100 text-green-700'
      },
      warning: {
        bg: 'bg-orange-600 hover:bg-orange-700',
        text: 'text-white',
        ring: 'focus:ring-orange-500',
        light: 'bg-orange-50 hover:bg-orange-100 text-orange-700'
      },
      info: {
        bg: 'bg-purple-600 hover:bg-purple-700',
        text: 'text-white',
        ring: 'focus:ring-purple-500',
        light: 'bg-purple-50 hover:bg-purple-100 text-purple-700'
      }
    };
    return colorMap[color];
  };

  // Default actions
  const defaultActions: QuickAction[] = [
    {
      id: 'new-trade',
      label: 'New Trade',
      icon: '📝',
      description: 'Record a new trade',
      color: 'primary',
      onClick: onNewTrade
    },
    ...(onAnalytics ? [{
      id: 'analytics',
      label: 'Analytics',
      icon: '📊',
      description: 'View performance metrics',
      color: 'info' as const,
      onClick: onAnalytics
    }] : []),
    ...(onImport ? [{
      id: 'import',
      label: 'Import',
      icon: '📤',
      description: 'Import trade data',
      color: 'secondary' as const,
      onClick: onImport
    }] : []),
    ...(onPlayBook ? [{
      id: 'playbook',
      label: 'PlayBook',
      icon: '📚',
      description: 'Trading strategies',
      color: 'warning' as const,
      onClick: onPlayBook
    }] : []),
    ...(onCalendar ? [{
      id: 'calendar',
      label: 'Calendar',
      icon: '📅',
      description: 'Trade calendar view',
      color: 'success' as const,
      onClick: onCalendar
    }] : []),
    ...(onExport ? [{
      id: 'export',
      label: 'Export',
      icon: '💾',
      description: 'Export trade data',
      color: 'secondary' as const,
      onClick: onExport
    }] : [])
  ];

  const allActions = [...defaultActions, ...customActions];

  const ActionButton: React.FC<{ action: QuickAction; isPrimary?: boolean }> = ({ 
    action, 
    isPrimary = false 
  }) => {
    const colors = getColorClasses(action.color);
    const isNewTrade = action.id === 'new-trade';
    
    return (
      <button
        onClick={action.onClick}
        disabled={action.disabled}
        className={`
          relative group w-full p-4 rounded-lg font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.ring}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isNewTrade || isPrimary 
            ? `${colors.bg} ${colors.text} shadow-md hover:shadow-lg transform hover:-translate-y-0.5` 
            : `${colors.light} border border-gray-200 hover:border-gray-300 hover:shadow-md`
          }
        `}
      >
        {/* Badge */}
        {action.badge && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {action.badge}
          </span>
        )}
        
        <div className="flex flex-col items-center space-y-2">
          {/* Icon */}
          <div className={`text-2xl ${isNewTrade || isPrimary ? 'transform group-hover:scale-110' : ''} transition-transform duration-200`}>
            {action.icon}
          </div>
          
          {/* Label */}
          <div className="text-sm font-semibold">
            {action.label}
          </div>
          
          {/* Description */}
          {action.description && (
            <div className={`text-xs opacity-75 text-center ${layout === 'list' ? 'block' : 'hidden group-hover:block'}`}>
              {action.description}
            </div>
          )}
        </div>

        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150"></div>
      </button>
    );
  };

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {allActions.map((action) => (
            <ActionButton key={action.id} action={action} />
          ))}
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-500">Common trading tasks</p>
        </div>
        <div className="text-2xl">⚡</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {allActions.map((action) => (
          <ActionButton key={action.id} action={action} />
        ))}
      </div>

      {/* Pro tip */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <div className="text-blue-500 text-sm">💡</div>
          <div className="text-xs text-blue-700">
            <span className="font-medium">Pro tip:</span> Use keyboard shortcuts for faster navigation
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;