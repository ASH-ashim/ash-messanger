import React, { useContext, useState } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';

const GroupMembersModal = ({ onClose }) => {
    const { selectedGroup, updateGroup } = useContext(ChatContext);
    const { authUser, onlineUsers } = useContext(AuthContext);
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);

    if (!selectedGroup) return null;

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            await updateGroup(selectedGroup._id, { groupPic: reader.result });
            setIsEditingPhoto(false);
        };
        reader.readAsDataURL(file);
    };

    const StatusBadge = ({ userId }) => (
        <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${onlineUsers.includes(userId) ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/20'}`}>
            {onlineUsers.includes(userId) ? 'Online' : 'Offline'}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#1e1e2e] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                {/* Header Photo Area */}
                <div className="relative h-48 bg-violet-600/20">
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        {selectedGroup.groupPic ? (
                            <img src={selectedGroup.groupPic} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="grid grid-cols-2 w-full h-full opacity-50">
                                {selectedGroup.members.slice(0, 4).map(m => (
                                    <img key={m._id} src={m.profilePic || assets.avatar_icon} className="w-full h-full object-cover" alt="" />
                                ))}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e2e] to-transparent" />
                    </div>

                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-xl backdrop-blur-md transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6">
                        <div className="relative group">
                            <img 
                                src={selectedGroup.groupPic || "/group.png"} 
                                className="w-24 h-24 rounded-3xl object-cover border-4 border-[#1e1e2e] shadow-2xl" 
                                alt="" 
                            />
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </label>
                        </div>
                        <div className="flex-1 mb-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">{selectedGroup.name}</h2>
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest">{selectedGroup.members.length} Members</p>
                        </div>
                    </div>
                </div>

                {/* Member List */}
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Participants</h3>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {selectedGroup.members.filter(m => m).map(member => (
                            <div key={member._id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img src={member.profilePic || assets.avatar_icon} className="w-10 h-10 rounded-xl object-cover border border-white/5" alt="" />
                                        {onlineUsers.includes(member._id) && (
                                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1e1e2e]" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">
                                            {member.fullName} {member._id === authUser?._id && <span className="text-[10px] opacity-30 ml-1 text-white">(You)</span>}
                                        </p>
                                        <StatusBadge userId={member._id} />
                                    </div>
                                </div>
                                {selectedGroup.admin === member._id && (
                                    <div className="px-2 py-1 bg-violet-500/10 text-violet-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-violet-500/20">
                                        Admin
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full mt-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-violet-600/20 transition-all active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupMembersModal;
