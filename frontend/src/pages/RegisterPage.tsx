import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await register(name, email, password);
      navigate('/account');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account.');
    }
  };

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL ?? '/api';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="container page-space auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Create your account</p>
        <h1>Register</h1>
        {error ? <p className="form-error">{error}</p> : null}
        <label>
          Full name
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button type="submit" className="primary-button full-width">Create account</button>
        <button type="button" className="secondary-button full-width" onClick={handleGoogleLogin}>
          Continue with Google
        </button>
        <p className="auth-link">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
