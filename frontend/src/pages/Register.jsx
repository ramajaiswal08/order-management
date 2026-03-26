import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { motion } from 'framer-motion';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card" 
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              required
              value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input 
              type="email" 
              required
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              required
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Register</button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
