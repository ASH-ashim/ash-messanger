
import React, { useState, useRef, useEffect, useContext } from 'react'; 
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom'; 
import { AuthContext } from '../../context/AuthContext'; 
import { ChatContext } from '../../context/ChatContext';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = () => {
    const { 
        getUsers, 
        users, 
        groups, 
        callLogs, 
        selectedUser, 
        setSelectedUser, 
        selectedGroup, 
        setSelectedGroup, 
        unseenMessages, 
        setUnseenMessages 
    } = useContext(ChatContext);
 
    const { logout, onlineUsers, authUser } = useContext(AuthContext); 
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("chats");
    const [showMenu, setShowMenu] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const menuRef = useRef();
    const navigate = useNavigate();

    const filteredUsers = searchTerm 
        ? users.filter((user) => user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) 
        : users;

    const filteredGroups = searchTerm
        ? groups.filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : groups;

    useEffect(()=> {
        getUsers();
    }, [onlineUsers, getUsers]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleEditProfile = () => {
        setShowMenu(false); 
        navigate('/profile'); 
    };

    const handleLogout = () => {
        setShowMenu(false); 
        logout(); 
    };

    const formatCallTime = (date) => {
        return new Date(date).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    };

    return (
        <div className={`bg-[#1e1e2e]/95 h-full max-h-screen flex flex-col border-r border-white/5 backdrop-blur-3xl text-white transition-all duration-300 overflow-hidden ${selectedUser || selectedGroup ? "max-md:hidden" : "w-full md:w-[320px] lg:w-[350px]"}`}>
            {/* Header */}
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <img src={assets.logo} alt="logo" className="h-7 brightness-125" />
                    <button 
                        onClick={() => setShowCreateGroup(true)}
                        className="p-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-xl transition-all active:scale-95"
                        title="Create Group"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v4m-2-2h4" />
                        </svg>
                    </button>
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <img src={assets.search_icon} alt="search" className="w-4 opacity-40 group-focus-within:opacity-100 transition-opacity"/>
                    </div>
                    <input 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text" 
                        value={searchTerm}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all text-sm placeholder-white/20" 
                        placeholder='Search chats or calls...'
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-4">
                <div className="flex p-1.5 bg-black/20 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => setActiveTab("chats")}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "chats" ? "bg-violet-500 text-white shadow-xl shadow-violet-500/20" : "text-white/40 hover:text-white/70"}`}
                    >
                        Messages
                    </button>
                    <button 
                        onClick={() => setActiveTab("calls")}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "calls" ? "bg-violet-500 text-white shadow-xl shadow-violet-500/20" : "text-white/40 hover:text-white/70"}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 min-h-0 overflow-y-auto px-4 custom-scrollbar'>
                <div className="py-6 space-y-6">
                {activeTab === "chats" ? (
                    <div className="pb-4">
                        {/* Groups Section */}
                        {filteredGroups.length > 0 && (
                            <div className="mb-8">
                                <h4 className="px-3 mb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Groups</h4>
                                <div className="space-y-1">
                                    {filteredGroups.map((group) => (
                                        <div
                                            onClick={() => {
                                                setSelectedGroup(group);
                                                setSelectedUser(null);
                                            }}
                                            key={group._id}
                                            className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 group ${selectedGroup?._id === group._id ? 'bg-violet-600 shadow-lg shadow-violet-600/20' : 'hover:bg-white/5'}`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                {group.groupPic ? (
                                                    <img src={group.groupPic} alt="" className="w-11 h-11 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform shadow-lg" />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-2xl overflow-hidden grid grid-cols-2 border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                                                        {group.members.slice(0, 4).map(m => (
                                                            <img key={m._id} src={m.profilePic || assets.avatar_icon} className="w-full h-full object-cover" alt="" />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-400 rounded-full border-2 border-[#1e1e2e] flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className={`font-bold truncate text-sm ${selectedGroup?._id === group._id ? 'text-white' : 'text-white/90'}`}>{group.name}</p>
                                                </div>
                                                <p className={`text-[11px] truncate ${selectedGroup?._id === group._id ? 'text-white/60' : 'text-white/30'}`}>
                                                    {group.members.length} participants
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Users Section */}
                        <div className="mb-4">
                            <h4 className="px-3 mb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Chats</h4>
                            <div className="space-y-1">
                                {filteredUsers.map((user) => (
                                    <div
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setSelectedGroup(null);
                                            setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
                                        }}
                                        key={user._id}
                                        className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 group ${selectedUser?._id === user._id ? 'bg-violet-600 shadow-lg shadow-violet-600/20' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img src={user.profilePic || assets.avatar_icon} alt="" className="w-11 h-11 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform" />
                                            {onlineUsers.includes(user._id) && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1e1e2e]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className={`font-bold truncate text-sm ${selectedUser?._id === user._id ? 'text-white' : 'text-white/90'}`}>{user.fullName}</p>
                                            </div>
                                            <span className={`text-[11px] font-medium ${onlineUsers.includes(user._id) ? (selectedUser?._id === user._id ? 'text-white/70' : 'text-green-500') : 'text-white/20'}`}>
                                                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        {unseenMessages[user._id] > 0 && (
                                            <div className="min-w-5 h-5 flex justify-center items-center rounded-lg bg-red-500 text-[10px] font-black shadow-lg shadow-red-500/20">
                                                {unseenMessages[user._id]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Call Logs Section */
                    <div className="pb-4">
                        <h4 className="px-3 mb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Recent Activity</h4>
                        {callLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-white/10">
                                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                                </svg>
                                <p className="text-xs font-bold uppercase tracking-widest">No history</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {callLogs.map((log) => {
                                    const isCaller = log.caller._id === authUser._id;
                                    const otherUser = isCaller ? log.receiver : log.caller;
                                    return (
                                        <div key={log._id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group">
                                            <img src={otherUser?.profilePic || assets.avatar_icon} alt="" className="w-11 h-11 rounded-2xl object-cover border border-white/5" />
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold text-sm truncate ${log.status === 'missed' && !isCaller ? 'text-red-400' : 'text-white/90'}`}>
                                                    {otherUser?.fullName || "Unknown"}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className={`p-0.5 rounded ${isCaller ? 'text-green-500' : 'text-blue-500'}`}>
                                                        <svg className={`w-2.5 h-2.5 ${isCaller ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[10px] text-white/30 font-medium uppercase tracking-tighter">{formatCallTime(log.createdAt)}</span>
                                                    <span className="text-[10px] text-white/10">•</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${log.status === 'missed' ? 'text-red-400/60' : 'text-white/30'}`}>{log.status}</span>
                                                </div>
                                            </div>
                                            <button className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-violet-500/20 active:scale-90">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>

            {/* User Profile Bar */}
            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group relative" onClick={() => setShowMenu(!showMenu)}>
                    <div className="relative flex-shrink-0">
                        <img src={authUser?.profilePic || assets.avatar_icon} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="me" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e1e2e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{authUser?.fullName}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Active Now</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/40 group-hover:text-white transition-colors">
                        <svg className={`w-4 h-4 transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                    </div>

                    {/* Popup Menu */}
                    {showMenu && (
                        <div ref={menuRef} className="absolute bottom-full left-0 w-full mb-3 p-2 rounded-2xl bg-[#282a36] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-50">
                            <button onClick={() => { setShowMenu(false); navigate('/profile'); }} className='w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all'>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                My Profile
                            </button>
                            <div className="h-px bg-white/5 my-2 mx-2" />
                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
        </div>
    );
};

export default Sidebar;
