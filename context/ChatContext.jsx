
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext"; 
import axios from "axios";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [callLogs, setCallLogs] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);


    const { socket, authUser } = useContext(AuthContext);



    const getUsers = useCallback(async () => {
        if (!authUser?._id) {
            setUsers([]);
            return;
        }

        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages || {});
            } else {
                toast.error(data.message || "Failed to fetch users.");
                setUsers([]);
            }
        } catch (error) {
            console.error("ChatContext: Error fetching users:", error);
            setUsers([]);
        }
    }, [authUser?._id]);

    const getGroups = useCallback(async () => {
        if (!authUser?._id) return;
        try {
            const { data } = await axios.get("/api/messages/groups/all");
            if (data.success) {
                setGroups(data.groups);
            }
        } catch (error) {
            console.error("ChatContext: Error fetching groups:", error);
        }
    }, [authUser?._id]);

    const createGroup = async (groupData) => {
        try {
            const { data } = await axios.post("/api/messages/groups/create", groupData);
            if (data.success) {
                setGroups(prev => [...prev, data.group]);
                toast.success("Group created successfully!");
                return data.group;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
        }
    };

    const getCallLogs = useCallback(async () => {
        if (!authUser?._id) return;
        try {
            const { data } = await axios.get("/api/messages/calls/history");
            if (data.success) {
                setCallLogs(data.logs);
            }
        } catch (error) {
            console.error("ChatContext: Error fetching call logs:", error);
        }
    }, [authUser?._id]);


    const getMessages = useCallback(async (userId) => {
        if (!userId) {
            setMessages([]);
            return;
        }
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            } else {
                toast.error(data.message || "Failed to fetch messages.");
                setMessages([]);
            }
        } catch (error) {
            console.error(`ChatContext: Error fetching messages:`, error);
            setMessages([]);
        }
    }, []);


    const sendMessage = useCallback(async (messageData) => {
        if (!selectedUser?._id && !selectedGroup?._id) {
            toast.error("No receiver selected.");
            return;
        }
        
        const endpoint = selectedGroup ? `/api/messages/send/group/${selectedGroup._id}` : `/api/messages/send/${selectedUser._id}`;
        
        try {
            const { data } = await axios.post(endpoint, messageData);
            if (data.success) {
                setMessages((prevMessages) => {
                    if (!prevMessages.some(msg => msg._id === data.newMessage._id)) {
                        return [...prevMessages, data.newMessage];
                    }
                    return prevMessages;
                });
            } else {
                toast.error(data.message || "Failed to send message.");
            }
        } catch (error) {
            console.error("ChatContext: Error sending message:", error);
            toast.error("Failed to send message.");
        }
    }, [selectedUser?._id, selectedGroup?._id]);


    const deleteMessage = useCallback(async (messageId) => {
        try {
            const { data } = await axios.delete(`/api/messages/delete/${messageId}`);
            if (data.success) {
                setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
            } else {
                toast.error(data.message || "Failed to delete message.");
            }
        } catch (error) {
            console.error("ChatContext: Error deleting message:", error);
            toast.error("Failed to delete message.");
        }
    }, []);



    const subscribeToEvents = useCallback(() => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            if ((selectedUser && newMessage.senderId === selectedUser._id) || (selectedGroup && newMessage.groupId === selectedGroup._id)) {
                setMessages((prevMessages) => {
                    if (!prevMessages.some(msg => msg._id === newMessage._id)) {
                        return [...prevMessages, { ...newMessage, seen: true }];
                    }
                    return prevMessages;
                });
            } else {
                const id = newMessage.groupId || newMessage.senderId;
                setUnseenMessages((prev) => ({
                    ...prev,
                    [id]: (prev[id] || 0) + 1
                }));
            }
        });

        socket.on("messageDeleted", (messageId) => {
            setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
        });

        socket.on("newGroup", (newGroup) => {
            setGroups(prev => {
                if (prev.some(g => g._id === newGroup._id)) return prev;
                return [...prev, newGroup];
            });
            toast.success(`You were added to group: ${newGroup.name}`);
        });

        socket.on("groupUpdated", (updatedGroup) => {
            setGroups(prev => prev.map(g => g._id === updatedGroup._id ? updatedGroup : g));
            if (selectedGroup?._id === updatedGroup._id) {
                setSelectedGroup(updatedGroup);
            }
        });

    }, [socket, selectedUser, selectedGroup]);


    const unsubscribeFromEvents = useCallback(() => {
        if (socket) {
            socket.off("newMessage");
            socket.off("messageDeleted");
            socket.off("newGroup");
            socket.off("groupUpdated");
        }
    }, [socket]);


    useEffect(() => {
        if (socket) {
            subscribeToEvents();
            return () => unsubscribeFromEvents();
        }
    }, [socket, subscribeToEvents, unsubscribeFromEvents]);

    useEffect(() => {
        if (authUser) {
            getUsers();
            getGroups();
            getCallLogs();
        }
    }, [authUser, getUsers, getGroups, getCallLogs]);

    const updateGroup = async (groupId, updateData) => {
        try {
            const { data } = await axios.put(`/api/messages/groups/update/${groupId}`, updateData);
            if (data.success) {
                setGroups(prev => prev.map(g => g._id === groupId ? data.group : g));
                if (selectedGroup?._id === groupId) {
                    setSelectedGroup(data.group);
                }
                toast.success("Group updated!");
                return data.group;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update group");
        }
    };

    const value = {
        messages,
        setMessages,
        users,
        groups,
        callLogs,
        selectedUser,
        selectedGroup,
        unseenMessages,
        leftSidebarOpen,
        setLeftSidebarOpen,
        rightSidebarOpen,
        setRightSidebarOpen,
        getUsers,
        getGroups,
        createGroup,
        updateGroup,
        getCallLogs,
        getMessages,
        sendMessage,
        deleteMessage,
        setSelectedUser,
        setSelectedGroup,
        setUnseenMessages
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
