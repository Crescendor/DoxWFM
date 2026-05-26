import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  UserCheck, 
  ShieldAlert, 
  LogOut, 
  RefreshCw, 
  User,
  Coffee,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';

import Dashboard from './components/Dashboard.jsx';
import Scheduler from './components/Scheduler.jsx';
import AgentManager from './components/AgentManager.jsx';
import MyPortal from './components/MyPortal.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('manager'); // 'manager' or 'agent'
  const [selectedAgentId, setSelectedAgentId] = useState('agt-101'); // default agent for portal
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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch initial data
  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setSyncing(true);
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const json = await response.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching WFM data:", error);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // Setup live-polling simulation (every 2.5 seconds)
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Show customized floating visual feedback
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleResetData = async () => {
    if (!window.confirm("Tüm verileri varsayılan örnek verilerle sıfırlamak istiyor musunuz?")) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        showToast("Veri tabanı başarıyla sıfırlandı!", "success");
      }
    } catch (err) {
      showToast("Sıfırlama başarısız oldu", "error");
    }
  };

  const handleApproveRequest = async (reqId) => {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
      });
      if (res.ok) {
        showToast("Mola/Yemek talebi onaylandı!", "success");
        fetchData();
      }
    } catch (err) {
      showToast("Talep onaylanırken hata oluştu", "error");
    }
  };

  const handleDenyRequest = async (reqId) => {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Denied' })
      });
      if (res.ok) {
        showToast("Mola/Yemek talebi reddedildi.", "error");
        fetchData();
      }
    } catch (err) {
      showToast("Talep reddedilirken hata oluştu", "error");
    }
  };

  // Filter current pending requests
  const pendingRequests = data.requests.filter(r => r.status === 'Pending');

  // Handle loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '15px' }}>
        <RefreshCw style={{ animation: 'spin 2s linear infinite', color: '#3b82f6' }} size={48} />
        <h3 style={{ color: '#94a3b8' }}>DoxWFM Yükleniyor...</h3>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentAgent = data.agents.find(a => a.id === selectedAgentId) || data.agents[0];

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

          {/* Role Indicator Banner */}
          <div className="glass-panel" style={{ padding: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: role === 'manager' ? '#3b82f6' : '#10b981',
                boxShadow: role === 'manager' ? '0 0 8px #3b82f6' : '0 0 8px #10b981'
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {role === 'manager' ? 'Yönetici Görünümü' : 'Temsilci Görünümü'}
              </span>
            </div>
            {role === 'agent' && (
              <select 
                value={selectedAgentId}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  showToast(`${data.agents.find(a => a.id === e.target.value)?.name} portalına geçildi`, "success");
                }}
                className="wfm-select" 
                style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
              >
                {data.agents.filter(a => a.role === 'agent').map(a => (
                  <option key={a.id} value={a.id}>{a.avatar}</option>
                ))}
              </select>
            )}
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {role === 'manager' ? (
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

        {/* Bottom Actions / Role Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Quick Stats Summary */}
          {role === 'manager' && (
            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0,0,0,0.15)', fontSize: '0.75rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Aktif SLA:</span>
                <span style={{ fontWeight: 700, color: data.queue.sla >= data.queue.targetSla ? '#10b981' : '#ef4444' }}>%{data.queue.sla}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Bekleyen Çağrı:</span>
                <span style={{ fontWeight: 700, color: data.queue.callsWaiting > 3 ? '#ef4444' : '#f59e0b' }}>{data.queue.callsWaiting}</span>
              </div>
            </div>
          )}

          {/* Sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px', fontSize: '0.7rem', color: '#64748b' }}>
            <RefreshCw size={10} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{syncing ? 'Veriler güncelleniyor...' : 'Veriler senkronize'}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Database Reset Button */}
            {role === 'manager' && (
              <button 
                onClick={handleResetData}
                className="wfm-btn wfm-btn-secondary" 
                style={{ flex: 1, padding: '10px', minWidth: '40px' }}
                title="Verileri Sıfırla"
              >
                <RefreshCw size={16} />
              </button>
            )}
            
            {/* View Switcher Button */}
            <button 
              onClick={() => {
                const nextRole = role === 'manager' ? 'agent' : 'manager';
                setRole(nextRole);
                setActiveTab(nextRole === 'manager' ? 'dashboard' : 'portal');
                showToast(`${nextRole === 'manager' ? 'Yönetici' : 'Müşteri Temsilcisi'} görünümüne geçildi`, "success");
              }}
              className="wfm-btn wfm-btn-secondary"
              style={{ flex: 2 }}
            >
              <User size={16} />
              <span>Rolü Değiştir</span>
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
              {activeTab === 'portal' && `Müşteri Temsilcisi Portalı: ${currentAgent?.name}`}
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
            <span style={{ fontWeight: 600 }}>Canlı Yayın</span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ color: '#94a3b8' }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
          />
        )}
        
        {activeTab === 'scheduler' && (
          <Scheduler 
            data={data} 
            showToast={showToast}
            fetchData={fetchData}
          />
        )}
        
        {activeTab === 'agents' && (
          <AgentManager 
            data={data} 
            showToast={showToast}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'portal' && (
          <MyPortal 
            agent={currentAgent}
            data={data} 
            showToast={showToast}
            fetchData={fetchData}
          />
        )}
      </main>
    </div>
  );
}
