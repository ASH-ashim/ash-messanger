import React, { useState, useContext } from 'react';
import { ChatContext } from '../../context/ChatContext';

const CreateGroupModal = ({ onClose }) => {
    const { users, createGroup } = useContext(ChatContext);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    const toggleMember = (userId) => {
        setSelectedMembers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (groupName.trim() === '') {
            console.error("Group name is required");
            return;
        }
        if (selectedMembers.length === 0) {
            console.error("Please select at least one member");
            return;
        }

        await createGroup({
            name: groupName,
            members: selectedMembers,
            description: `A new group created on ${new Date().toLocaleDateString()}`
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Create New Group</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-gray-700 border-none rounded-xl p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 transition"
                            placeholder="Enter group name..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Select Members ({selectedMembers.length})</label>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {users.map(user => (
                                <div
                                    key={user._id}
                                    onClick={() => toggleMember(user._id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selectedMembers.includes(user._id) ? 'bg-violet-500/20 ring-1 ring-violet-500' : 'bg-gray-700/50 hover:bg-gray-700'
                                        }`}
                                >
                                    <img src={user.profilePic || "/avatar.png"} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    <span className="text-white flex-1 font-medium">{user.fullName}</span>
                                    {selectedMembers.includes(user._id) && (
                                        <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 transition"
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
