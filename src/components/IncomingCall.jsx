import React, { useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';

const IncomingCall = ({ callerName, callerPic, onAnswer, onReject }) => {
    const audioRef = useRef(null);
    const [audioError, setAudioError] = useState(false);
    const [isAnswering, setIsAnswering] = useState(false);

    useEffect(() => {
        const playRingtone = async () => {
            try {
                if (audioRef.current) {
                    audioRef.current.loop = true;
                    // Attempt to play
                    await audioRef.current.play();
                }
            } catch (error) {
                console.warn("Audio auto-play blocked by browser. User interaction required.");
                setAudioError(true);
            }
        };
        playRingtone();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const handleAnswer = async () => {
        if (isAnswering) return;
        setIsAnswering(true);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        try {
            await onAnswer();
        } catch (error) {
            setIsAnswering(false);
        }
    };

    const handleReject = () => {
        if (isAnswering) return;
        onReject();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f0f1a]/95 backdrop-blur-xl animate-in fade-in duration-500">
            <audio ref={audioRef} src="/ringtone.mp3" preload="auto" />
            
            <div className="flex flex-col items-center gap-8 p-8 text-center animate-in zoom-in slide-in-from-bottom-10 duration-700">
                <div className="relative">
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping scale-150"></div>
                    <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping scale-125 delay-75"></div>
                    
                    <img 
                        src={callerPic || assets.avatar_icon} 
                        alt={callerName} 
                        className="relative w-48 h-48 rounded-full object-cover border-4 border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.3)] z-10"
                    />
                </div>

                <div className="space-y-3 z-10">
                    <p className="text-violet-400 text-sm uppercase tracking-[0.3em] font-black animate-pulse">
                        {isAnswering ? 'Connecting...' : 'Incoming Video Call'}
                    </p>
                    <h2 className="text-white text-6xl font-black tracking-tight">{callerName}</h2>
                </div>

                {audioError && !isAnswering && (
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-white/40 text-xs animate-bounce">
                        Click anywhere to enable ringtone
                    </div>
                )}

                <div className="flex gap-16 mt-16 z-10">
                    {/* Reject Button */}
                    <button 
                        onClick={handleReject}
                        disabled={isAnswering}
                        className={`group flex flex-col items-center gap-4 transition-all hover:scale-110 active:scale-95 ${isAnswering ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="w-20 h-20 flex items-center justify-center bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)] group-hover:bg-red-600 transition-colors">
                            <svg className="w-10 h-10 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                            </svg>
                        </div>
                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Decline</span>
                    </button>

                    {/* Accept Button */}
                    <button 
                        onClick={handleAnswer}
                        disabled={isAnswering}
                        className={`group flex flex-col items-center gap-4 transition-all hover:scale-110 active:scale-95 ${isAnswering ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-20 h-20 flex items-center justify-center bg-green-500 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)] group-hover:bg-green-600 transition-colors ${isAnswering ? 'animate-pulse' : 'animate-bounce'}`}>
                            {isAnswering ? (
                                <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : (
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                </svg>
                            )}
                        </div>
                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{isAnswering ? 'Connecting' : 'Accept'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCall;
