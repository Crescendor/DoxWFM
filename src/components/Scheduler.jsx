import React, { useState } from 'react';
import { 
  Calendar, 
  Edit3, 
  Clock, 
  Coffee, 
  Utensils, 
  Save, 
  X,
  Plus
} from 'lucide-react';

export default function Scheduler({ data, showToast, fetchData }) {
  const { agents, schedules } = data;
  const [editingCell, setEditingCell] = useState(null); // { agentId, day, agentName, currentShift }
  
  // Modal Form State
  const [shiftType, setShiftType] = useState('Morning (08:00-17:00)');
  const [lunchTime, setLunchTime] = useState('12:30-13:30');
  const [breaks, setBreaks] = useState('10:15-10:30, 15:15-15:30');

  const daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  const getShiftTagClass = (type) => {
    if (type.includes('Morning')) return 'shift-tag-morning';
    if (type.includes('Evening')) return 'shift-tag-evening';
    if (type.includes('Night')) return 'shift-tag-night';
    return 'shift-tag-off';
  };

  const handleCellClick = (agentId, agentName, day, currentShift) => {
    setEditingCell({ agentId, agentName, day, currentShift });
    setShiftType(currentShift.type || 'Off');
    setLunchTime(currentShift.lunch || '');
    setBreaks(currentShift.breaks ? currentShift.breaks.join(', ') : '');
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (!editingCell) return;

    const { agentId, day } = editingCell;
    const currentAgentSchedule = schedules[agentId];
    
    if (!currentAgentSchedule) {
      showToast("Vardiya kaydı bulunamadı", "error");
      return;
    }

    const breakList = breaks.split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const updatedWeeklyShift = {
      ...currentAgentSchedule.weeklyShift,
      [day]: {
        type: shiftType,
        lunch: shiftType === 'Off' ? '' : lunchTime,
        breaks: shiftType === 'Off' ? [] : breakList
      }
    };

    try {
      const res = await fetch(`/api/schedule/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyShift: updatedWeeklyShift })
      });

      if (res.ok) {
        showToast(`${editingCell.agentName} için ${day} vardiyası güncellendi.`, "success");
        setEditingCell(null);
        fetchData();
      } else {
        showToast("Vardiya kaydedilemedi.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Sunucu hatası oluştu", "error");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Overview stats */}
      <section className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar color="#3b82f6" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Kapsamlı Vardiya Planlaması</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Maksimum hizmet ve kesintisiz çağrı kuyruğu için tüm haftayı yönetin.</span>
          </div>
        </div>

        {/* Quick legend info */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="shift-tag shift-tag-morning">Gündüz (M)</span>
          <span className="shift-tag shift-tag-evening">Akşam (E)</span>
          <span className="shift-tag shift-tag-night">Gece (N)</span>
          <span className="shift-tag shift-tag-off">İzinli (Off)</span>
        </div>
      </section>

      {/* Timeline Grid Container */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ minWidth: '950px' }}>
          
          {/* Header Row */}
          <div className="scheduler-timeline-grid">
            <div className="scheduler-header-cell" style={{ textAlign: 'left' }}>Temsilci Adı</div>
            {daysOfWeek.map(day => (
              <div key={day} className="scheduler-header-cell">{day}</div>
            ))}
          </div>

          {/* Grid Rows for Agents */}
          {agents.map((agent) => {
            const agentSchedule = schedules[agent.id];
            if (!agentSchedule) return null;

            return (
              <div 
                key={agent.id} 
                className="scheduler-timeline-grid" 
                style={{ 
                  marginTop: '4px', 
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)'
                }}
              >
                {/* Agent Label Column */}
                <div className="scheduler-agent-label">
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
                  <div>
                    <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem' }}>{agent.name}</span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{agent.skills[0]}</span>
                  </div>
                </div>

                {/* Days Columns */}
                {daysOfWeek.map((day) => {
                  const shift = agentSchedule.weeklyShift[day] || { type: 'Off', lunch: '', breaks: [] };
                  const isOff = shift.type === 'Off';

                  return (
                    <div 
                      key={day} 
                      className="scheduler-shift-cell"
                      onClick={() => handleCellClick(agent.id, agent.name, day, shift)}
                    >
                      <span className={`shift-tag ${getShiftTagClass(shift.type)}`}>
                        {
                          shift.type.includes('Morning') ? 'Gündüz' :
                          shift.type.includes('Evening') ? 'Akşam' :
                          shift.type.includes('Night') ? 'Gece' : 'İzinli'
                        }
                      </span>
                      
                      {!isOff && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', color: '#94a3b8', fontSize: '0.65rem', marginTop: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Utensils size={10} color="#a78bfa" /> {shift.lunch}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Coffee size={10} color="#fbbf24" /> {shift.breaks?.length || 0} Mola
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Shift Modification Modal Overlay */}
      {editingCell && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '24px', background: '#111827', border: '1px solid var(--border-glass-bright)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vardiyayı Düzenle</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {editingCell.agentName} &bull; {editingCell.day}
                </span>
              </div>
              <button 
                onClick={() => setEditingCell(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Shift Type Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Vardiya Tipi</label>
                <select 
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="wfm-select"
                >
                  <option value="Morning (08:00-17:00)">Morning (08:00-17:00) - Gündüz</option>
                  <option value="Evening (15:00-00:00)">Evening (15:00-00:00) - Akşam</option>
                  <option value="Night (23:00-08:00)">Night (23:00-08:00) - Gece</option>
                  <option value="Off">Off - İzinli Gün</option>
                </select>
              </div>

              {shiftType !== 'Off' && (
                <>
                  {/* Lunch Hours */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Öğle Yemeği Saati</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        value={lunchTime}
                        onChange={(e) => setLunchTime(e.target.value)}
                        placeholder="Örn: 12:30-13:30"
                        className="wfm-input"
                      />
                      <Utensils size={14} style={{ position: 'absolute', right: '14px', top: '13px', color: '#64748b' }} />
                    </div>
                  </div>

                  {/* Planned Breaks */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Planlı Molalar (Virgülle Ayırın)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        value={breaks}
                        onChange={(e) => setBreaks(e.target.value)}
                        placeholder="Örn: 10:15-10:30, 15:15-15:30"
                        className="wfm-input"
                      />
                      <Coffee size={14} style={{ position: 'absolute', right: '14px', top: '13px', color: '#64748b' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Mola saatlerini aralarına virgül koyarak yazınız.</span>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingCell(null)}
                  className="wfm-btn wfm-btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Vazgeç
                </button>
                
                <button 
                  type="submit" 
                  className="wfm-btn wfm-btn-primary" 
                  style={{ flex: 1 }}
                >
                  <Save size={16} /> Vardiyayı Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
