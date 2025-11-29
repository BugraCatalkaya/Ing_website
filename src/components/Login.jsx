import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
        } catch (err) {
            console.error(err);
            let msg = 'Failed to ' + (isLogin ? 'log in' : 'sign up');
            if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
            if (err.code === 'auth/user-not-found') msg = 'User not found.';
            if (err.code === 'auth/wrong-password') msg = 'Wrong password.';
            if (err.code === 'auth/email-already-in-use') msg = 'Email already in use.';
            if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
            setError(msg);
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>WordMaster 🎓</h1>
                    <p>{isLogin ? 'Welcome back!' : 'Create your account'}</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>
                    <button disabled={loading} type="submit" className="login-btn">
                        {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
