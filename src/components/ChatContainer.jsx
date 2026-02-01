
import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { VideoCallContext } from '../../context/VideoCallContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import VoiceRecorder from './VoiceRecorder';
import GroupMembersModal from './GroupMembersModal';

const ChatContainer = () => {
    const { 
        messages, 
        selectedUser, 
        selectedGroup, 
        setSelectedUser, 
        setSelectedGroup, 
        sendMessage, 
        getMessages, 
        deleteMessage,
        leftSidebarOpen,
        setLeftSidebarOpen,
        rightSidebarOpen,
        setRightSidebarOpen
    } = useContext(ChatContext);

    const { authUser, onlineUsers } = useContext(AuthContext);
    const { callUser } = useContext(VideoCallContext);

    const scrollEnd = useRef();
    const [input, setInput] = useState("");
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    
    const navigate = useNavigate();

    const chatInfo = selectedGroup || selectedUser;
    const isGroupChat = !!selectedGroup;

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault(); 
        if (input.trim() === "") return;
        
        await sendMessage({ text: input.trim() }); 
        setInput(""); 
    };

    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) return toast.error("Please select an image file.");

        const reader = new FileReader();
        reader.onloadend = async () => {
            await sendMessage({ image: reader.result }); 
            e.target.value = ""; 
        };
        reader.readAsDataURL(file); 
    };

    const handleSendVoice = async (audioData, duration) => {
        await sendMessage({ 
            audio: audioData, 
            audioDuration: duration 
        });
    };

    useEffect(() => {
        if (chatInfo?._id) { 
            getMessages(chatInfo._id);
        }
    }, [chatInfo?._id, getMessages]); 

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleBack = () => {
        setSelectedUser(null);
        setSelectedGroup(null);
    };

    const startCall = () => {
        if (isGroupChat) {
            const memberIds = chatInfo.members.map(m => m._id);
            callUser(chatInfo._id, true, memberIds, chatInfo.name);
        } else {
            callUser(chatInfo._id);
        }
    };

    if (!chatInfo) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-gray-500 bg-white/5 max-md:hidden h-full border-l border-white/5">
                <div className="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center animate-pulse">
                    <img src={assets.logo_icon} className="w-12 opacity-50" alt="" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white/80">Welcome, {authUser?.fullName}</h3>
                    <p className="text-sm text-white/40">Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden relative bg-[#1e1e2e]/50 backdrop-blur-3xl flex flex-col border-l border-white/5 animate-in fade-in slide-in-from-right-4 duration-300"> 
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-black/20 backdrop-blur-md">
                {/* Back Button */}
                <button 
                    onClick={handleBack} 
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
                    title="Back to contacts"
                >
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                
                {/* User/Group Info - Clickable to open right sidebar */}
                <div 
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-white/5 rounded-xl py-1 px-2 -ml-1 transition-all" 
                    onClick={() => {
                        if (isGroupChat) {
                            setShowMembersModal(true);
                        } else {
                            setRightSidebarOpen(!rightSidebarOpen);
                        }
                    }}
                    title="View profile & media"
                >
                    <div className="relative flex-shrink-0">
                        {isGroupChat && !chatInfo.groupPic ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden grid grid-cols-2 border border-white/10 shadow-lg">
                                {chatInfo.members.slice(0, 4).map(m => (
                                    <img key={m._id} src={m.profilePic || assets.avatar_icon} className="w-full h-full object-cover" alt="" />
                                ))}
                            </div>
                        ) : (
                            <img 
                                src={isGroupChat ? chatInfo.groupPic || "/group.png" : chatInfo.profilePic || assets.avatar_icon} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg" 
                            />
                        )}
                        {!isGroupChat && onlineUsers.includes(chatInfo._id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e1e2e]" />
                        )}
                    </div>
    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white text-base font-bold truncate">{chatInfo.name || chatInfo.fullName}</h3>
                        <div className="flex items-center gap-1.5">
                            {isGroupChat ? (
                                <p className="text-[10px] text-white/40 font-medium">
                                    {chatInfo.members.length} members
                                </p>
                            ) : (
                                <>
                                    <div className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(chatInfo._id) ? 'bg-green-500' : 'bg-white/20'}`} />
                                    <p className="text-[10px] text-white/40 font-medium">
                                        {onlineUsers.includes(chatInfo._id) ? 'Online' : 'Offline'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Chevron indicator */}
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={startCall} 
                        className="p-2.5 bg-violet-500/10 hover:bg-violet-500 text-violet-400 hover:text-white rounded-xl transition-all active:scale-95" 
                        title="Start Video Call"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {showMembersModal && <GroupMembersModal onClose={() => setShowMembersModal(false)} />}

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium">Say hello to {chatInfo.name || chatInfo.fullName}!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        if (msg.isCallLog) {
                            return (
                                <div key={msg._id} className="flex justify-center my-6 animate-in fade-in zoom-in duration-500">
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 shadow-xl">
                                        <div className={`p-2 rounded-full ${msg.text.includes('Ended') ? 'bg-violet-500/20 text-violet-400' : 'bg-red-500/20 text-red-400'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-white/80 tracking-wide uppercase">{msg.text}</span>
                                            <span className="text-[9px] text-white/30 font-medium text-center">{formatMessageTime(msg.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        const isMine = msg.senderId?._id === authUser?._id || msg.senderId === authUser?._id;
                        const sender = msg.senderId?._id ? msg.senderId : { fullName: "User" };
                        
                        return (
                            <div key={msg._id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${isMine ? 'justify-end' : 'justify-start'} group`}>
                                {!isMine && (
                                    <img src={sender.profilePic || assets.avatar_icon} className="w-8 h-8 rounded-full self-end border border-white/5" alt="" />
                                )}
                                
                                <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                                    {isGroupChat && !isMine && (
                                        <span className="text-[10px] text-violet-400 font-bold ml-1">{sender.fullName}</span>
                                    )}
                                    
                                    {isMine && (
                                        <button onClick={() => deleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}

                                    <div className={`p-4 rounded-2xl shadow-sm text-sm ${isMine ? 'bg-violet-600 text-white rounded-br-none' : 'bg-[#282a36] text-white/90 border border-white/5 rounded-bl-none'}`}>
                                        {msg.image && <img src={msg.image} className="max-w-full rounded-lg mb-2" alt="attachment" />}
                                        {msg.audio && (
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isMine ? 'bg-white/20' : 'bg-violet-500/20 text-violet-400'}`}>
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
                                                </div>
                                                <audio src={msg.audio} controls className="h-8 max-w-[200px]" />
                                            </div>
                                        )}
                                        {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}
                                    </div>
                                    <span className="text-[10px] text-white/30 font-medium">{formatMessageTime(msg.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollEnd} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/20 backdrop-blur-xl border-t border-white/5">
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 focus-within:border-violet-500/50 transition-all">
                    <input 
                        type="file" id='image' 
                        onChange={handleSendImage}
                        accept='image/*' hidden 
                    />
                    <label htmlFor="image" className="p-2 hover:bg-white/10 rounded-xl cursor-pointer transition text-white/40 hover:text-white">
                        <img src={assets.gallery_icon} className="w-5" alt="Gallery" />
                    </label>
                    <button 
                        onClick={() => setShowVoiceRecorder(true)}
                        className="p-2 hover:bg-white/10 rounded-xl transition text-white/40 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    </button>
                    
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2 placeholder-white/20"
                    />
                    
                    <button 
                        onClick={handleSendMessage}
                        className="p-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-50"
                        disabled={!input.trim()}
                    >
                        <img src={assets.send_button} className="w-5" alt="Send" />
                    </button>
                </div>
            </div>

            {showVoiceRecorder && <VoiceRecorder onSendVoice={handleSendVoice} onClose={() => setShowVoiceRecorder(false)} />}
        </div>
    );
};

export default ChatContainer;
