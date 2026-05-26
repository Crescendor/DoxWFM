import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Coffee, 
  Utensils, 
  Save, 
  X,
  Users2,
  ListPlus,
  Play,
  HelpCircle,
  Briefcase
} from 'lucide-react';

export default function Scheduler({ data, showToast, fetchData, currentUser, token }) {
  const { agents, schedules, teams } = data;
  
  // Active Team Filter
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // UI State
  const [editingAgent, setEditingAgent] = useState(null); // agent object if editing individual timeline
  const [checkedAgentIds, setCheckedAgentIds] = useState([]); // for bulk updates
  
  // Form Allocation States
  const [activityCode, setActivityCode] = useState(1); // 1 = Work by default
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('18');
  const [endMinute, setStartEndMinute] = useState('00');

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

  // Convert Hour & Minute strings into Slot Index (0 to 95)
  const timeToSlot = (h, m) => {
    const hours = parseInt(h) || 0;
    const minutes = parseInt(m) || 0;
    return Math.floor((hours * 60 + minutes) / 15);
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

  // Filter agents by team selection
  const filteredAgents = agents.filter(a => {
    if (a.roleId === 'role-superadmin') return false; // hide superadmin from shift timeline
    if (!selectedTeamId) return true;
    return a.teamId === selectedTeamId;
  });

  const handleToggleAgentCheck = (agentId) => {
    if (checkedAgentIds.includes(agentId)) {
      setCheckedAgentIds(checkedAgentIds.filter(id => id !== agentId));
    } else {
      setCheckedAgentIds([...checkedAgentIds, agentId]);
    }
  };

  const handleToggleSelectAll = () => {
    if (checkedAgentIds.length === filteredAgents.length) {
      setCheckedAgentIds([]);
    } else {
      setCheckedAgentIds(filteredAgents.map(a => a.id));
    }
  };

  // Individual allocation save
  const handleSaveIndividualShift = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;

    const startSlot = timeToSlot(startHour, startMinute);
    const endSlot = timeToSlot(endHour, endMinute);

    if (startSlot >= endSlot) {
      showToast("Başlangıç saati bitiş saatinden önce olmalıdır.", "error");
      return;
    }

    const currentTimeline = [...(schedules[editingAgent.id] || Array(96).fill(0))];
    
    // Write activity indices to range
    for (let i = startSlot; i < endSlot; i++) {
      currentTimeline[i] = parseInt(activityCode);
    }

    try {
      const res = await fetch(`/api/schedule/${editingAgent.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timeline: currentTimeline })
      });

      if (res.ok) {
        showToast(`${editingAgent.name} vardiya planı güncellendi.`, "success");
        setEditingAgent(null);
        fetchData();
      } else {
        showToast("Vardiya kaydedilemedi.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası", "error");
    }
  };

  // Bulk assignment submit
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (checkedAgentIds.length === 0) {
      showToast("Lütfen toplu vardiya atanacak personelleri listeden seçin.", "error");
      return;
    }

    const startSlot = timeToSlot(startHour, startMinute);
    const endSlot = timeToSlot(endHour, endMinute);

    if (startSlot >= endSlot) {
      showToast("Başlangıç saati bitiş saatinden önce olmalıdır.", "error");
      return;
    }

    try {
      const res = await fetch('/api/schedule/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentIds: checkedAgentIds,
          startSlot,
          endSlot: endSlot - 1, // backend endpoint is inclusive of endSlot
          activityCode: parseInt(activityCode)
        })
      });

      if (res.ok) {
        showToast("Toplu vardiya ataması başarıyla uygulandı!", "success");
        setCheckedAgentIds([]);
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Toplu atama başarısız oldu.", "error");
      }
    } catch (err) {
      showToast("Sunucu bağlantı hatası", "error");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Filters & Stats */}
      <section className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Team filter dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users2 color="#6366f1" size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 600, uppercase: 'true' }}>Takım Filtresi</span>
            <select 
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="wfm-select"
              style={{ width: '220px', padding: '4px 8px', fontSize: '0.85rem' }}
            >
              <option value="">Tüm Takımları Göster</option>
              {teams && teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Indicator time */}
        <div className="glass-panel" style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'state-pulse-OnCall 1.5s infinite' }} />
          <span>Şu anki saat: <strong>{currentTimeStr}</strong></span>
        </div>

        {/* Color Legend Keys */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.7rem' }}>
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

      </section>

      {/* 2. Bulk Assignment Console (Toplu Atama) */}
      <section className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListPlus size={18} color="#6366f1" />
          Toplu Aktivite / Vardiya Atama Konsolu
        </h3>
        
        <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          
          {/* Target Activity */}
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Atanacak Aktivite</label>
            <select 
              value={activityCode} 
              onChange={(e) => setActivityCode(e.target.value)} 
              className="wfm-select"
            >
              {Object.keys(slotActivities).map(key => (
                <option key={key} value={key}>{slotActivities[key].name}</option>
              ))}
            </select>
          </div>

          {/* Start hour selection */}
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Başlangıç</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select value={startHour} onChange={(e) => setStartHour(e.target.value)} className="wfm-select">
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} className="wfm-select">
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* End hour selection */}
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Bitiş</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select value={endHour} onChange={(e) => setEndHour(e.target.value)} className="wfm-select">
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select value={endMinute} onChange={(e) => setStartEndMinute(e.target.value)} className="wfm-select">
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Bulk Assign Button */}
          <button 
            type="submit" 
            className="wfm-btn wfm-btn-primary"
            style={{ padding: '10px 24px', flexShrink: 0 }}
            disabled={checkedAgentIds.length === 0}
          >
            <Save size={16} />
            <span>Seçilenlere Toplu Ata ({checkedAgentIds.length})</span>
          </button>

          {checkedAgentIds.length === 0 && (
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
              &bull; Toplu değişiklik yapmak için aşağıdaki listeden temsilcilerin yanındaki kutucukları işaretleyin.
            </span>
          )}

        </form>
      </section>

      {/* 3. Minute-by-Minute Timeline Scheduler Grid */}
      <section className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ minWidth: '1280px', position: 'relative' }}>
          
          {/* Timeline Time Header Grid Row */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border-glass-bright)', paddingBottom: '10px', marginBottom: '10px' }}>
            
            {/* checkbox and name label header */}
            <div style={{ width: '220px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <input 
                type="checkbox" 
                checked={filteredAgents.length > 0 && checkedAgentIds.length === filteredAgents.length}
                onChange={handleToggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>Personel Listesi ({filteredAgents.length})</span>
            </div>

            {/* hours grid block */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              {hoursHeader.map(hr => (
                <div key={hr} style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <span>{hr}:00</span>
                </div>
              ))}
            </div>

          </div>

          {/* Main Grid Wrapper with Sweep Red Line */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
            
            {/* Live Sweeping Red line */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `calc(220px + (100% - 220px) * ${currentTimePercent / 100})`,
              borderLeft: '2px solid #ef4444',
              zIndex: 100,
              pointerEvents: 'none',
              transition: 'left 0.5s ease'
            }}>
              {/* Red Sweeper indicator flag */}
              <div style={{
                position: 'absolute',
                top: '-18px',
                left: '-20px',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.6rem',
                padding: '1px 4px',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                Şimdi
              </div>
            </div>

            {/* If no agents are created yet, render dynamic prompt */}
            {filteredAgents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.85rem' }}>
                Gösterilecek personel kaydı bulunmuyor. Yeni personelleri "Temsilci Yönetimi" sekmesinden ekleyebilirsiniz.
              </div>
            ) : (
              filteredAgents.map((agent) => {
                const timeline = schedules[agent.id] || Array(96).fill(0);
                const isChecked = checkedAgentIds.includes(agent.id);

                return (
                  <div key={agent.id} style={{ display: 'flex', alignItems: 'center', height: '56px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px' }} className="glass-panel-hover">
                    
                    {/* Checkbox and Profile Label Column */}
                    <div style={{ width: '220px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleToggleAgentCheck(agent.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: agent.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: 'white'
                      }}>
                        {agent.avatar}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <span 
                          onClick={() => {
                            setEditingAgent(agent);
                            setStartHour('09');
                            setStartMinute('00');
                            setEndHour('18');
                            setStartEndMinute('00');
                          }}
                          style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', cursor: 'pointer', hover: { textDecoration: 'underline' } }}
                          title="Tıkla ve Vardiya Düzenle"
                          className="text-glow-OnCall"
                        >
                          {agent.name}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Takım: {teams.find(t => t.id === agent.teamId)?.name || 'Yok'}</span>
                      </div>
                    </div>

                    {/* Timeline Grid (96 interactive cells) */}
                    <div style={{ flex: 1, height: '100%', display: 'grid', gridTemplateColumns: 'repeat(96, 1fr)', padding: '6px 0' }}>
                      {timeline.map((actCode, index) => {
                        const activity = slotActivities[actCode] || slotActivities[0];
                        const timeSpan = `${slotToTime(index)} - ${slotToTime(index + 1)}`;
                        
                        return (
                          <div 
                            key={index}
                            style={{ 
                              background: activity.color,
                              borderRight: (index + 1) % 4 === 0 ? '1px solid rgba(255,255,255,0.2)' : 'none', // hourly border split
                              height: '100%',
                              cursor: 'pointer',
                              opacity: 0.85,
                              transition: 'all 0.15s'
                            }}
                            onClick={() => {
                              setEditingAgent(agent);
                              // Auto fill slot values into form
                              const timeStartStr = slotToTime(index);
                              const timeEndStr = slotToTime(index + 4 > 95 ? 96 : index + 4);
                              setStartHour(timeStartStr.split(':')[0]);
                              setStartMinute(timeStartStr.split(':')[1]);
                              setEndHour(timeEndStr.split(':')[0]);
                              setStartEndMinute(timeEndStr.split(':')[1]);
                              setActivityCode(actCode);
                            }}
                            title={`${agent.name} \nZaman: ${timeSpan} \nAktivite: ${activity.name}`}
                          />
                        );
                      })}
                    </div>

                  </div>
                );
              })
            )}

          </div>

        </div>
      </section>

      {/* Range Allocation Modal Overlay */}
      {editingAgent && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '24px', background: '#111827', border: '1px solid var(--border-glass-bright)', maxWidth: '440px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Aktivite Çizelgeleme</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {editingAgent.name} &bull; Günlük Planlama
                </span>
              </div>
              <button 
                onClick={() => setEditingAgent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveIndividualShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Target Activity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Çizelgelenecek Aktivite</label>
                <select 
                  value={activityCode} 
                  onChange={(e) => setActivityCode(e.target.value)} 
                  className="wfm-select"
                >
                  {Object.keys(slotActivities).map(key => (
                    <option key={key} value={key}>{slotActivities[key].name}</option>
                  ))}
                </select>
              </div>

              {/* Start hour selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Başlangıç Saati</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={startHour} onChange={(e) => setStartHour(e.target.value)} className="wfm-select" style={{ flex: 1 }}>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} className="wfm-select" style={{ flex: 1 }}>
                    {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m} dk</option>)}
                  </select>
                </div>
              </div>

              {/* End hour selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Bitiş Saati</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={endHour} onChange={(e) => setEndHour(e.target.value)} className="wfm-select" style={{ flex: 1 }}>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <select value={endMinute} onChange={(e) => setStartEndMinute(e.target.value)} className="wfm-select" style={{ flex: 1 }}>
                    {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m} dk</option>)}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingAgent(null)}
                  className="wfm-btn wfm-btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Kapat
                </button>
                
                <button 
                  type="submit" 
                  className="wfm-btn wfm-btn-primary" 
                  style={{ flex: 1 }}
                >
                  <Save size={16} /> Aktiviteyi Ata
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
