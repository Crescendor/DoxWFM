import React, { useState, useEffect } from 'react';
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

  // Real-Time Vertical Line Sweeper State
  const [currentTimePercent, setCurrentTimePercent] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // 15-Minute Daily Slots Maps (Total 96 slots)
  const slotActivities = {
    0: { name: 'İzinli (Off)', color: '#1e293b', code: 'OFF' },
    1: { name: 'Vardiya Çalışması', color: '#3b82f6', code: 'WRK' },
    2: { name: 'Yemek Molası', color: '#14b8a6', code: 'LCH' },
    3: { name: 'Kısa Mola', color: '#f59e0b', code: 'BRK' },
    4: { name: 'Toplantı', color: '#6366f1', code: 'MTG' },
    5: { name: 'Eğitim', code: 'TRN', color: '#f97316' },
    6: { name: 'ACW (Çağrı Sonu)', color: '#8b5cf6', code: 'ACW' },
    7: { name: 'Backoffice', color: '#ec4899', code: 'BOF' }
  };

  // Convert Slot Index back to Time string
  const slotToTime = (slot) => {
    const totalMinutes = slot * 15;
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Track the actual clock and calculate positioning percent for the red sweeper line
  useEffect(() => {
    const updateLine = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const totalMins = hrs * 60 + mins;
      const percent = (totalMins / 1440) * 100;
      setCurrentTimePercent(percent);
      setCurrentTimeStr(`${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`);
    };

    updateLine();
    const interval = setInterval(updateLine, 20000); // update every 20 seconds
    return () => clearInterval(interval);
  }, []);

  const hoursHeader = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  if (!agent) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
        Temsilci verisi yüklenemedi. Lütfen tekrar deneyin.
      </div>
    );
  }

  const timeline = schedules[agent.id] || Array(96).fill(0);
  
  // Find current day name in Turkish
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const todayName = dayNames[new Date().getDay()];

  // Calculate dynamic summary stats from 96-slot schedule array
  const workSlots = timeline.filter(s => s === 1).length;
  const lunchSlots = timeline.filter(s => s === 2).length;
  const breakSlots = timeline.filter(s => s === 3).length;
  const meetingSlots = timeline.filter(s => s === 4).length;
  const trainingSlots = timeline.filter(s => s === 5).length;
  const acwSlots = timeline.filter(s => s === 6).length;
  const backofficeSlots = timeline.filter(s => s === 7).length;

  const totalWorkMin = workSlots * 15;
  const totalLunchMin = lunchSlots * 15;
  const totalBreakMin = breakSlots * 15;
  const totalMeetingMin = meetingSlots * 15;
  const totalTrainingMin = trainingSlots * 15;
  
  const isOffDuty = timeline.every(val => val === 0);

  const formatMinutes = (mins) => {
    if (mins === 0) return '0 dk';
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs > 0) {
      return `${hrs} sa ${m > 0 ? `${m} dk` : ''}`;
    }
    return `${m} dk`;
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar color="#6366f1" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Bugünkü Vardiya Çizelgem ({todayName})</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gününüzü planlamak için dakika dakika timeline görünümünüz.</span>
              </div>
            </div>
            {/* Live Indicator time */}
            <div className="glass-panel" style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'state-pulse-OnCall 1.5s infinite' }} />
              <span>Şimdi: <strong>{currentTimeStr}</strong></span>
            </div>
          </div>

          {/* Color Legend Keys */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.7rem', marginBottom: '20px' }}>
            {Object.keys(slotActivities).map(key => {
              const item = slotActivities[key];
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>

          {/* Timeline Scroll Wrapper */}
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,0,0,0.15)', overflowX: 'auto', marginBottom: '20px' }}>
            <div style={{ minWidth: '960px', position: 'relative' }}>
              
              {/* Timeline Hours Header */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '8px' }}>
                <div style={{ width: '120px', flexShrink: 0 }} /> {/* empty left side offset to align with timeline */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                  {hoursHeader.map(hr => (
                    <div key={hr} style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>{hr}:00</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Grid Wrapper with Sweep Red Line */}
              <div style={{ display: 'flex', alignItems: 'center', height: '48px', position: 'relative' }}>
                
                {/* Live Sweeping Red line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `calc(120px + (100% - 120px) * ${currentTimePercent / 100})`,
                  borderLeft: '2px solid #ef4444',
                  zIndex: 10,
                  pointerEvents: 'none',
                  transition: 'left 0.5s ease'
                }}>
                  {/* Red indicator tooltip flag */}
                  <div style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '-20px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.55rem',
                    padding: '1px 3px',
                    borderRadius: '3px',
                    fontWeight: 700
                  }}>
                    Şimdi
                  </div>
                </div>

                {/* Left Profile label inside the scroll wrapper */}
                <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: agent.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    color: 'white'
                  }}>
                    {agent.avatar}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.name}
                  </span>
                </div>

                {/* Timeline Grid (96 read-only cells) */}
                <div style={{ flex: 1, height: '100%', display: 'grid', gridTemplateColumns: 'repeat(96, 1fr)', padding: '4px 0' }}>
                  {timeline.map((actCode, index) => {
                    const activity = slotActivities[actCode] || slotActivities[0];
                    const timeSpan = `${slotToTime(index)} - ${slotToTime(index + 1)}`;
                    
                    return (
                      <div 
                        key={index}
                        style={{ 
                          background: activity.color,
                          borderRight: (index + 1) % 4 === 0 ? '1px solid rgba(255,255,255,0.2)' : 'none', // hourly split
                          height: '100%',
                          opacity: 0.9,
                          transition: 'all 0.15s'
                        }}
                        title={`Zaman: ${timeSpan} \nAktivite: ${activity.name}`}
                      />
                    );
                  })}
                </div>

              </div>

            </div>
          </div>

          {/* Shift Details and Dynamic Summary Metrics */}
          {isOffDuty ? (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)', textAlign: 'center', color: '#94a3b8' }}>
              <strong>Bugün İzinli Gününüz!</strong> Keyifli dinlenmeler dileriz.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
              
              <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>TOPLAM PLANLI ÇALIŞMA</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{formatMinutes(totalWorkMin)}</span>
              </div>

              {totalLunchMin > 0 && (
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ÖĞLE YEMEĞİ SÜRESİ</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14b8a6' }}>{formatMinutes(totalLunchMin)}</span>
                </div>
              )}

              {totalBreakMin > 0 && (
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>TOPLAM MOLA SÜRESİ</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>{formatMinutes(totalBreakMin)}</span>
                </div>
              )}

              {totalMeetingMin > 0 && (
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>TOPLANTI / BRİFİNG</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6366f1' }}>{formatMinutes(totalMeetingMin)}</span>
                </div>
              )}

              {totalTrainingMin > 0 && (
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>EĞİTİM / KOÇLUK</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f97316' }}>{formatMinutes(totalTrainingMin)}</span>
                </div>
              )}

            </div>
          )}

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
              disabled={submitting || isOffDuty}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {submitting ? 'Gönderiliyor...' : 'Talebi Süpervizöre Gönder'}
            </button>

            {isOffDuty && (
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
