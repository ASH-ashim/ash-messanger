
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import Peer from 'simple-peer';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import IncomingCall from '../src/components/IncomingCall';
import VideoCall from '../src/components/VideoCall';

export const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
    const { socket, authUser } = useContext(AuthContext);

    const [call, setCall] = useState({ isReceivingCall: false });
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [callLogId, setCallLogId] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [isGroupCall, setIsGroupCall] = useState(false);

    const peerRef = useRef();
    const timerRef = useRef();

    const mediaRequestPending = useRef(false);

    const getMediaStream = useCallback(async () => {
        if (localStream) return localStream;
        if (mediaRequestPending.current) return null;
        
        mediaRequestPending.current = true;
        try {
            console.log("VideoContext: Requesting camera/mic...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            mediaRequestPending.current = false;
            return stream;
        } catch (error) {
            console.error("VideoContext: Device access error:", error);
            mediaRequestPending.current = false;
            toast.error("Could not access camera or microphone.");
            return null;
        }
    }, [localStream]);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const answerCall = useCallback(async () => {
        if (mediaRequestPending.current) return;
        console.log("VideoContext: Answering call process started...");
        const stream = await getMediaStream();
        if (!stream) return;

        setCallAccepted(true);
        setShowVideoModal(true);
        startTimer();

        const peer = new Peer({ 
            initiator: false, 
            trickle: false, 
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        });

        peer.on('signal', (data) => {
            console.log("VideoContext: Emitting answerCall signal to", call.from);
            socket.emit('answerCall', { signal: data, to: call.from });
        });

        peer.on('stream', (incomingStream) => {
            console.log("VideoContext: RECEIVED remote stream (Receiver Side)");
            setRemoteStream(incomingStream);
        });

        peer.on('error', (err) => {
            console.error("VideoContext: Peer error (Receiver):", err);
            toast.error("Bridge connection failed");
        });

        console.log("VideoContext: Signaling peer with received data...");
        peer.signal(call.signal);
        peerRef.current = peer;

        if (call.logId) {
            setCallLogId(call.logId);
            axios.put(`/api/messages/calls/update/${call.logId}`, { status: "ongoing" }).catch(e => console.error(e));
        }
    }, [call, socket, getMediaStream]);

    const callUser = useCallback(async (id, isGroup = false, groupMembers = [], groupName = "") => {
        if (mediaRequestPending.current) return;
        const stream = await getMediaStream();
        if (!stream) return;

        console.log(`VideoContext: Initiating call to ${id}...`);
        setIsGroupCall(isGroup);
        setShowVideoModal(true);
        // Store call info so we know who to disconnect from if we hang up early
        setCall(prev => ({ ...prev, userToCall: id, isReceivingCall: false }));

        // If it's a group call, join the room immediately
        if (isGroup) {
            socket.emit("joinRoom", { roomId: id, userId: authUser._id });
        }

        let logId = null;
        try {
            const { data } = await axios.post('/api/messages/calls/create', {
                receiverId: isGroup ? null : id,
                type: 'video',
                isGroupCall: isGroup,
                groupId: isGroup ? id : null
            });
            if (data.success) {
                logId = data.callLog._id;
                setCallLogId(logId);
            }
        } catch (error) {
            console.error("VideoContext: Log error:", error);
        }

        const peer = new Peer({ 
            initiator: true, 
            trickle: false, 
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        });

        peer.on('signal', (data) => {
            console.log("VideoContext: Initiator signaling...");
            if (isGroup) {
                groupMembers.forEach(memberId => {
                    if (memberId !== authUser._id) {
                        socket.emit('callUser', { 
                            userToCall: memberId, 
                            signalData: data, 
                            from: authUser._id, 
                            callerName: authUser.fullName,
                            logId: logId,
                            groupName: groupName
                        });
                    }
                });
            } else {
                socket.emit('callUser', { 
                    userToCall: id, 
                    signalData: data, 
                    from: authUser._id, 
                    callerName: authUser.fullName,
                    logId: logId
                });
            }
        });

        peer.on('stream', (incomingStream) => {
            console.log("VideoContext: RECEIVED remote stream (Initiator Side)");
            setRemoteStream(incomingStream);
        });

        peer.on('error', (err) => {
            console.error("VideoContext: Peer error (Initiator):", err);
        });

        peerRef.current = peer;
    }, [authUser, socket, getMediaStream]);

    const endCall = useCallback(async (notifyPeer = true) => {
        console.log("VideoContext: Cleaning up call...");
        stopTimer();
        setCallEnded(true);

        if (callLogId) {
            const finalStatus = callAccepted ? "completed" : "missed";
            axios.put(`/api/messages/calls/update/${callLogId}`, { 
                status: finalStatus, 
                duration: callDuration 
            }).catch(e => console.error(e));
        }

        if (notifyPeer) {
            if (isGroupCall) {
                // If group call, just leave the room
                socket.emit('leaveRoom', { roomId: call.logId, userId: authUser._id });
            } else if (call.from) {
                // If I received the call, notify the caller
                socket.emit('endCall', { to: call.from });
            } else if (call.userToCall) {
                // If I initiated the call, notify the receiver
                socket.emit('endCall', { to: call.userToCall });
            }
        }

        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`VideoContext: Stopped track ${track.kind}`);
            });
            setLocalStream(null);
        }
        
        setRemoteStream(null);
        setCall({ isReceivingCall: false });
        setCallAccepted(false);
        setCallEnded(false);
        setCallDuration(0);
        setShowVideoModal(false);
        setIsGroupCall(false);
    }, [localStream, call, socket, callLogId, callDuration, isGroupCall, authUser, callAccepted]);

    const rejectCall = useCallback(async () => {
        if (call.logId) {
            axios.put(`/api/messages/calls/update/${call.logId}`, { status: "rejected" }).catch(e => console.error(e));
        }
        setCall({ isReceivingCall: false });
        socket.emit('endCall', { to: call.from });
    }, [call, socket]);

    useEffect(() => {
        if (!socket) return;
        
        const handleIncomingCall = ({ from, callerName, signal, logId, groupName }) => {
            console.log("Socket: Incoming call signal received from", callerName);
            setCall({ isReceivingCall: true, from, callerName, signal, logId, groupName });
        };

        const handleCallAccepted = (signal) => {
            console.log("Socket: callAccepted signal received back at Initiator");
            if (peerRef.current) {
                setCallAccepted(true);
                startTimer();
                peerRef.current.signal(signal);
            } else {
                console.warn("Socket: Received callAccepted but peerRef.current is empty!");
            }
        };

        const handleCallEnded = () => {
            console.log("Socket: callEnded received");
            endCall(false);
        };

        socket.on('incomingCall', handleIncomingCall);
        socket.on('callAccepted', handleCallAccepted);
        socket.on('callEnded', handleCallEnded);

        return () => {
            socket.off('incomingCall', handleIncomingCall);
            socket.off('callAccepted', handleCallAccepted);
            socket.off('callEnded', handleCallEnded);
        };
    }, [socket, endCall]);

    return (
        <VideoCallContext.Provider value={{
            call,
            callAccepted,
            localStream,
            remoteStream,
            callEnded,
            callDuration,
            showVideoModal,
            isGroupCall,
            callUser,
            endCall,
            answerCall,
            rejectCall,
            authUser,
        }}>
            {children}
            {call.isReceivingCall && !callAccepted && (
                <IncomingCall 
                    callerName={call.groupName ? `${call.groupName} (${call.callerName})` : call.callerName}
                    onAnswer={answerCall}
                    onReject={rejectCall}
                />
            )}
            {showVideoModal && (
                <VideoCall 
                    onClose={() => setShowVideoModal(false)}
                    isGroupCall={isGroupCall}
                />
            )}
        </VideoCallContext.Provider>
    );
};
