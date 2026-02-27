import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
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
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface TaskDetailModalProps {
  packId: string;
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailModal({ packId, task, allTasks, onClose, onUpdate }: TaskDetailModalProps) {
  const { user } = useUser();
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/packs/${packId}/tasks/${task.id}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/packs/${packId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTask),
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      await fetch(`/api/packs/${packId}/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.fullName || user.primaryEmailAddress?.emailAddress || 'Unknown',
          content: newComment.trim(),
        }),
      });
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await fetch(`/api/packs/${packId}/tasks/${task.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const toggleBlockedBy = (taskId: string) => {
    const blocked = editedTask.blockedByIds || [];
    if (blocked.includes(taskId)) {
      setEditedTask({
        ...editedTask,
        blockedByIds: blocked.filter(id => id !== taskId),
      });
    } else {
      setEditedTask({
        ...editedTask,
        blockedByIds: [...blocked, taskId],
      });
    }
  };

  const availableTasks = allTasks.filter(t => t.id !== task.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Task Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add task description..."
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={editedTask.status}
                onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select
                value={editedTask.priority}
                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
              <input
                type="date"
                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <input
                type="text"
                value={editedTask.category || ''}
                onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Document Review"
              />
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                value={editedTask.estimatedHours || ''}
                onChange={(e) => setEditedTask({ ...editedTask, estimatedHours: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* Actual Hours */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Actual Hours</label>
              <input
                type="number"
                step="0.5"
                value={editedTask.actualHours || ''}
                onChange={(e) => setEditedTask({ ...editedTask, actualHours: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Assignee (Placeholder for now - will be enhanced with team member selector) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assigned To</label>
            <input
              type="text"
              value={editedTask.assignedToName || ''}
              onChange={(e) => setEditedTask({ ...editedTask, assignedToName: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name..."
            />
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Blocked By</label>
            <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              {availableTasks.length === 0 ? (
                <p className="text-sm text-slate-500">No other tasks available</p>
              ) : (
                <div className="space-y-2">
                  {availableTasks.map((t) => (
                    <label key={t.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(editedTask.blockedByIds || []).includes(t.id)}
                        onChange={() => toggleBlockedBy(t.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{t.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={(editedTask.tags || []).join(', ')}
              onChange={(e) => setEditedTask({ ...editedTask, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Comments Section */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Comments</h3>

            {loadingComments ? (
              <p className="text-sm text-slate-500">Loading comments...</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-500">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">{comment.userName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {user?.id === comment.userId && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-slate-400 hover:text-red-500 text-xs"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment();
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
