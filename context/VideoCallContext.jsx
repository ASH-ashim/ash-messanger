
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import Peer from 'simple-peer';
import { AuthContext } from './AuthContext';
import axios from 'axios';
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
    const [peers, setPeers] = useState([]); // For group UI
    const groupPeersRef = useRef([]); // [{ peerID, peer }]

    const peerRef = useRef(); // For one-to-one
    const timerRef = useRef();

    const mediaStreamPromise = useRef(null);
    const mediaRequestPending = useRef(false);

    const getMediaStream = useCallback(async () => {
        if (localStream) return localStream;
        if (mediaStreamPromise.current) return mediaStreamPromise.current;

        mediaStreamPromise.current = (async () => {
            try {
                console.log("VideoContext: Requesting camera/mic...");
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                return stream;
            } catch (error) {
                console.error("VideoContext: Device access error:", error);
                mediaStreamPromise.current = null;
                return null;
            }
        })();

        return mediaStreamPromise.current;
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

        if (call.groupName) {
            console.log("VideoContext: Answering group call for room:", call.groupId);
            setIsGroupCall(true);
            socket.emit("joinRoom", { roomId: call.groupId, userId: authUser._id });
            return;
        }

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
        });

        console.log("VideoContext: Signaling peer with received data...");
        peer.signal(call.signal);
        peerRef.current = peer;

        if (call.logId) {
            setCallLogId(call.logId);
            axios.put(`/api/messages/calls/update/${call.logId}`, { status: "ongoing" }).catch(e => console.error(e));
        }
    }, [call, socket, authUser?._id, getMediaStream]);

    const callUser = useCallback(async (id, isGroup = false, groupMembers = [], groupName = "") => {
        if (mediaRequestPending.current) return;
        const stream = await getMediaStream();
        if (!stream) return;

        console.log(`VideoContext: Initiating call to ${id}...`);
        setIsGroupCall(isGroup);
        setShowVideoModal(true);
        // Store call info so we know who to disconnect from if we hang up early
        setCall(prev => ({ ...prev, userToCall: id, isReceivingCall: false }));

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

        if (isGroup) {
            console.log("VideoContext: Direct Notification sent to group members");
            groupMembers.forEach(memberId => {
                if (memberId !== authUser?._id) {
                    socket.emit('callUser', {
                        userToCall: memberId,
                        from: authUser?._id,
                        callerName: authUser?.fullName,
                        logId: logId,
                        groupName: groupName,
                        groupId: id // Send the actual group ID
                    });
                }
            });
            // Initiator joins the room to start mesh logic
            socket.emit("joinRoom", { roomId: id, userId: authUser._id });
            return;
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
            socket.emit('callUser', {
                userToCall: id,
                signalData: data,
                from: authUser._id,
                callerName: authUser.fullName,
                logId: logId
            });
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

    const handleUserJoined = useCallback(async ({ userId, signal }) => {
        console.log("VideoContext: Group User Event:", userId, signal ? "SignalReceived" : "NewUserJoined");

        // Prevent duplicate peers for the same user
        if (groupPeersRef.current.find(p => p.peerID === userId)) {
            console.log("VideoContext: Peer already exists for", userId);
            return;
        }

        const stream = await getMediaStream();
        if (!stream) return;

        if (signal) {
            console.log("VideoContext: Responding to signal from", userId);
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream,
                config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
            });

            peer.on('signal', (data) => {
                socket.emit('returningSignal', { signal: data, callerId: userId });
            });

            peer.on('stream', (incomingStream) => {
                setPeers(prev => {
                    if (prev.find(p => p.peerID === userId)) return prev;
                    return [...prev, { peerID: userId, stream: incomingStream }];
                });
            });

            peer.on('error', (err) => console.error("VideoContext: Group Peer Error (Responder):", err));

            peer.signal(signal);
            groupPeersRef.current.push({ peerID: userId, peer });
        } else {
            console.log("VideoContext: Initiating to new user", userId);
            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream,
                config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
            });

            peer.on('signal', (data) => {
                socket.emit('sendingSignal', { userToSignal: userId, callerId: authUser?._id, signal: data });
            });

            peer.on('stream', (incomingStream) => {
                setPeers(prev => {
                    if (prev.find(p => p.peerID === userId)) return prev;
                    return [...prev, { peerID: userId, stream: incomingStream }];
                });
            });

            peer.on('error', (err) => console.error("VideoContext: Group Peer Error (Initiator):", err));

            groupPeersRef.current.push({ peerID: userId, peer });
        }
    }, [getMediaStream, socket, authUser?._id]);

    const handleReceivedSignal = useCallback(({ signal, id }) => {
        console.log("VideoContext: Processing returned signal from participant", id);
        const peerObj = groupPeersRef.current.find(p => p.peerID === id);
        if (peerObj && peerObj.peer) {
            peerObj.peer.signal(signal);
        } else {
            console.warn("VideoContext: Received signal for unknown peer", id);
        }
    }, []);

    const handleUserLeft = useCallback(({ userId }) => {
        console.log("VideoContext: User left group call:", userId);
        const peerObj = groupPeersRef.current.find(p => p.peerID === userId);
        if (peerObj && peerObj.peer) {
            peerObj.peer.destroy();
            groupPeersRef.current = groupPeersRef.current.filter(p => p.peerID !== userId);
        }
        setPeers(prev => prev.filter(p => p.peerID !== userId));
    }, []);

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
                socket.emit('leaveRoom', { roomId: call.groupId || call.userToCall, userId: authUser._id });
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

        // Clean up group peers
        groupPeersRef.current.forEach(p => {
            if (p.peer) p.peer.destroy();
        });
        groupPeersRef.current = [];
        setPeers([]);

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
        mediaStreamPromise.current = null;
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

        const handleIncomingCall = ({ from, callerName, signal, logId, groupName, groupId }) => {
            console.log("Socket: Incoming call signal received from", callerName);
            setCall({ isReceivingCall: true, from, callerName, signal, logId, groupName, groupId });
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
        socket.on('userJoinedRoom', handleUserJoined);
        socket.on('receivingSignalFromJoiningUser', handleUserJoined);
        socket.on('receivingReturnedSignal', handleReceivedSignal);
        socket.on('userLeft', handleUserLeft);

        return () => {
            socket.off('incomingCall', handleIncomingCall);
            socket.off('callAccepted', handleCallAccepted);
            socket.off('callEnded', handleCallEnded);
            socket.off('userJoinedRoom', handleUserJoined);
            socket.off('receivingSignalFromJoiningUser', handleUserJoined);
            socket.off('receivingReturnedSignal', handleReceivedSignal);
            socket.off('userLeft', handleUserLeft);
        };
    }, [socket, endCall, handleUserJoined, handleReceivedSignal, handleUserLeft]);

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
            peers,
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
