import React from 'react';
import { 
  PhoneCall, 
  Clock, 
  Percent, 
  Activity, 
  Check, 
  X, 
  UserSquare, 
  AlertTriangle,
  Play,
  CheckCircle
} from 'lucide-react';

export default function Dashboard({ data, onApproveRequest, onDenyRequest, showToast, fetchData, currentUser, token }) {
  const { queue, agents, requests, activityLog, teams } = data;

  const getSlaColor = (val) => {
    if (val >= 90) return '#10b981'; // green
    if (val >= queue.targetSla) return '#60a5fa'; // cyan/blue
    if (val >= 75) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle manual state update by supervisor
  const handleStateChange = async (agentId, newState) => {
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ state: newState })
      });
      if (res.ok) {
        showToast("Temsilci durumu güncellendi!", "success");
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "İşlem başarısız.", "error");
      }
    } catch (err) {
      showToast("Durum güncellenirken hata oluştu", "error");
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Real-Time Analytics Bar */}
      <section className="dashboard-grid">
        {/* SLA Card */}
        <div className={`glass-panel metric-card ${queue.sla < queue.targetSla ? 'alarm-SLA' : ''}`} style={{ position: 'relative' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, uppercase: 'true' }}>Grup SLA Seviyesi</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '6px', fontWeight: 800, color: getSlaColor(queue.sla) }}>
              %{queue.sla}
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Hedef: %{queue.targetSla}</span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)'
          }}>
            <Percent size={20} color={getSlaColor(queue.sla)} />
          </div>
        </div>

        {/* Calls Waiting Card */}
        <div className="glass-panel metric-card" style={{ borderLeft: queue.callsWaiting > 3 ? '4px solid #ef4444' : '1px solid var(--border-glass)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, uppercase: 'true' }}>Bekleyen Çağrı</span>
            <h2 style={{ 
              fontSize: '2.25rem', 
              marginTop: '6px', 
              fontWeight: 800,
              color: queue.callsWaiting > 3 ? '#ef4444' : '#ffffff',
              animation: queue.callsWaiting > 3 ? 'pulse-red-alarm 1.5s infinite' : 'none'
            }}>
              {queue.callsWaiting}
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Aktif kuyruk hattı</span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)'
          }}>
            <PhoneCall size={20} color={queue.callsWaiting > 3 ? '#ef4444' : '#3b82f6'} />
          </div>
        </div>

        {/* Max Wait Time Card */}
        <div className="glass-panel metric-card">
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, uppercase: 'true' }}>En Uzun Bekleme</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '6px', fontWeight: 800, color: queue.maxWaitTime > 45 ? '#f59e0b' : '#ffffff' }}>
              {queue.maxWaitTime} sn
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Kuyruk cevaplama hedefi: 20 sn</span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)'
          }}>
            <Clock size={20} color={queue.maxWaitTime > 45 ? '#f59e0b' : '#14b8a6'} />
          </div>
        </div>

        {/* Occupancy Card */}
        <div className="glass-panel metric-card">
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, uppercase: 'true' }}>Doluluk Oranı (Occupancy)</span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '6px', fontWeight: 800 }}>
              %{queue.occupancy}
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Temsilci aktif kapasite oranı</span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)'
          }}>
            <Activity size={20} color="#8b5cf6" />
          </div>
        </div>
      </section>

      {/* 2. Main Dashboard Split Layout */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Live Agent Monitor Grid */}
        <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Canlı Temsilci Durum İzleme ({agents.length} Kişi)</h3>
            
            {/* Quick Status Legend */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="state-dot" style={{ background: '#10b981' }} /> Müsait
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="state-dot" style={{ background: '#3b82f6' }} /> Çağrıda
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="state-dot" style={{ background: '#8b5cf6' }} /> ACW
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="state-dot" style={{ background: '#f59e0b' }} /> Mola
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="state-dot" style={{ background: '#14b8a6' }} /> Yemek
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="state-dot" style={{ background: '#64748b' }} /> Çevrimdışı
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {agents.map((agent) => {
              const isOffline = agent.state === 'Offline';
              const agentTeam = teams?.find(t => t.id === agent.teamId);
              const channelType = agentTeam ? (agentTeam.channelType || 'Call') : 'Call';
              return (
                <div 
                  key={agent.id} 
                  className={`glass-panel glass-panel-hover state-border-${agent.state.replace(' ', '')}`}
                  style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}
                >
                  {/* Top Bar: Profile */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      {/* Avatar */}
                      <div className={agent.state === 'Offline' ? '' : `pulse-${agent.state.replace(' ', '')}`} style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: agent.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        {agent.avatar}
                      </div>

                      {/* Info */}
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{agent.name}</h4>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>
                          {agent.role === 'supervisor' ? 'Süpervizör' : 'Temsilci'}
                        </span>
                      </div>
                    </div>

                    {/* Quick State Toggle for Supervisor Override */}
                    <select
                      value={agent.state}
                      onChange={(e) => handleStateChange(agent.id, e.target.value)}
                      className="wfm-select"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}
                    >
                      <option value="Available">Müsait</option>
                      <option value="On Call">Çağrıda</option>
                      <option value="ACW">ACW (Sonrası)</option>
                      <option value="Break">Mola</option>
                      <option value="Lunch">Yemek</option>
                      <option value="Training">Eğitim</option>
                      <option value="Meeting">Toplantı</option>
                      <option value="Offline">Çevrimdışı</option>
                    </select>
                  </div>

                  {/* Middle Bar: State Indicator & Duration */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px' }}>
                    <span className={`state-badge text-glow-${agent.state.replace(' ', '')}`}>
                      <span className="state-dot" style={{ 
                        background: 
                          agent.state === 'Available' ? 'var(--state-available)' :
                          agent.state === 'On Call' ? 'var(--state-oncall)' :
                          agent.state === 'ACW' ? 'var(--state-acw)' :
                          agent.state === 'Break' ? 'var(--state-break)' :
                          agent.state === 'Lunch' ? 'var(--state-lunch)' :
                          agent.state === 'Training' ? 'var(--state-training)' :
                          agent.state === 'Meeting' ? 'var(--state-meeting)' :
                          'var(--state-offline)'
                      }} />
                      {
                        agent.state === 'Available' ? 'Müsait' :
                        agent.state === 'On Call' ? (
                          channelType === 'Call' ? 'Çağrıda' :
                          channelType === 'Chat' ? 'Sohbette' :
                          'Yazışmada'
                        ) :
                        agent.state === 'ACW' ? 'ACW (İş Sonu)' :
                        agent.state === 'Break' ? 'Molada' :
                        agent.state === 'Lunch' ? 'Yemekte' :
                        agent.state === 'Training' ? 'Eğitimde' :
                        agent.state === 'Meeting' ? 'Toplantıda' :
                        'Çevrimdışı'
                      }
                    </span>
                    
                    {!isOffline && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', color: '#e2e8f0' }}>
                        {formatDuration(agent.stateDuration)}
                      </span>
                    )}
                  </div>

                  {/* Bottom Bar: KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>
                        {channelType === 'Call' ? 'Çağrı' : channelType === 'Chat' ? 'Sohbet' : 'E-Posta'}
                      </span>
                      <span style={{ fontWeight: 700 }}>
                        {channelType === 'Call' ? (agent.stats.calls || 0) : channelType === 'Chat' ? (agent.stats.chats || 0) : (agent.stats.emails || 0)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>AHT</span>
                      <span style={{ fontWeight: 700 }}>{agent.stats.aht} sn</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>SLA</span>
                      <span style={{ fontWeight: 700, color: agent.stats.sla >= 85 ? '#10b981' : '#f59e0b' }}>
                        %{agent.stats.sla}
                      </span>
                    </div>
                  </div>
                  
                  {/* Skills tags footer */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {agent.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Log Feed & Pending Break Requests */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* A. Pending Break/Lunch Approval Requests */}
          <section className="glass-panel" style={{ padding: '20px', border: pendingRequests.length > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Onay Bekleyen Talepler
                {pendingRequests.length > 0 && (
                  <span style={{
                    background: '#f59e0b',
                    color: 'black',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '50px'
                  }}>{pendingRequests.length}</span>
                )}
              </h3>
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                <CheckCircle size={32} color="#64748b" style={{ opacity: 0.6 }} />
                <span>Onay bekleyen mola veya yemek talebi bulunmuyor.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequests.map((req) => (
                  <div key={req.id} className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{req.agentName}</span>
                      <span className={`shift-tag ${req.type === 'Mola' ? 'shift-tag-morning' : 'shift-tag-evening'}`} style={{ fontSize: '0.65rem' }}>
                        {req.type} ({req.duration} dk)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-glass)', paddingTop: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(req.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => onDenyRequest(req.id)}
                          className="wfm-btn wfm-btn-danger" 
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                        >
                          <X size={14} /> Reddet
                        </button>
                        <button 
                          onClick={() => onApproveRequest(req.id)}
                          className="wfm-btn wfm-btn-primary" 
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', background: '#10b981', boxShadow: 'none' }}
                        >
                          <Check size={14} /> Onayla
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* B. Live Activity Logs */}
          <section className="glass-panel" style={{ padding: '20px', flex: 1, minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#3b82f6" />
              Sistem Canlı Faaliyet Günlüğü
            </h3>

            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              maxHeight: '400px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              paddingRight: '6px'
            }}>
              {activityLog.length === 0 ? (
                <span style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', display: 'block', padding: '20px 0' }}>Log kaydı bulunmuyor.</span>
              ) : (
                activityLog.map((log) => {
                  let typeColor = '#64748b';
                  if (log.type === 'state') typeColor = '#3b82f6';
                  if (log.type === 'request') typeColor = '#f59e0b';
                  if (log.type === 'admin') typeColor = '#8b5cf6';

                  return (
                    <div 
                      key={log.id} 
                      style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        fontSize: '0.75rem', 
                        borderBottom: '1px solid rgba(255,255,255,0.02)', 
                        paddingBottom: '8px'
                      }}
                    >
                      <span style={{ color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>{log.time}</span>
                      <span style={{ color: '#64748b' }}>|</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <span style={{ color: '#e2e8f0' }}>{log.message}</span>
                        <span style={{ fontSize: '0.6rem', color: typeColor, fontWeight: 700, textTransform: 'uppercase' }}>
                          {log.type === 'state' ? 'Durum Değişikliği' : log.type === 'request' ? 'Mola Talebi' : 'Yönetici İşlemi'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
