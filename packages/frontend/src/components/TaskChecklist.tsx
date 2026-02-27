import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
}

interface TaskChecklistProps {
  packId: string;
  tasks: Task[];
  onTasksChange: () => void;
}

export default function TaskChecklist({ packId, tasks, onTasksChange }: TaskChecklistProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await fetch(`/api/packs/${packId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      onTasksChange();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
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
        <div className="flex items-center justify-between">
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
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                  task.completed ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id, !task.completed)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {task.completed && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 ${
                    task.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
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
            ))}

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
    </div>
  );
}
