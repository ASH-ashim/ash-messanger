
import React, { useContext, useEffect, useRef, useState } from 'react';
import { VideoCallContext } from '../../context/VideoCallContext';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';

const VideoCall = ({ onClose, isGroupCall = false }) => {
    const { 
        localStream, 
        remoteStream, 
        callAccepted, 
        callEnded, 
        callDuration, 
        endCall, 
        call, 
        peers,
    } = useContext(VideoCallContext);
    
    const { selectedUser, selectedGroup } = useContext(ChatContext);
    const { authUser } = useContext(AuthContext);
    
    // Local refs for reliable stream assignment
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peersRef = useRef({}); 

    // Toggle states for mic and video
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);

    const displayName = selectedGroup ? selectedGroup.name : (selectedUser?.fullName || call.callerName || "User");
    const remoteProfilePic = selectedUser?.profilePic || assets.avatar_icon;
    const localProfilePic = authUser?.profilePic || assets.avatar_icon;
    
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle microphone
    const toggleMic = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicOn(!isMicOn);
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOn(!isVideoOn);
        }
    };

    // Assign local stream
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            console.log("VideoCall UI: Assigning local stream");
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Assign remote stream
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            console.log("VideoCall UI: Assigning remote stream");
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Handle multiple peers for group calls
    useEffect(() => {
        peers.forEach(peerObj => {
            const videoElement = peersRef.current[peerObj.peerID];
            if (videoElement && peerObj.stream) {
                videoElement.srcObject = peerObj.stream;
            }
        });
    }, [peers]); 

    // Initialize toggle states based on stream
    useEffect(() => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            const videoTracks = localStream.getVideoTracks();
            if (audioTracks.length > 0) setIsMicOn(audioTracks[0].enabled);
            if (videoTracks.length > 0) setIsVideoOn(videoTracks[0].enabled);
        }
    }, [localStream]);

    return (
        <div className="fixed inset-0 bg-[#0a0a12] z-[150] flex flex-col animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-4 md:py-6 flex items-center justify-center">
                <div className="bg-white/5 backdrop-blur-xl px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
                    <div className={`w-2.5 h-2.5 rounded-full ${callAccepted ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
                    <span className="text-white font-semibold text-sm md:text-base">
                        {callAccepted ? formatDuration(callDuration) : 'Calling...'}
                    </span>
                    <span className="text-white/40 hidden sm:inline">•</span>
                    <span className="text-white/60 text-sm hidden sm:inline truncate max-w-[150px]">{displayName}</span>
                </div>
            </div>

            {/* Main Video Area - Responsive Grid */}
            <div className="flex-1 p-2 md:p-4 lg:p-6 overflow-hidden">
                <div className="w-full h-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-2 md:gap-4">
                    
                    <div className="flex-1 relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-white/10 shadow-2xl min-h-[200px]">
                        <div className={`w-full h-full grid ${(!remoteStream && peers.length === 0) ? 'grid-cols-1' : (peers.length > 1 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')} gap-2 p-2`}>
                            {/* Main Remote Stream */}
                            {(callAccepted && remoteStream) && (
                                <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/40">
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[10px] font-semibold border border-white/10 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        {displayName}
                                    </div>
                                </div>
                            )}

                            {/* Group Peer Streams */}
                            {peers.map((peerObj) => {
                                const member = selectedGroup?.members?.find(m => m._id === peerObj.peerID);
                                return (
                                    <div key={peerObj.peerID} className="relative w-full h-full rounded-xl overflow-hidden bg-black/40 min-h-[150px]">
                                        <video
                                            ref={el => peersRef.current[peerObj.peerID] = el}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[10px] font-semibold border border-white/10 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {member?.fullName || "Participant"}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Waiting State */}
                            {!remoteStream && peers.length === 0 && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 md:gap-6 p-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 scale-150 rounded-full border-2 border-violet-500/20 animate-ping" />
                                        <img 
                                            src={remoteProfilePic} 
                                            className="w-24 h-24 md:w-32 rounded-full object-cover border-4 border-violet-500/50 relative z-10 shadow-2xl" 
                                            alt={displayName} 
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white text-xl font-bold">{displayName}</h3>
                                        <p className="text-white/40 text-sm mt-1 animate-pulse">Waiting to connect...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Local Video (Self) - Picture in Picture */}
                    <div className="absolute bottom-28 right-4 md:bottom-32 md:right-6 lg:relative lg:bottom-auto lg:right-auto lg:w-80 lg:h-auto">
                        <div className="w-32 h-24 md:w-48 md:h-36 lg:w-full lg:h-full lg:min-h-[200px] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-xl md:rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl transition-all hover:scale-105 hover:border-violet-500/50 relative">
                            {/* Render video only if video is allowed and on */}
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover absolute inset-0 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
                            />
                            
                            {/* Show profile picture if video is off */}
                            {!isVideoOn && (
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/20 to-indigo-900/20 z-10">
                                    <img 
                                        src={localProfilePic}
                                        alt="You"
                                        className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-white/20"
                                    />
                                </div>
                            )}
                            
                            {/* You badge */}
                            <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[10px] md:text-xs font-bold text-white uppercase flex items-center gap-1.5 z-20">
                                <div className={`w-1.5 h-1.5 rounded-full ${isMicOn ? 'bg-green-500' : 'bg-red-500'}`} />
                                You
                            </div>

                            {/* Video off indicator */}
                            {!isVideoOn && (
                                <div className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-lg z-20">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar - Fixed at bottom */}
            <div className="flex-shrink-0 px-4 py-4 md:py-6 flex justify-center">
                <div className="flex items-center gap-3 md:gap-4 px-4 md:px-8 py-3 md:py-4 bg-white/5 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl">
                    
                    {/* Mic Toggle Button */}
                    <button 
                        onClick={toggleMic}
                        className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-90 ${
                            isMicOn 
                                ? 'bg-white/10 hover:bg-white/20 text-white' 
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        }`}
                        title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                    >
                        {isMicOn ? (
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        )}
                    </button>

                    {/* Video Toggle Button */}
                    <button 
                        onClick={toggleVideo}
                        className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-90 ${
                            isVideoOn 
                                ? 'bg-white/10 hover:bg-white/20 text-white' 
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        }`}
                        title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                    >
                        {isVideoOn ? (
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                            </svg>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/10 mx-1 md:mx-2" />

                    {/* End Call Button */}
                    <button 
                        onClick={() => endCall(true)}
                        className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 transition-all duration-300 active:scale-90 hover:scale-105"
                        title="End call"
                    >
                        <svg className="w-6 h-6 md:w-7 md:h-7 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Screen share / More options hint */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                <p className="text-white/20 text-[10px] md:text-xs">
                    Press ESC to minimize
                </p>
            </div>
        </div>
    );
};

export default VideoCall;

