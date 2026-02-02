import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import Profile from "../../public/profile.jpg"

const ProfilePage = () => {
    const { authUser, updateProfile, token, subscribeToPush } = useContext(AuthContext);
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [newProfilePic, setNewProfilePic] = useState(null);
    const [previewProfilePicUrl, setPreviewProfilePicUrl] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    useEffect(() => {
        if (!token) {
            toast.error('Please login to access this page');
            navigate('/login');
        } else if (authUser) {
            setFullName(authUser.fullName || '');
            setBio(authUser.bio || '');
            setNewProfilePic(null);
            setPreviewProfilePicUrl(null);
        }
    }, [authUser, token, navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewProfilePic(file);
            setPreviewProfilePicUrl(URL.createObjectURL(file));
        } else {
            setNewProfilePic(null);
            setPreviewProfilePicUrl(null);
        }
    };

    const handleEnableNotifications = async () => {
        const success = await subscribeToPush(true);
        if (success) {
            setNotificationPermission('granted');
            toast.success("Notifications enabled!");
        } else {
            setNotificationPermission(Notification.permission);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("You are not authenticated.");
            return;
        }

        setIsUpdating(true);

        const profileData = {
            fullName,
            bio,
            profilePic: newProfilePic
        };

        try {
            const success = await updateProfile(profileData);
            if (success) {
                toast.success("Profile updated successfully!");
                setNewProfilePic(null);
                setPreviewProfilePicUrl(null);
            }
        } catch (error) {
            console.error("Profile update error in component:", error);
            toast.error("Failed to update profile.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!authUser) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#0f0f1a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-white/60 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    const displayImageUrl = previewProfilePicUrl || authUser.profilePic;
    const hasProfileImage = !!displayImageUrl;

    return (
        <div className="min-h-[100dvh] w-full relative overflow-y-auto">
            {/* Full Screen Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
                style={{ backgroundImage: `url(${Profile})` }}
            />
            
            {/* Dark Overlay to reduce brightness */}
            <div className="absolute inset-0 bg-black/70" />
            
            {/* Gradient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-black/50 to-indigo-900/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

            {/* Subtle animated orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4 md:p-8 py-12 md:py-20">
                <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Main Glassmorphism Card */}
                    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                        
                        {/* Card Glow Effect */}
                        <div className="absolute -inset-px bg-gradient-to-b from-violet-500/20 via-transparent to-indigo-500/20 rounded-3xl -z-10 blur-sm" />
                        
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/')}
                            className="absolute top-4 left-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white hover:bg-white/20 transition-all active:scale-95 z-20"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Profile Image Section */}
                        <div className="relative pt-12 md:pt-16 flex flex-col items-center px-4 md:px-8 pb-8">
                            {/* Profile Picture with Ring */}
                            <label htmlFor="profilePicUpload" className="cursor-pointer group">
                                <input
                                    id="profilePicUpload"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className='hidden'
                                />
                                <div className="relative">
                                    {/* Simple minimal border */}
                                    <div className="absolute -inset-1 bg-white/20 rounded-full" />
                                    
                                    {/* Image Container */}
                                    <div className='relative w-32 h-32 rounded-full overflow-hidden border-2 border-white/30 bg-[#1e1e2e] flex items-center justify-center'>
                                        {hasProfileImage ? (
                                            <img
                                                src={displayImageUrl}
                                                alt="Profile"
                                                className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <FaUser className="w-16 h-16 text-white/40" />
                                        )}
                                        
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="flex flex-col items-center gap-1">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-xs text-white/80">Change</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* User Info */}
                            <div className="mt-5 text-center">
                                <h1 className="text-2xl font-bold text-white">{authUser.fullName}</h1>
                                <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {authUser.email}
                                </p>
                            </div>

                            {/* Edit Form */}
                            <form onSubmit={handleSubmit} className='w-full mt-6 md:mt-8 space-y-4 md:space-y-5'>
                                {/* Full Name Field */}
                                <div className="group">
                                    <label htmlFor="fullName" className='block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider'>Full Name</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className='w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300'
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Bio Field */}
                                <div className="group">
                                    <label htmlFor="bio" className='block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider'>Bio</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-4 text-white/30">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                            </svg>
                                        </div>
                                        <textarea
                                            id="bio"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={3}
                                            className='w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 resize-none'
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>
                                </div>

                                {/* Notification Settings */}
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${notificationPermission === 'granted' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Push Notifications</p>
                                            <p className="text-[10px] text-white/30 uppercase tracking-wider">{notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}</p>
                                        </div>
                                    </div>
                                    {notificationPermission !== 'granted' && (
                                        <button 
                                            type="button"
                                            onClick={handleEnableNotifications}
                                            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                                        >
                                            Enable
                                        </button>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 pt-4">
                                    {/* Save Button */}
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className={`w-full py-4 relative overflow-hidden rounded-xl font-bold text-gray-900 transition-all duration-300 active:scale-[0.98] ${
                                            isUpdating ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-amber-500/25'
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {isUpdating ? (
                                                <>
                                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Saving Changes...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Save Changes
                                                </>
                                            )}
                                        </span>
                                    </button>

                                    {/* Back to Home Button */}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="w-full py-4 bg-white/5 border border-white/10 text-white/70 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all duration-300 active:scale-[0.98]"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            Back to Home
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Footer Text */}
                    <p className="text-center text-white/20 text-xs mt-6 pb-10 md:pb-0">
                        Your profile helps others recognize you
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
