import { useState } from 'react';

export default function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const memberIds = members
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    onCreate(name, memberIds);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-group-title"
      >
        <h2 id="create-group-title">Create group</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Group name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project team"
              required
            />
          </label>
          <label>
            Member IDs (comma-separated)
            <input
              type="text"
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              placeholder="bob, charlie"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
