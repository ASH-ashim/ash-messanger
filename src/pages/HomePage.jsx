import React, { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {
    const { selectedUser, selectedGroup, rightSidebarOpen } = useContext(ChatContext);
    const hasChatSelected = !!(selectedUser || selectedGroup);

    return (
        <div className='w-full h-[100dvh] md:p-6 lg:p-10 bg-[#0f0f1a]'>
            <div className='w-full h-full backdrop-blur-3xl border border-white/10 md:rounded-3xl overflow-hidden flex relative shadow-2xl'>
                {/* Left Sidebar - Shows when no chat selected */}
                <div 
                    className={`min-h-0 h-full transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0
                        ${hasChatSelected ? 'w-0 opacity-0' : 'w-full md:w-[350px] opacity-100'}
                    `}
                >
                    <Sidebar />
                </div>

                {/* Main Chat Area - Takes full screen when chat is selected */}
                <div className={`min-h-0 h-full flex-1 flex flex-col transition-all duration-500 ${hasChatSelected ? 'flex' : 'hidden'}`}>
                    <ChatContainer />
                </div>

                {/* Right Sidebar - Profile & Media (Fixed on right) */}
                <div 
                    className={`min-h-0 h-full border-l border-white/5 transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0
                        ${!hasChatSelected ? 'w-0 hidden' : ''}
                        ${hasChatSelected && rightSidebarOpen ? 'w-[320px] opacity-100 max-lg:fixed max-lg:inset-0 max-lg:z-[60] max-lg:w-full max-lg:bg-[#1e1e2e]' : ''}
                        ${hasChatSelected && !rightSidebarOpen ? 'w-0 opacity-0' : ''}
                    `}
                >
                    <RightSidebar />
                </div>
            </div>
        </div>
    )
}

export default HomePage