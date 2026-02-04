
import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext';

const RightSidebar = () => {
    const { selectedUser, selectedGroup, messages, setRightSidebarOpen } = useContext(ChatContext);
    const { logout, onlineUsers } = useContext(AuthContext);

    const [msgImages, setMsgImages] = useState([]);
    
    const chatInfo = selectedGroup || selectedUser;

    useEffect(() => {
        if (messages) {
            setMsgImages(
                messages.filter(msg => msg.image).map(msg => msg.image)
            );
        }
    }, [messages]);

    if (!chatInfo) return null;

    return (
        <div className="bg-[#1e1e2e]/50 h-full w-full flex flex-col relative animate-in fade-in duration-500">
            {/* Close Button for Mobile/Tablet */}
            <div className="lg:hidden absolute top-4 right-4 z-10">
                <button 
                    onClick={() => setRightSidebarOpen(false)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
                >
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Profile Info */}
            <div className='pt-12 px-6 flex flex-col items-center text-center'>
                <div className="relative mb-4">
                    <img 
                        src={(selectedGroup ? selectedGroup.groupPic : selectedUser?.profilePic) || "/avatar.png"} 
                        alt=""
                        className='w-24 h-24 2xl:w-32 2xl:h-32 rounded-full object-cover border-2 border-violet-500/50 shadow-xl' 
                    />
                    {!selectedGroup && selectedUser && onlineUsers.includes(selectedUser._id) && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1e1e2e]" />
                    )}
                </div>
                
                <h2 className='text-white text-xl 2xl:text-2xl font-bold mb-1 truncate w-full'>
                    {selectedGroup ? selectedGroup.name : selectedUser?.fullName}
                </h2>
                <p className="text-white/40 text-xs 2xl:text-sm px-4 leading-relaxed line-clamp-3">
                    {selectedGroup ? selectedGroup.description : selectedUser?.bio || "No bio available"}
                </p>
                
                {selectedGroup && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1">
                        {selectedGroup.members.slice(0, 5).map(m => (
                            <img key={m._id} src={m.profilePic || "/avatar.png"} className="w-6 h-6 2xl:w-8 2xl:h-8 rounded-full border border-white/10" title={m.fullName} />
                        ))}
                        {selectedGroup.members.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/40">
                                +{selectedGroup.members.length - 5}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="h-px bg-white/5 my-8 mx-6" />

            {/* Gallery Section */}
            <div className='px-6 flex-1 overflow-y-auto custom-scrollbar pb-24'>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Shared Media</p>
                    <span className="text-[10px] text-violet-400 font-bold">{msgImages.length} items</span>
                </div>
                
                {msgImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                        </svg>
                        <p className="text-[10px]">No media shared yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {msgImages.map((url, index) => (
                            <div 
                                key={index} 
                                onClick={() => window.open(url)}
                                className="aspect-square cursor-pointer rounded-xl overflow-hidden group relative"
                            >
                                <img src={url} alt="" className='w-full h-full object-cover transition duration-300 group-hover:scale-110'/>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Logout Button */}
            <div className="absolute bottom-6 left-6 right-6">
                <button 
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold text-xs 2xl:text-base rounded-xl transition-all duration-300 group"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default RightSidebar;