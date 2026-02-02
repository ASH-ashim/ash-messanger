import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

// Ensure backendUrl is correctly loaded from environment variables
const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));

    const [authUser, setAuthUser] = useState(null);

    const [onlineUsers, setOnlineUsers] = useState([]);

    const [socket, setSocket] = useState(null);
    const navigate = useNavigate(); 

    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/users/check-auth");
            if (data.success) {
                setAuthUser(data.user); 
                connectSocket(data.user); 
            }
        } catch (error) {
            handleAuthError(error);
        }
    };


    const handleAuth = async (endpoint, credentials) => {
        try {
            const { data } = await axios.post(endpoint, credentials);

            if (!data.success) {
                throw new Error(data.message); 
            }

            setAuthUser(data.user);
            connectSocket(data.user);
            setToken(data.token);
            localStorage.setItem("token", data.token); 
            axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
            toast.success(data.message || "Success!");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "An unexpected error occurred.");
            return false;
        }
    };


    const login = (credentials) => handleAuth("/api/users/login", credentials);
    const signup = (credentials) => handleAuth("/api/users/signup", credentials);

    const logout = () => {
        localStorage.removeItem("token"); 
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        delete axios.defaults.headers.common["Authorization"]; 
        toast.success("Logged out successfully"); 
        if (socket) socket.disconnect(); 
        navigate("/login"); 
    };

    const updateProfile = async (profileData) => {
        try {
            const formData = new FormData();
            formData.append("fullName", profileData.fullName);
            formData.append("bio", profileData.bio);


            if (profileData.profilePic instanceof File) {
                formData.append("profilePic", profileData.profilePic);
            }

            const { data } = await axios.put("/api/users/update-profile", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated!"); 
                return true;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to update profile.");
            if (error.response?.status === 401) logout(); 
            return false;
        }
    };


    const connectSocket = (userData) => {

        if (!userData || socket?.connected) return;

        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ["websocket", "polling"], // Try websocket first, then poll
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        newSocket.on("getOnlineUsers", (users) => {
            setOnlineUsers(users);
        });

        setSocket(newSocket); 
    };


    const handleAuthError = (error) => {
        console.error("Authentication error:", error);
        logout();
    };


    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; 
            checkAuth(); 
        }
    }, [token]); 
    useEffect(() => {
        return () => {
            if (socket) socket.disconnect(); 
        };
    }, [socket]); 

    // Helper for VAPID key conversion
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
      
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
      
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Subscribe to Push Notifications function
    const subscribeToPush = async (forceRequest = false) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            let permission = Notification.permission;
            
            // If we're forcing a request or permission is default, ask the user
            if (forceRequest || permission === 'default') {
                // Return if this is not a user gesture and we're not forcing it
                if (!forceRequest) return; 
                permission = await Notification.requestPermission();
            }

            if (permission === 'granted') {
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    const subscribeOptions = {
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array('BKi_XZtMnshP2CMhFA0gweMQgBbnbP1GQuHLv3EnwFf14I1xZH7-g_fVwdQtBCooRrP94PuglgUflNz3Zc1pHog')
                    };
                    subscription = await registration.pushManager.subscribe(subscribeOptions);
                }
                
                await axios.post('/api/messages/subscribe', { subscription });
                console.log("Push notification subscribed");
                return true;
            }
            return false;
        } catch (err) {
            console.error("Push subscription failed:", err);
            return false;
        }
    };

    // Auto-subscribe only if permission is ALREADY granted
    useEffect(() => {
        if (authUser && Notification.permission === 'granted') {
            subscribeToPush();
        }
    }, [authUser]); 


    return (
        <AuthContext.Provider
            value={{
                authUser,
                onlineUsers,
                socket,
                token,
                login,
                signup,
                logout,
                updateProfile,
                checkAuth,
                subscribeToPush,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
