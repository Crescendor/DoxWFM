import React, { useState } from 'react';
import { 
  Coffee, 
  Clock, 
  Percent, 
  PhoneCall, 
  Send, 
  Calendar, 
  Utensils, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function MyPortal({ agent, data, showToast, fetchData, currentUser, token }) {
  const { schedules, requests } = data;
  const [requestType, setRequestType] = useState('Mola');
  const [duration, setDuration] = useState('15');
  const [submitting, setSubmitting] = useState(false);

  if (!agent) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
        Temsilci verisi yüklenemedi. Lütfen tekrar deneyin.
      </div>
    );
  }

  const agentSchedule = schedules[agent.id] || { weeklyShift: {} };
  
  // Find current day name in Turkish to highlight today's shift
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const todayName = dayNames[new Date().getDay()];
  const todayShift = agentSchedule.weeklyShift[todayName] || { type: 'Off', lunch: '', breaks: [] };

  // Filter requests made by this specific agent
  const myRequests = requests.filter(r => r.agentId === agent.id);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentId: agent.id,
          type: requestType,
          duration: parseInt(duration)
        })
      });
      if (res.ok) {
        showToast("Mola/Yemek talebiniz süpervizöre iletildi!", "success");
        fetchData();
      } else {
        showToast("Talep gönderilemedi.", "error");
      }
    } catch (err) {
      showToast("Sunucu bağlantı hatası", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      
      {/* 1. Left Column: Personal Dashboard & Shift View */}
      <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* A. Personal Performance Scorecard */}
        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Bugünkü Performans Karnem</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
            {/* Calls handled */}
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <PhoneCall size={18} color="#3b82f6" style={{ margin: '0 auto 8px auto' }} />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Cevaplanan Çağrı</span>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{(agent.stats?.calls ?? 0)} Adet</h4>
            </div>

            {/* personal AHT */}
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <Clock size={18} color="#14b8a6" style={{ margin: '0 auto 8px auto' }} />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Ortalama Konuşma (AHT)</span>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{(agent.stats?.aht ?? 0)} sn</h4>
            </div>

            {/* personal SLA */}
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <Percent size={18} color="#8b5cf6" style={{ margin: '0 auto 8px auto' }} />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>SLA Uyumluluğu</span>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: (agent.stats?.sla ?? 0) >= 90 ? '#10b981' : '#f59e0b' }}>
                %{(agent.stats?.sla ?? 0)}
              </h4>
            </div>

            {/* rating */}
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '0 auto 8px auto', color: '#fbbf24' }}>
                <Coffee size={18} color="#fbbf24" />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Kalite Derecesi</span>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{(agent.rating ?? 5.0).toFixed(1)} / 5</h4>
            </div>
          </div>
        </section>

        {/* B. Personal Schedule for Today */}
        <section className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar color="#6366f1" size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Bugünkü Vardiya Programım ({todayName})</h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Planlı vardiya saatleri, yemek molası ve kısa mola çizelgeniz.</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,0,0,0.15)' }}>
            {todayShift.type === 'Off' ? (
              <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8' }}>
                <strong>Bugün İzinli Gününüz!</strong> Keyifli dinlenmeler dileriz.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Shift Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Vardiya Tipi:</span>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontWeight: 700, 
                    fontSize: '0.8rem',
                    background: 'rgba(59, 130, 246, 0.15)', 
                    color: '#60a5fa', 
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    {todayShift.type}
                  </span>
                </div>

                {/* 2. Lunch hour */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Utensils size={16} color="#a78bfa" />
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Planlı Öğle Yemeği:</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{todayShift.lunch || 'Belirlenmedi'}</span>
                </div>

                {/* 3. Breaks */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coffee size={16} color="#fbbf24" />
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Planlı Kısa Molalar:</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {todayShift.breaks && todayShift.breaks.length > 0 ? (
                      todayShift.breaks.map(b => (
                        <span key={b} style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>{b}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Planlanmadı</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* 2. Right Column: Request System */}
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* A. Submit Request Form */}
        <section className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="#3b82f6" />
            Mola / Yemek Talebi Gönder
          </h3>

          <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Request Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Talep Türü</label>
              <select 
                value={requestType}
                onChange={(e) => {
                  setRequestType(e.target.value);
                  // Auto fill standard duration presets
                  if (e.target.value === 'Mola') setDuration('15');
                  if (e.target.value === 'Yemek') setDuration('45');
                  if (e.target.value === 'Eğitim') setDuration('30');
                  if (e.target.value === 'Toplantı') setDuration('15');
                }}
                className="wfm-select"
              >
                <option value="Mola">Mola (Break)</option>
                <option value="Yemek">Öğle Yemeği (Lunch)</option>
                <option value="Eğitim">Eğitim (Training)</option>
                <option value="Toplantı">Toplantı (Meeting)</option>
              </select>
            </div>

            {/* Duration Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Süre (Dakika)</label>
              <select 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="wfm-select"
              >
                <option value="15">15 Dakika</option>
                <option value="20">20 Dakika</option>
                <option value="30">30 Dakika</option>
                <option value="45">45 Dakika</option>
                <option value="60">60 Dakika</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="wfm-btn wfm-btn-primary" 
              disabled={submitting || todayShift.type === 'Off'}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {submitting ? 'Gönderiliyor...' : 'Talebi Süpervizöre Gönder'}
            </button>

            {todayShift.type === 'Off' && (
              <span style={{ fontSize: '0.7rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <AlertCircle size={10} /> İzinli gününüzde mola talebi gönderemezsiniz.
              </span>
            )}
          </form>
        </section>

        {/* B. Requests History List */}
        <section className="glass-panel" style={{ padding: '24px', flex: 1, minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Mola Talepleri Geçmişim</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '300px' }}>
            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '0.85rem' }}>
                Henüz bir talebiniz bulunmuyor.
              </div>
            ) : (
              myRequests.map((req) => {
                let statusBadge = '#64748b';
                let statusText = 'Bekliyor';
                let icon = <Clock size={12} color="#f59e0b" />;

                if (req.status === 'Approved') {
                  statusBadge = '#10b981';
                  statusText = 'Onaylandı';
                  icon = <CheckCircle2 size={12} color="#10b981" />;
                } else if (req.status === 'Denied') {
                  statusBadge = '#ef4444';
                  statusText = 'Reddedildi';
                  icon = <XCircle size={12} color="#ef4444" />;
                }

                return (
                  <div 
                    key={req.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '12px', 
                      background: 'rgba(255,255,255,0.01)',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block' }}>
                        {req.type} ({req.duration} dk)
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {new Date(req.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: statusBadge }}>
                      {icon}
                      <span>{statusText}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>

    </div>
  );
}
