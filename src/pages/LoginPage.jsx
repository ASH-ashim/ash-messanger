import React, { useContext, useState } from 'react';
import assets from '../assets/assets'; 
import { AuthContext } from '../../context/AuthContext'; 
import Login from '../../public/login.jpg'

import toast from 'react-hot-toast';

const LoginPage = () => {
    const [currState, setCurrState] = useState("Sign up");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [bio, setBio] = useState("");
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 


    const { login, signup } = useContext(AuthContext);


    const onSubmitHandler = async (event) => {
        event.preventDefault(); 
        setIsLoading(true);

        try {
            if (!email || !password) {
                toast.error("Email and password are required.");
                setIsLoading(false);
                return;
            }
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                toast.error("Please enter a valid email.");
                setIsLoading(false);
                return;
            }
            if (password.length < 6) {
                toast.error("Password must be at least 6 characters.");
                setIsLoading(false);
                return;
            }

            if (currState === 'Sign up') {
                if (!isDataSubmitted) {

                    if (!fullName) {
                        toast.error("Full Name is required for signup.");
                        setIsLoading(false);
                        return;
                    }
                    setIsDataSubmitted(true);
                    setIsLoading(false);
                    return;
                } else {

                    if (!bio) {
                        toast.error("Bio is required to complete signup.");
                        setIsLoading(false);
                        return;
                    }

                    console.log("CLIENT (LoginPage): Attempting SIGN UP with data:", { fullName, email: email.trim(), password, bio });
                    const success = await signup({ fullName, email: email.trim(), password, bio });

                    if (success) {
                        toast.success("Signup successful! You can now log in.");
                        setEmail("");
                        setPassword("");
                        setFullName("");
                        setBio("");
                        setIsDataSubmitted(false);

                    } else {

                        console.log("CLIENT (LoginPage): Signup failed.");
                    }
                }
            } else { 

                console.log("CLIENT (LoginPage): Attempting LOGIN with data:", { email: email.trim(), password });
                const success = await login({ email: email.trim(), password });

                if (success) {
                    toast.success("Login successful!");

                    setEmail("");
                    setPassword("");

                } else {
                    console.log("CLIENT (LoginPage): Login failed.");
                }
            }

        } catch (error) {
            console.error("LoginPage onSubmitHandler error:", error);
        } finally {
            setIsLoading(false); 
        }
    };
    const resetForm = () => {
        setEmail("");
        setPassword("");
        setFullName("");
        setBio("");
        setIsDataSubmitted(false); 
        setIsLoading(false); 
    };


    return (
        <div className='min-h-[100dvh] w-full relative overflow-y-auto'>
            {/* Full Screen Background Image */}
            <div 
                className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105"
                style={{ backgroundImage: `url(${Login})` }}
            />
            
            {/* Gradient Overlays for depth */}
            <div className="fixed inset-0 bg-gradient-to-br from-violet-900/70 via-black/50 to-indigo-900/70" />
            <div className="fixed inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            
            {/* Animated Floating Orbs */}
            <div className="fixed top-20 left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="fixed bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="fixed top-1/2 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />

            {/* Content Container */}
            <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-10 md:gap-14 lg:gap-20 px-6 py-12 md:py-20 lg:py-10">
                
                {/* Left Side - Logo & Branding */}
                <div className="flex flex-col items-center lg:items-start gap-4 md:gap-6 animate-in fade-in slide-in-from-top lg:slide-in-from-left duration-700">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                        <img 
                            src='image.png' 
                            alt="Logo" 
                            className="relative w-24 md:w-32 lg:w-48 2xl:w-64 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                        />
                    </div>
                    <div className="text-center lg:text-left hidden md:block">
                        <h1 className="text-2xl md:text-3xl lg:text-5xl 2xl:text-7xl font-black text-white tracking-tight leading-tight">
                            Connect <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Instantly</span>
                        </h1>
                        <p className="text-white/50 mt-1 md:mt-2 text-xs md:text-sm lg:text-base 2xl:text-xl max-w-xs 2xl:max-w-md">
                            Join millions of users sharing moments together
                        </p>
                    </div>
                </div>

                {/* Right Side - Glass Card Form */}
                <div className="w-full max-w-md 2xl:max-w-2xl animate-in fade-in slide-in-from-bottom lg:slide-in-from-right duration-700 delay-200">
                    <form 
                        onSubmit={onSubmitHandler}
                        className='relative backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-5 md:p-8 2xl:p-12 shadow-2xl shadow-black/30'
                    >
                        {/* Glow effect behind card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-transparent to-indigo-600/20 rounded-3xl blur-xl -z-10" />
                        
                        {/* Header */}
                        <div className='flex justify-between items-center mb-6 md:mb-8'>
                            <div>
                                <h2 className='text-xl md:text-3xl 2xl:text-5xl font-bold text-white'>
                                    {currState === "Sign up" ? "Create Account" : "Welcome Back"}
                                </h2>
                                <p className="text-white/40 text-xs md:text-sm 2xl:text-lg mt-1">
                                    {currState === "Sign up" 
                                        ? (isDataSubmitted ? "Almost there! Tell us about yourself" : "Fill in your details to get started")
                                        : "Sign in to continue chatting"
                                    }
                                </p>
                            </div>
                            {currState === "Sign up" && isDataSubmitted && (
                                <button
                                    type="button"
                                    onClick={() => setIsDataSubmitted(false)}
                                    className='p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95'
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {currState === "Sign up" && !isDataSubmitted && (
                                <div className="group">
                                    <label className="block text-xs font-semibold text-white/60 mb-1 md:mb-2 uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <input
                                            onChange={(e) => setFullName(e.target.value)}
                                            value={fullName}
                                            type="text"
                                            className='w-full p-3 md:p-4 2xl:p-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 2xl:text-xl'
                                            placeholder="John Doe"
                                            required 
                                        />
                                    </div>
                                </div>
                            )}

                            {!isDataSubmitted && (
                                <>
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-white/60 mb-1 md:mb-2 uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <input
                                                onChange={(e) => setEmail(e.target.value)}
                                                value={email}
                                                type="email"
                                                placeholder='you@example.com'
                                                required 
                                                className='w-full p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300'
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-semibold text-white/60 mb-1 md:mb-2 uppercase tracking-wider">Password</label>
                                        <div className="relative">
                                            <input
                                                onChange={(e) => setPassword(e.target.value)}
                                                value={password}
                                                type="password"
                                                placeholder='••••••••'
                                                required 
                                                className='w-full p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300'
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currState === "Sign up" && isDataSubmitted && (
                                <div className="group animate-in fade-in slide-in-from-right duration-300">
                                    <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Your Bio</label>
                                    <textarea
                                        onChange={(e) => setBio(e.target.value)}
                                        value={bio}
                                        rows={4}
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 resize-none"
                                        placeholder='Tell us a bit about yourself...'
                                        required 
                                    />
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full mt-6 py-3 md:py-4 relative overflow-hidden rounded-xl font-bold text-white transition-all duration-300 active:scale-[0.98] ${
                                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-violet-500/25'
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {currState === "Sign up"
                                            ? (isDataSubmitted ? "Complete Sign Up" : "Continue")
                                            : "Sign In"}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>

                        {/* Terms Checkbox */}
                        <label className='flex items-center gap-3 mt-4 md:mt-5 cursor-pointer group'>
                            <div className="relative">
                                <input type="checkbox" required className="peer sr-only" />
                                <div className="w-5 h-5 border-2 border-white/20 rounded-md peer-checked:bg-violet-500 peer-checked:border-violet-500 transition-all duration-200" />
                                <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className='text-xs md:text-sm text-white/50 group-hover:text-white/70 transition-colors'>
                                I agree to the <span className="text-violet-400 hover:underline">Terms</span> & <span className="text-violet-400 hover:underline">Privacy</span>
                            </span>
                        </label>

                        {/* Toggle Login/Signup */}
                        <div className='mt-5 md:mt-6 pt-5 md:pt-6 border-t border-white/10 text-center'>
                            {currState === "Sign up" ? (
                                <p className='text-xs md:text-sm text-white/50'>
                                    Already have an account?{' '}
                                    <button 
                                        type="button"
                                        onClick={() => { setCurrState("Login"); resetForm(); }}
                                        className='font-semibold text-violet-400 hover:text-violet-300 transition-colors'
                                    >
                                        Sign In
                                    </button>
                                </p>
                            ) : (
                                <p className='text-xs md:text-sm text-white/50'>
                                    Don't have an account?{' '}
                                    <button 
                                        type="button"
                                        onClick={() => { setCurrState("Sign up"); resetForm(); }}
                                        className='font-semibold text-violet-400 hover:text-violet-300 transition-colors'
                                    >
                                        Create One
                                    </button>
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

