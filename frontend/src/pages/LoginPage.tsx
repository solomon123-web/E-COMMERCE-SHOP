import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(email, password);
      navigate('/account');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to log in.');
    }
  };

  return (
    <div className="container page-space auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Log in</h1>
        {error ? <p className="form-error">{error}</p> : null}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button type="submit" className="primary-button full-width">Log in</button>
        <p className="auth-link">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
