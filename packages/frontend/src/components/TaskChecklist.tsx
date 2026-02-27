import { useState } from 'react';
import TaskDetailModal from './TaskDetailModal';

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
  status: string;
  assignedTo: string | null;
  assignedToName: string | null;
  dueDate: string | null;
  priority: string;
  blockedByIds: string[];
  tags: string[];
  category: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  _count?: {
    comments: number;
  };
}

interface TaskChecklistProps {
  packId: string;
  tasks: Task[];
  onTasksChange: () => void;
}

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-700 border-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  blocked: 'bg-red-100 text-red-700 border-red-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
};

export default function TaskChecklist({ packId, tasks, onTasksChange }: TaskChecklistProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('sortOrder');

  // Calculate stats
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter tasks
  let filteredTasks = [...tasks];

  if (filterStatus !== 'all') {
    filteredTasks = filteredTasks.filter((t) => t.status === filterStatus);
  }

  if (filterPriority !== 'all') {
    filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority);
  }

  if (showOverdueOnly) {
    const now = new Date();
    filteredTasks = filteredTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    );
  }

  // Sort tasks
  filteredTasks.sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return a.sortOrder - b.sortOrder;
    }
  });

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilDue > 0 && daysUntilDue <= 7;
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays <= 7) return `in ${diffDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    setAdding(true);
    try {
      await fetch(`/api/packs/${packId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim() }),
      });
      setNewTaskTitle('');
      setShowAddForm(false);
      onTasksChange();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setAdding(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      await fetch(`/api/packs/${packId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      onTasksChange();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Task Checklist</h3>
            <p className="text-sm text-slate-500">
              {completedCount} of {totalCount} tasks complete
            </p>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-600">{progressPercent}%</span>
            </div>
          )}
        </div>

        {/* Filters */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1"
            >
              <option value="sortOrder">Default Order</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>

            <label className="flex items-center gap-1 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
                className="rounded"
              />
              Overdue only
            </label>
          </div>
        )}
      </div>

      <div className="p-4">
        {tasks.length === 0 && !showAddForm ? (
          <div className="text-center py-6">
            <p className="text-slate-500 mb-4">No tasks yet. Add tasks to track progress.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add First Task
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-center py-4 text-slate-500 text-sm">No tasks match the filters</p>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer group border ${
                    task.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  {/* Priority indicator */}
                  <div className={`w-1 h-8 rounded ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-slate-300'
                  }`} />

                  {/* Status badge */}
                  <div className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]}
                  </div>

                  {/* Task title */}
                  <span
                    className={`flex-1 ${
                      task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-700'
                    }`}
                  >
                    {task.title}
                  </span>

                  {/* Due date badge */}
                  {task.dueDate && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        isOverdue(task.dueDate, task.status)
                          ? 'bg-red-100 text-red-700'
                          : isDueSoon(task.dueDate, task.status)
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}

                  {/* Assignee */}
                  {task.assignedToName && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {task.assignedToName}
                    </span>
                  )}

                  {/* Comments count */}
                  {task._count && task._count.comments > 0 && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {task._count.comments}
                    </span>
                  )}

                  {/* Blocked indicator */}
                  {task.blockedByIds && task.blockedByIds.length > 0 && (
                    <span className="text-xs text-red-600" title="Blocked by other tasks">
                      🔒
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}

            {showAddForm ? (
              <div className="flex items-center gap-2 p-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask();
                    if (e.key === 'Escape') {
                      setShowAddForm(false);
                      setNewTaskTitle('');
                    }
                  }}
                />
                <button
                  onClick={addTask}
                  disabled={adding || !newTaskTitle.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? '...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTaskTitle('');
                  }}
                  className="px-3 py-2 text-slate-500 hover:text-slate-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 w-full p-3 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          packId={packId}
          task={selectedTask}
          allTasks={tasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={onTasksChange}
        />
      )}
    </div>
  );
}
