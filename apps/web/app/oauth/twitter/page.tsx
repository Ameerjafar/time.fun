
'use client'
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TwitterHandler = () => {
    const params = useSearchParams();
    const router = useRouter();
    const { login } = useAuth();
    const accessCode = params.get("code");
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>("");
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        const handleTwitterCallback = async () => {
            if (!accessCode) {
                console.log(1);
                setStatus('error');
                setMessage('No authorization code received');
                return;
            }

            try {

                if (sessionStorage.getItem('isTwitterConnected') === "true"){
                    return
                }
                const codeVerifier = sessionStorage.getItem("code_verifier");
                if (!codeVerifier) {
                    setStatus('error');
                    setMessage('No code verifier found');
                    return;
                }

                const response = await axios.post(
                    `http://localhost:5000/auth/twitter/callback?code=${accessCode}`, 
                    { codeVerifier }
                );
                
                if (response.data.user) {
                    const userData = response.data.user;
                    setUserName(userData.name || response.data.twitterName);
                    setStatus('success');
                    setMessage('Successfully logged in with Twitter!');                    
                    
                    // Login the user with full data
                    login({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        twitterHandle: userData.twitterHandle || response.data.twitterHandle,
                        avatar: userData.profilePicture,
                        isTwitterConnected: true,
                    });

                    sessionStorage.setItem('isTwitterConnected',"true")

                    // Clear the code verifier
                    sessionStorage.removeItem("code_verifier");

                    // Redirect to home page after 2 seconds
                    setTimeout(() => {
                        router.push('/');
                    }, 200);
                } else {
                    setStatus('error');
                    setMessage('Failed to get user information');
                }
            } catch (error: any) {
                console.error('Twitter callback error:', error);
                setStatus('error');
                const errorMsg = error.response?.data?.error || 
                                error.response?.data?.message || 
                                error.message || 
                                'An error occurred during login';
                setMessage(errorMsg);
            }
        };
        handleTwitterCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center"
            >
                {status === 'loading' && (
                    <div className="space-y-4">
                        <Loader2 className="w-16 h-16 text-secondary mx-auto animate-spin" />
                        <h2 className="text-2xl font-bold text-white">Connecting to Twitter</h2>
                        <p className="text-gray-400">Please wait while we authenticate your account...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                        <h2 className="text-2xl font-bold text-white">Welcome, {userName}!</h2>
                        <p className="text-gray-400">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to home page...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                        <h2 className="text-2xl font-bold text-white">Login Failed</h2>
                        <p className="text-gray-400">{message}</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push('/')}
                            className="bg-secondary text-black px-6 py-3 rounded-lg font-bold hover:bg-secondary/90 transition-colors duration-200"
                        >
                            Return to Home
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default TwitterHandler;