import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onSendVoice, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioURL, setAudioURL] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            stopRecording();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioURL(audioUrl);
                setAudioBlob(audioBlob);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setRecordingTime(0);
        setAudioURL(null);
        setAudioBlob(null);
        audioChunksRef.current = [];
        onClose();
    };

    const sendVoiceMessage = async () => {
        if (!audioBlob) {
            console.error('No audio recorded');
            return;
        }

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            let base64Audio = reader.result;
            // Remove codec info if present to avoid Cloudinary "Unsupported source URL" error
            if (base64Audio.includes(';codecs=')) {
                base64Audio = base64Audio.replace(/;codecs=[^;]+/, '');
            }
            onSendVoice(base64Audio, recordingTime);

            // Reset
            setRecordingTime(0);
            setAudioURL(null);
            setAudioBlob(null);
            audioChunksRef.current = [];
            onClose();
        };
        reader.readAsDataURL(audioBlob);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-start recording when component mounts
    useEffect(() => {
        startRecording();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white text-lg font-semibold">Voice Message</h3>
                    <button onClick={cancelRecording} className="text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Recording Indicator */}
                <div className="flex flex-col items-center mb-6">
                    {isRecording && !audioURL && (
                        <div className="relative mb-4">
                            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                            </div>
                            {isPaused && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                                        PAUSED
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timer */}
                    <div className="text-white text-3xl font-mono mb-4">
                        {formatTime(recordingTime)}
                    </div>

                    {/* Waveform Animation */}
                    {isRecording && !isPaused && !audioURL && (
                        <div className="flex items-center gap-1 h-12">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-violet-500 rounded-full animate-pulse"
                                    style={{
                                        height: `${Math.random() * 100}%`,
                                        animationDelay: `${i * 0.1}s`,
                                        animationDuration: '0.5s'
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Audio Player */}
                    {audioURL && (
                        <div className="w-full mb-4">
                            <audio src={audioURL} controls className="w-full" />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    {!audioURL ? (
                        <>
                            {isRecording && (
                                <>
                                    {!isPaused ? (
                                        <button
                                            onClick={pauseRecording}
                                            className="p-4 bg-yellow-500 hover:bg-yellow-600 rounded-full transition"
                                            title="Pause"
                                        >
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={resumeRecording}
                                            className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition"
                                            title="Resume"
                                        >
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </button>
                                    )}

                                    <button
                                        onClick={stopRecording}
                                        className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition"
                                        title="Stop"
                                    >
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 6h12v12H6z" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            <button
                                onClick={cancelRecording}
                                className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full transition"
                                title="Cancel"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setAudioURL(null);
                                    setAudioBlob(null);
                                    setRecordingTime(0);
                                    startRecording();
                                }}
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                            >
                                Re-record
                            </button>
                            <button
                                onClick={sendVoiceMessage}
                                className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceRecorder;
