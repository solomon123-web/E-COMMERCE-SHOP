import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(email, password);
      navigate('/account');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to log in.');
    }
  };

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL ?? '/api';
    window.location.href = `${apiBase}/auth/google`;
  };

  const googleError = searchParams.get('error');
  const displayError = error || (googleError ? 'Google sign-in failed. Please try again.' : '');

  return (
    <div className="container page-space auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Log in</h1>
        {displayError ? <p className="form-error">{displayError}</p> : null}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button type="submit" className="primary-button full-width">Log in</button>
        <button type="button" className="secondary-button full-width" onClick={handleGoogleLogin}>
          Continue with Google
        </button>
        <p className="auth-link">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
