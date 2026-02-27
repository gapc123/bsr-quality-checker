interface PackStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  client_review: {
    label: 'Client Review',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  revision_needed: {
    label: 'Revision Needed',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-300',
  },
  archived: {
    label: 'Archived',
    color: 'bg-slate-100 text-slate-500 border-slate-300',
  },
};

export default function PackStatusBadge({ status, size = 'md' }: PackStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
