import React, { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {
    const { selectedUser, selectedGroup, rightSidebarOpen } = useContext(ChatContext);
    const hasChatSelected = !!(selectedUser || selectedGroup);

    return (
        <div className='w-full h-[100dvh] md:p-6 lg:p-10 2xl:p-16 bg-[#0f0f1a]'>
            <div className='w-full h-full bg-[#121126] border border-white/10 md:rounded-3xl overflow-hidden flex relative'>
                {/* Left Sidebar - Shows when no chat selected */}
                <div
                    className={`min-h-0 h-full transition-width duration-300 ease-linear overflow-hidden flex-shrink-0
                        ${hasChatSelected ? 'w-0 opacity-0' : 'w-full md:w-[350px] 2xl:w-[450px] opacity-100'}
                    `}
                >
                    <Sidebar />
                </div>

                {/* Main Chat Area - Takes full screen when chat is selected */}
                <div className={`min-h-0 h-full flex-1 flex flex-col transition-all duration-500 ${hasChatSelected ? 'flex' : 'hidden md:flex'}`}>
                    <ChatContainer />
                </div>

                {/* Right Sidebar - Profile & Media (Fixed on right) */}
                <div
                    className={`min-h-0 h-full border-l border-white/5 transition-width duration-300 ease-linear overflow-hidden flex-shrink-0
                        ${hasChatSelected && rightSidebarOpen ? 'w-[320px] 2xl:w-[400px] opacity-100 max-lg:fixed max-lg:inset-0 max-lg:z-[60] max-lg:w-full max-lg:bg-[#1e1e2e]' : 'w-0 opacity-0'}
                    `}
                >
                    <RightSidebar />
                </div>
            </div>
        </div>
    )
}

export default HomePage