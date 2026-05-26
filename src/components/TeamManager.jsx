import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Check, X, ShieldAlert, Award, UserPlus } from 'lucide-react';

export default function TeamManager({ data, showToast, fetchData, token }) {
  const { teams, agents, roles } = data;
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [leaderId, setLeaderId] = useState('');
  const [channelType, setChannelType] = useState('Call');

  const colorPresets = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#a855f7', '#06b6d4'];

  // Filter agents who are allowed to be leaders (e.g., role != role-agent)
  const potentialLeaders = agents.filter(a => {
    const role = roles.find(r => r.id === a.roleId);
    return role && role.permissions.manage_schedules; // has schedule management powers
  });

  const handleOpenAdd = () => {
    setName('');
    setColor('#3b82f6');
    setLeaderId('');
    setChannelType('Call');
    setEditingTeam(null);
    setShowModal(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setName(team.name);
    setColor(team.color);
    setLeaderId(team.leaderId || '');
    setChannelType(team.channelType || 'Call');
    setShowModal(true);
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`"${teamName}" takımını silmek istiyor musunuz? Bu takımdaki temsilcilerin takım bağı boşaltılacaktır.`)) return;

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Takım başarıyla silindi.", "success");
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Takım silinemedi.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return showToast("Lütfen bir takım adı girin.", "error");

    const payload = { name, color, leaderId, channelType };

    try {
      let res;
      if (editingTeam) {
        res = await fetch(`/api/teams/${editingTeam.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast(
          editingTeam ? "Takım başarıyla güncellendi!" : "Yeni departman/takım oluşturuldu!",
          "success"
        );
        setShowModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "İşlem başarısız oldu", "error");
      }
    } catch (err) {
      showToast("Sunucu hatası oluştu", "error");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Action Ribbon */}
      <section className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users color="#10b981" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Takım & Grup Yönetimi</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Çağrı merkezi kuyruk takımlarını, departman etiketlerini ve liderleri belirleyin.</span>
          </div>
        </div>

        <button onClick={handleOpenAdd} className="wfm-btn wfm-btn-primary">
          <Plus size={18} />
          <span>Yeni Takım Ekle</span>
        </button>
      </section>

      {/* Teams Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {teams && teams.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: '#64748b' }}>
            <ShieldAlert size={36} style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
            <h4>Henüz kayıtlı bir takım bulunmuyor.</h4>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Yeni takımlar oluşturarak personel yerleşimlerini planlamaya başlayın.</p>
          </div>
        ) : (
          teams && teams.map((team) => {
            const teamLeader = agents.find(a => a.id === team.leaderId);
            const teamMembers = agents.filter(a => a.teamId === team.id);

            return (
              <div key={team.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `4px solid ${team.color}` }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{team.name}</h4>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: 
                          team.channelType === 'Chat' ? 'rgba(16, 185, 129, 0.15)' : 
                          team.channelType === 'E-Posta' ? 'rgba(139, 92, 246, 0.15)' : 
                          'rgba(59, 130, 246, 0.15)',
                        color: 
                          team.channelType === 'Chat' ? '#10b981' : 
                          team.channelType === 'E-Posta' ? '#a855f7' : 
                          '#60a5fa',
                        border: 
                          team.channelType === 'Chat' ? '1px solid rgba(16, 185, 129, 0.3)' : 
                          team.channelType === 'E-Posta' ? '1px solid rgba(139, 92, 246, 0.3)' : 
                          '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {team.channelType || 'Call'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {team.id}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleOpenEdit(team)} 
                      className="wfm-btn wfm-btn-secondary" 
                      style={{ padding: '6px 10px', borderRadius: '6px' }}
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTeam(team.id, team.name)} 
                      className="wfm-btn wfm-btn-danger" 
                      style={{ padding: '6px 10px', borderRadius: '6px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Team Leader details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <Award size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Takım Lideri</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: teamLeader ? '#f8fafc' : '#94a3b8' }}>
                      {teamLeader ? teamLeader.name : 'Atanmamış'}
                    </span>
                  </div>
                </div>

                {/* Members count and quick roster preview */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                    <span>Kayıtlı Üyeler:</span>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{teamMembers.length} Personel</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '70px', overflowY: 'auto' }}>
                    {teamMembers.length === 0 ? (
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>Bu takımda henüz üye yok.</span>
                    ) : (
                      teamMembers.map(m => (
                        <span key={m.id} style={{
                          fontSize: '0.65rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-glass)',
                          color: '#e2e8f0'
                        }}>
                          {m.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Add / Edit Team Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '24px', background: '#111827', border: '1px solid var(--border-glass-bright)', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {editingTeam ? 'Takım Bilgilerini Güncelle' : 'Yeni Takım Ekle'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Operasyonel birimleri renk kodlarıyla yönetin.</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Team Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Takım Adı</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Örn: Outbound Satış, Şikayet Yönetimi" 
                  className="wfm-input" 
                  required 
                />
              </div>

              {/* Channel Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>İletişim Kanalı (Kanal Tipi)</label>
                <select 
                  value={channelType} 
                  onChange={(e) => setChannelType(e.target.value)} 
                  className="wfm-select"
                >
                  <option value="Call">Call (Telefon / Ses)</option>
                  <option value="Chat">Chat (Canlı Sohbet)</option>
                  <option value="E-Posta">E-Posta (E-Mail)</option>
                </select>
              </div>

              {/* Leader Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Takım Lideri (Yetkili)</label>
                <select 
                  value={leaderId} 
                  onChange={(e) => setLeaderId(e.target.value)} 
                  className="wfm-select"
                >
                  <option value="">Lider Atama (Boş Bırak)</option>
                  {potentialLeaders.map(leader => (
                    <option key={leader.id} value={leader.id}>{leader.name} ({leader.roleName || 'Lider'})</option>
                  ))}
                </select>
              </div>

              {/* Color Preset Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Takım Etiket Rengi</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {colorPresets.map(presetColor => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: presetColor,
                        border: color === presetColor ? '2px solid white' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="wfm-btn wfm-btn-secondary" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="wfm-btn wfm-btn-primary" style={{ flex: 1 }}>
                  <Check size={16} />
                  <span>Takımı Kaydet</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
