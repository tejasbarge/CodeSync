import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api, { googleAuth } from '../api';
import toast from 'react-hot-toast';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/register', formData);
            if (response.status === 201) {
                toast.success('Registration successful!');
                // Auto login or redirect to login. Let's follow the plan: redirect to dashboard if possible, but we need a token.
                // For now, let's just go to login to be safe unless we implement auto-login.
                navigate('/login');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const data = await googleAuth(credentialResponse.credential);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success(`Welcome, ${data.user.username}!`);
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Google Auth failed');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] p-8 rounded-xl shadow-2xl w-full max-w-md border border-[var(--border-color)]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[var(--text-main)] mb-2">
                        Code<span className="text-[var(--color-accent)]">Sync</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm">Create an account to save your progress</p>
                </div>
                
                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Username</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Choose a username"
                            className="bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-md outline-none border border-[var(--border-color)] focus:border-[var(--color-accent)] transition-colors"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Your email address"
                            className="bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-md outline-none border border-[var(--border-color)] focus:border-[var(--color-accent)] transition-colors"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Min 6 characters"
                            className="bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-md outline-none border border-[var(--border-color)] focus:border-[var(--color-accent)] transition-colors"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="bg-[var(--color-accent)] text-black font-bold py-3 rounded-md mt-4 hover:bg-[var(--color-accent-hover)] transition-all transform active:scale-[0.98] shadow-lg shadow-[var(--color-accent)]/10"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-700"></div>
                    <span className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">OR</span>
                    <div className="flex-1 h-px bg-gray-700"></div>
                </div>

                <div className="flex justify-center w-full [&>div]:w-full [&>div>div]:w-full relative z-10">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => { toast.error('Google Signup Failed'); }}
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        text="continue_with"
                        width="100%"
                    />
                </div>
                
                <div className="mt-8 text-center text-sm text-[var(--text-muted)]">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[var(--color-accent)] hover:underline font-semibold">
                        Log In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
