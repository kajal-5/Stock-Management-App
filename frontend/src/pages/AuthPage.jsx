import { useState } from 'react';
import Brand from '../components/Brand.jsx';

export default function AuthPage({ onLogin, error }) {
  const [mode, setMode] = useState('login');
  async function submit(event) {
    event.preventDefault();
    await onLogin(mode, Object.fromEntries(new FormData(event.currentTarget)));
  }
  return <main className="auth"><section className="authbox"><Brand />
    <h1>{mode === 'login' ? 'Welcome back' : 'Create your store'}</h1>
    <p className="muted">Simple inventory, all in one place.</p>
    <form onSubmit={submit} className="stack">
      {mode === 'signup' && <>
        <label>Your name<input name="name" required /></label>
        <label>Organization<input name="organization" required /></label>
      </>}
      <label>Email<input name="email" type="email" required /></label>
      <label>Password<input name="password" type="password" minLength="6" required /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
    </form>
    <p className="muted switch">{mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
      <a onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create account' : 'Log in'}</a>
    </p>
  </section></main>;
}
