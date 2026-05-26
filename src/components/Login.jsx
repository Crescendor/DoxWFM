import React, { useState } from 'react';
import { ShieldAlert, User, Lock, ArrowRight, RefreshCw } from 'lucide-react';

export default function Login({ onLogin, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Lütfen kullanıcı adı ve şifre giriniz.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || "Giriş yapılamadı. Bilgilerinizi kontrol edin.");
      }
    } catch (err) {
      console.error(err);
      setError("Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Visual background glowing orb */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        top: '20%',
        left: '30%',
        zIndex: 0,
        filter: 'blur(30px)'
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(169, 85, 247, 0.12) 0%, transparent 70%)',
        bottom: '10%',
        right: '25%',
        zIndex: 0,
        filter: 'blur(30px)'
      }} />

      {/* Login Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px 32px',
        zIndex: 10,
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        
        {/* Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
            margin: '0 auto 16px auto'
          }}>
            <Lock size={26} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(to right, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DoxWFM Portal</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>Çağrı Merkezi İş Gücü Yönetim Platformu</p>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="glass-panel" style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '0.8rem',
            fontWeight: 600,
            animation: 'slideUp 0.2s ease-out'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials hints card */}
        <div className="glass-panel" style={{
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#94a3b8',
          marginBottom: '20px',
          border: '1px dashed rgba(255,255,255,0.05)'
        }}>
          <span style={{ fontWeight: 700, color: '#3b82f6', display: 'block', marginBottom: '2px' }}>Giriş Seviyeleri Örnek Bilgiler:</span>
          &bull; <strong>Süper Admin</strong>: Doxish / DoxWFM44.<br/>
          &bull; <strong>Süpervizör</strong>: kaan / doxwfm123<br/>
          &bull; <strong>Temsilci</strong>: ahmet / doxwfm123
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Username Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Kullanıcı Adı</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin..."
                className="wfm-input"
                style={{ paddingLeft: '40px' }}
                disabled={loading}
                required
              />
              <User size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748b' }} />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Şifre</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin..."
                className="wfm-input"
                style={{ paddingLeft: '40px' }}
                disabled={loading}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748b' }} />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="wfm-btn wfm-btn-primary" 
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>Giriş Yapılıyor...</span>
              </>
            ) : (
              <>
                <span>Sisteme Güvenli Giriş Yap</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
