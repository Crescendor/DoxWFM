import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  Star, 
  Check, 
  X,
  Search,
  Lock,
  User as UserIcon
} from 'lucide-react';

export default function AgentManager({ data, showToast, fetchData, currentUser, token }) {
  const { agents } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [role, setRole] = useState('agent');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState(['Destek']);
  const [avatarColor, setAvatarColor] = useState('#3b82f6');

  const availableSkills = ['Destek', 'Teknik', 'Satış', 'Şikayet', 'Fatura', 'İngilizce', 'Almanca', 'Sosyal Medya'];
  const colorPresets = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setRole('agent');
    setUsername('');
    setPassword('');
    setSkills(['Destek']);
    setAvatarColor('#3b82f6');
    setEditingAgent(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setRole(agent.role);
    setUsername(agent.username || '');
    setPassword(''); // Leave password empty initially during edit
    setSkills(agent.skills);
    setAvatarColor(agent.avatarColor);
    setShowAddModal(true);
  };

  const handleDeleteAgent = async (agentId, agentName) => {
    if (currentUser.role !== 'superadmin') {
      showToast("Temsilci silme yetkiniz bulunmamaktadır. Yalnızca Süper Admin silebilir.", "error");
      return;
    }
    if (!window.confirm(`${agentName} isimli temsilciyi sistemden kalıcı olarak silmek istiyor musunuz?`)) return;
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Temsilci başarıyla silindi", "success");
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Silme işlemi başarısız.", "error");
      }
    } catch (err) {
      showToast("Temsilci silinemedi", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return showToast("Lütfen bir isim girin", "error");
    if (!username.trim()) return showToast("Lütfen bir kullanıcı adı girin", "error");
    if (!editingAgent && !password.trim()) return showToast("Lütfen bir giriş şifresi belirleyin", "error");

    const payload = { 
      name, 
      role, 
      skills, 
      avatarColor,
      username: username.trim()
    };

    // Only include password if provided (handles optional password update during edit)
    if (password.trim()) {
      payload.password = password.trim();
    }

    try {
      let res;
      if (editingAgent) {
        // Edit Mode
        res = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Add Mode
        res = await fetch('/api/agents', {
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
          editingAgent ? "Temsilci bilgileri güncellendi!" : "Yeni temsilci sisteme eklendi!", 
          "success"
        );
        setShowAddModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "İşlem başarısız oldu", "error");
      }
    } catch (err) {
      showToast("Sunucu hatası oluştu", "error");
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.username && a.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    a.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search & Actions Ribbon */}
      <section className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="İsim, kullanıcı adı veya yetkinlik ara..."
            className="wfm-input"
            style={{ paddingLeft: '40px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748b' }} />
        </div>

        {/* Add Agent Button */}
        <button 
          onClick={handleOpenAdd}
          className="wfm-btn wfm-btn-primary"
        >
          <UserPlus size={18} />
          <span>Yeni Temsilci Ekle</span>
        </button>

      </section>

      {/* Roster Table Container */}
      <section className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-glass-bright)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, uppercase: 'true' }}>
              <th style={{ padding: '12px 16px' }}>Profil & Kullanıcı Adı</th>
              <th style={{ padding: '12px 16px' }}>Rol</th>
              <th style={{ padding: '12px 16px' }}>Yetkinlik ve Beceriler</th>
              <th style={{ padding: '12px 16px' }}>Durum</th>
              <th style={{ padding: '12px 16px' }}>Bugünkü Çağrı</th>
              <th style={{ padding: '12px 16px' }}>Derecelendirme</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.9rem' }}>
                  Arama kriterlerinize uygun temsilci bulunamadı.
                </td>
              </tr>
            ) : (
              filteredAgents.map((agent) => (
                <tr 
                  key={agent.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)', 
                    transition: 'background 0.2s',
                    height: '60px'
                  }}
                  className="glass-panel-hover"
                >
                  {/* Profile */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: agent.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {agent.avatar}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem' }}>{agent.name}</span>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Kullanıcı: <strong>{agent.username || 'Yok'}</strong></span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 
                        agent.role === 'superadmin' ? 'rgba(139, 92, 246, 0.1)' : 
                        agent.role === 'supervisor' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: 
                        agent.role === 'superadmin' ? '#c084fc' : 
                        agent.role === 'supervisor' ? '#f87171' : '#60a5fa',
                      border: 
                        agent.role === 'superadmin' ? '1px solid rgba(139, 92, 246, 0.2)' : 
                        agent.role === 'supervisor' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      {
                        agent.role === 'superadmin' ? 'Süper Admin' :
                        agent.role === 'supervisor' ? 'Süpervizör' : 'Temsilci'
                      }
                    </span>
                  </td>

                  {/* Skills */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {agent.skills.map(skill => (
                        <span key={skill} className="skill-tag" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Active State */}
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`state-badge text-glow-${agent.state.replace(' ', '')}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                      {
                        agent.state === 'Available' ? 'Müsait' :
                        agent.state === 'On Call' ? 'Çağrıda' :
                        agent.state === 'ACW' ? 'ACW' :
                        agent.state === 'Break' ? 'Mola' :
                        agent.state === 'Lunch' ? 'Yemek' :
                        agent.state === 'Training' ? 'Eğitim' :
                        agent.state === 'Meeting' ? 'Toplantı' : 'Çevrimdışı'
                      }
                    </span>
                  </td>

                  {/* Today's Handled Calls */}
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.85rem' }}>
                    {agent.stats.calls}
                  </td>

                  {/* Performance Rating */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                      <Star size={12} fill="#fbbf24" />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                        {agent.rating ? agent.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button 
                        onClick={() => handleOpenEdit(agent)}
                        className="wfm-btn wfm-btn-secondary" 
                        style={{ padding: '6px 10px', borderRadius: '6px' }}
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>
                      
                      {/* Only superadmin can delete users, disable for supervisor */}
                      <button 
                        onClick={() => handleDeleteAgent(agent.id, agent.name)}
                        className="wfm-btn wfm-btn-danger" 
                        style={{ 
                          padding: '6px 10px', 
                          borderRadius: '6px',
                          opacity: currentUser.role !== 'superadmin' ? 0.3 : 1,
                          cursor: currentUser.role !== 'superadmin' ? 'not-allowed' : 'pointer'
                        }}
                        disabled={currentUser.role !== 'superadmin'}
                        title={currentUser.role === 'superadmin' ? "Sil" : "Sadece Süper Admin Silebilir"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Add / Edit Agent Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '24px', background: '#111827', border: '1px solid var(--border-glass-bright)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {editingAgent ? 'Temsilci Bilgilerini Güncelle' : 'Yeni Temsilci Oluştur'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {editingAgent ? `${editingAgent.name} (ID: ${editingAgent.id})` : 'Sisteme yeni bir personel kaydı yapın.'}
                </span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Name Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Temsilci Adı Soyadı</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="wfm-input"
                  required
                />
              </div>

              {/* Username & Password credentials */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Kullanıcı Adı</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="kullanici"
                      className="wfm-input"
                      style={{ paddingLeft: '32px' }}
                      required
                    />
                    <UserIcon size={12} style={{ position: 'absolute', left: '10px', top: '13px', color: '#64748b' }} />
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    {editingAgent ? 'Yeni Şifre (İsteğe Bağlı)' : 'Giriş Şifresi'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingAgent ? "Değişmeyecekse boş bırakın" : "şifre"}
                      className="wfm-input"
                      style={{ paddingLeft: '32px' }}
                      required={!editingAgent}
                    />
                    <Lock size={12} style={{ position: 'absolute', left: '10px', top: '13px', color: '#64748b' }} />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Sistem Rolü Yetki Kademesi</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="wfm-select"
                >
                  <option value="agent">Müşteri Temsilcisi (Agent Portal)</option>
                  <option value="supervisor">Süpervizör (Admin Dashboard)</option>
                  {currentUser.role === 'superadmin' && (
                    <option value="superadmin">Süper Admin (Tam Yetki)</option>
                  )}
                </select>
              </div>

              {/* Avatar Color Preset Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Profil Rengi</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: color,
                        border: avatarColor === color ? '2px solid white' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Skills Checklist Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Yetkinlik ve Kuyruk Becerileri</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {availableSkills.map((skill) => {
                    const isChecked = skills.includes(skill);
                    return (
                      <div 
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                          border: isChecked ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: isChecked ? 600 : 400,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          border: '1px solid var(--border-glass-bright)',
                          background: isChecked ? '#3b82f6' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isChecked && <Check size={8} color="white" />}
                        </div>
                        <span>{skill}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="wfm-btn wfm-btn-secondary" 
                  style={{ flex: 1 }}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="wfm-btn wfm-btn-primary" 
                  style={{ flex: 1 }}
                >
                  <Check size={16} /> 
                  {editingAgent ? 'Güncelle' : 'Temsilci Ekle'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
