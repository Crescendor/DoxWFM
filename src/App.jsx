import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  UserCheck, 
  RefreshCw, 
  LogOut,
  CheckCircle,
  XCircle,
  User,
  ShieldCheck
} from 'lucide-react';

import Dashboard from './components/Dashboard.jsx';
import Scheduler from './components/Scheduler.jsx';
import AgentManager from './components/AgentManager.jsx';
import MyPortal from './components/MyPortal.jsx';
import Login from './components/Login.jsx';

export default function App() {
  // Production authentication state backed by localStorage
  const [token, setToken] = useState(localStorage.getItem('doxwfm_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('doxwfm_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    agents: [],
    schedules: {},
    queue: {
      callsWaiting: 0,
      maxWaitTime: 0,
      sla: 100,
      totalCalls: 0,
      handledCalls: 0,
      abandonedCalls: 0,
      occupancy: 0,
      targetSla: 85
    },
    requests: [],
    activityLog: []
  });
  const [loading, setLoading] = useState(localStorage.getItem('doxwfm_token') ? true : false);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sync default tab on login role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'agent') {
        setActiveTab('portal');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser]);

  // Fetch data with token authorization
  const fetchData = async (showLoading = false) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    setSyncing(true);
    try {
      const response = await fetch('/api/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setData(json);
      } else if (response.status === 401 || response.status === 403) {
        // Session expired or invalid, force logout
        handleLogout();
        showToast("Oturum süresi doldu, lütfen tekrar giriş yapın.", "error");
      }
    } catch (error) {
      console.error("Error fetching WFM data:", error);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // Live Sync loop
  useEffect(() => {
    if (token) {
      fetchData(true);
      const interval = setInterval(() => {
        fetchData(false);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [token]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleLogin = (authToken, user) => {
    localStorage.setItem('doxwfm_token', authToken);
    localStorage.setItem('doxwfm_user', JSON.stringify(user));
    setToken(authToken);
    setCurrentUser(user);
    showToast(`Hoş geldiniz, ${user.name}!`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem('doxwfm_token');
    localStorage.removeItem('doxwfm_user');
    setToken(null);
    setCurrentUser(null);
  };

  const handleResetData = async () => {
    if (currentUser?.role !== 'superadmin') {
      showToast("Bu işlemi yalnızca Süper Admin gerçekleştirebilir.", "error");
      return;
    }
    if (!window.confirm("Tüm verileri varsayılan başlangıç verileriyle sıfırlamak istiyor musunuz?")) return;
    
    try {
      const res = await fetch('/api/reset', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        showToast("Veri tabanı başarıyla sıfırlandı!", "success");
      } else {
        showToast("Sıfırlama başarısız oldu", "error");
      }
    } catch (err) {
      showToast("Sıfırlama başarısız oldu", "error");
    }
  };

  const handleApproveRequest = async (reqId) => {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Approved' })
      });
      if (res.ok) {
        showToast("Mola/Yemek talebi onaylandı!", "success");
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || "Onaylama başarısız.", "error");
      }
    } catch (err) {
      showToast("Talep onaylanırken hata oluştu", "error");
    }
  };

  const handleDenyRequest = async (reqId) => {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Denied' })
      });
      if (res.ok) {
        showToast("Mola/Yemek talebi reddedildi.", "error");
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || "Reddetme başarısız.", "error");
      }
    } catch (err) {
      showToast("Talep reddedilirken hata oluştu", "error");
    }
  };

  // Unauthenticated Route handling
  if (!token || !currentUser) {
    return (
      <>
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(10px)',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <XCircle size={18} />
            <span>{notification.message}</span>
          </div>
        )}
        <Login onLogin={handleLogin} showToast={showToast} />
      </>
    );
  }

  // Handle loading state during bootup sync
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '15px' }}>
        <RefreshCw style={{ animation: 'spin 2s linear infinite', color: '#3b82f6' }} size={48} />
        <h3 style={{ color: '#94a3b8' }}>DoxWFM Verileri Yükleniyor...</h3>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Strictly bind personal portal agent session data (cannot be bypassed by clients)
  const currentAgent = data.agents.find(a => a.id === currentUser.id);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '12px',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(10px)',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={{
        width: '280px',
        padding: '24px',
        margin: '16px 0 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 50
      }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}>
              <LayoutDashboard size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DoxWFM</h2>
              <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 700, letterSpacing: '0.15em', uppercase: 'true' }}>CALL CENTER</span>
            </div>
          </div>

          {/* Navigation Matrix by Allowed Role Level */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentUser.role !== 'agent' ? (
              <>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`wfm-btn ${activeTab === 'dashboard' ? 'wfm-btn-primary' : 'wfm-btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <LayoutDashboard size={18} />
                  <span>Panel Monitor</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('scheduler')}
                  className={`wfm-btn ${activeTab === 'scheduler' ? 'wfm-btn-primary' : 'wfm-btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <CalendarDays size={18} />
                  <span>Vardiya Planlayıcı</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('agents')}
                  className={`wfm-btn ${activeTab === 'agents' ? 'wfm-btn-primary' : 'wfm-btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <Users size={18} />
                  <span>Temsilci Yönetimi</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setActiveTab('portal')}
                className={`wfm-btn wfm-btn-primary`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <UserCheck size={18} />
                <span>Kişisel Portalım</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Panel: Logged Profile widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Authenticated Profile Card */}
          <div className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: currentUser.avatarColor || '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: 'white'
            }}>
              {currentUser.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, display: 'block', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</span>
              <span style={{ 
                fontSize: '0.65rem', 
                color: currentUser.role === 'superadmin' ? '#f87171' : currentUser.role === 'supervisor' ? '#60a5fa' : '#10b981', 
                fontWeight: 600, 
                textTransform: 'uppercase'
              }}>
                {
                  currentUser.role === 'superadmin' ? 'Süper Admin' :
                  currentUser.role === 'supervisor' ? 'Süpervizör' : 'Temsilci'
                }
              </span>
            </div>
          </div>

          {/* Sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px', fontSize: '0.7rem', color: '#64748b' }}>
            <RefreshCw size={10} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{syncing ? 'Veriler senkronize ediliyor...' : 'Gerçek Zamanlı Veriler'}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Database Reset Button for SuperAdmin */}
            {currentUser.role === 'superadmin' && (
              <button 
                onClick={handleResetData}
                className="wfm-btn wfm-btn-secondary" 
                style={{ padding: '10px', minWidth: '40px' }}
                title="Sistemi Sıfırla"
              >
                <RefreshCw size={16} />
              </button>
            )}
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="wfm-btn wfm-btn-danger"
              style={{ flex: 1 }}
            >
              <LogOut size={16} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main style={{
        flex: 1,
        padding: '24px',
        maxHeight: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Header Ribbon */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {activeTab === 'dashboard' && 'Gerçek Zamanlı Durum Monitörü'}
              {activeTab === 'scheduler' && 'Haftalık Vardiya Planlayıcı'}
              {activeTab === 'agents' && 'Müşteri Temsilcisi Yönetim Veritabanı'}
              {activeTab === 'portal' && `Müşteri Temsilcisi Portalı: ${currentUser.name}`}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '2px' }}>
              {activeTab === 'dashboard' && 'Kuyruk durumunu, çağrı hacmini ve temsilci faaliyetlerini canlı izleyin.'}
              {activeTab === 'scheduler' && 'Hizmet seviyesini korumak için vardiyaları, yemek ve mola saatlerini planlayın.'}
              {activeTab === 'agents' && 'Süpervizör yetkileriyle temsilci kayıtlarını ekleyin, güncelleyin veya silin.'}
              {activeTab === 'portal' && 'Kendi vardiya çizelgenizi izleyin, mola talebi gönderin ve performansınızı takip edin.'}
            </p>
          </div>

          {/* Quick Date Display */}
          <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: 'state-pulse-OnCall 1.5s infinite' }} />
            <span style={{ fontWeight: 600 }}>Aktif Oturum</span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ color: '#94a3b8' }}>{currentUser.username}</span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            data={data} 
            onApproveRequest={handleApproveRequest}
            onDenyRequest={handleDenyRequest}
            showToast={showToast}
            fetchData={fetchData}
            currentUser={currentUser}
            token={token}
          />
        )}
        
        {activeTab === 'scheduler' && (
          <Scheduler 
            data={data} 
            showToast={showToast}
            fetchData={fetchData}
            currentUser={currentUser}
            token={token}
          />
        )}
        
        {activeTab === 'agents' && (
          <AgentManager 
            data={data} 
            showToast={showToast}
            fetchData={fetchData}
            currentUser={currentUser}
            token={token}
          />
        )}

        {activeTab === 'portal' && (
          <MyPortal 
            agent={currentAgent || currentUser}
            data={data} 
            showToast={showToast}
            fetchData={fetchData}
            currentUser={currentUser}
            token={token}
          />
        )}
      </main>
    </div>
  );
}
