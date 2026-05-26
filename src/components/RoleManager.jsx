import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Check, X, ShieldAlert } from 'lucide-react';

export default function RoleManager({ data, showToast, fetchData, currentUser, token }) {
  const { roles } = data;
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState({
    manage_roles: false,
    manage_teams: false,
    manage_agents: false,
    manage_schedules: false,
    approve_requests: false,
    view_all_dashboards: false,
    view_personal_only: true
  });

  const permissionLabels = {
    manage_roles: 'Rol & Yetki Yönetimi (Super Admin yetkisi)',
    manage_teams: 'Takım & Grup Yönetimi (Yeni takımlar oluşturma)',
    manage_agents: 'Temsilci Yönetimi (Personel ekleme, güncelleme, silme)',
    manage_schedules: 'Vardiya Planlama (Timeline çizelgesi üzerinde değişiklik yapma)',
    approve_requests: 'Mola Onaylama (Temsilci mola/yemek isteklerini onaylama)',
    view_all_dashboards: 'Operasyon SLA İzleme (Canlı kuyruk ve SLA ekranını görme)',
    view_personal_only: 'Yalnızca Kişisel Portal (Temsilcilerin kendi ekranını görmesi)'
  };

  const handleOpenAdd = () => {
    setName('');
    setDescription('');
    setPermissions({
      manage_roles: false,
      manage_teams: false,
      manage_agents: false,
      manage_schedules: false,
      approve_requests: false,
      view_all_dashboards: false,
      view_personal_only: true
    });
    setEditingRole(null);
    setShowModal(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description);
    setPermissions(role.permissions);
    setShowModal(true);
  };

  const togglePermission = (key) => {
    setPermissions({
      ...permissions,
      [key]: !permissions[key]
    });
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (['role-superadmin', 'role-agent'].includes(roleId) && currentUser?.roleId !== 'role-superadmin') {
      showToast("Sistem varsayılan rolleri silinemez.", "error");
      return;
    }
    if (!window.confirm(`"${roleName}" rolünü silmek istiyor musunuz?`)) return;

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Rol başarıyla silindi.", "success");
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Rol silinemedi.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return showToast("Lütfen bir rol adı girin.", "error");

    const payload = { name, description, permissions };

    try {
      let res;
      if (editingRole) {
        res = await fetch(`/api/roles/${editingRole.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/roles', {
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
          editingRole ? "Rol başarıyla güncellendi!" : "Yeni yetki kademesi tanımlandı!",
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
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield color="#6366f1" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Rol & Yetki Kademeleri</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Operasyon personelleriniz için dinamik rolleri ve yetkileri tanımlayın.</span>
          </div>
        </div>

        <button onClick={handleOpenAdd} className="wfm-btn wfm-btn-primary">
          <Plus size={18} />
          <span>Yeni Rol Tanımla</span>
        </button>
      </section>

      {/* Roles Cards Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {roles && roles.map((role) => {
          const isSystemDefault = ['role-superadmin', 'role-agent'].includes(role.id) && currentUser?.roleId !== 'role-superadmin';
          return (
            <div key={role.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{role.name}</h4>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {role.id}</span>
                </div>
                
                {!isSystemDefault && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleOpenEdit(role)} 
                      className="wfm-btn wfm-btn-secondary" 
                      style={{ padding: '6px 10px', borderRadius: '6px' }}
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteRole(role.id, role.name)} 
                      className="wfm-btn wfm-btn-danger" 
                      style={{ padding: '6px 10px', borderRadius: '6px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '0.8rem', color: '#94a3b8', minHeight: '36px' }}>{role.description || 'Açıklama girilmemiş.'}</p>

              {/* Permission summary pills */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Aktif İzinler</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.keys(role.permissions).map(key => {
                    const hasPerm = role.permissions[key];
                    if (!hasPerm) return null;
                    return (
                      <span key={key} style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.15)'
                      }}>
                        {
                          key === 'manage_roles' ? 'Rol Yön.' :
                          key === 'manage_teams' ? 'Takım Yön.' :
                          key === 'manage_agents' ? 'Temsilci Yön.' :
                          key === 'manage_schedules' ? 'Vardiya Pl.' :
                          key === 'approve_requests' ? 'Mola Onay' :
                          key === 'view_all_dashboards' ? 'Canlı SLA' : 'Portal'
                        }
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Add / Edit Role Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '24px', background: '#111827', border: '1px solid var(--border-glass-bright)', maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {editingRole ? 'Yetki Kademesini Güncelle' : 'Yeni Rol Tanımla'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sistemdeki kullanıcılar için yetki limitlerini yapılandırın.</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Role Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Rol Adı</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Örn: Takım Lideri, Quality Manager" 
                  className="wfm-input" 
                  required 
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Rol Açıklaması</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Bu rol kademesinin operasyonel görevleri..." 
                  className="wfm-input" 
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              {/* Permissions Checklist */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '10px' }}>İzin ve Yetkiler</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {Object.keys(permissions).map((key) => {
                    const isChecked = permissions[key];
                    return (
                      <div 
                        key={key} 
                        onClick={() => togglePermission(key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.01)',
                          border: isChecked ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-glass-bright)',
                          background: isChecked ? '#3b82f6' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isChecked && <Check size={10} color="white" />}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: isChecked ? 600 : 400 }}>{permissionLabels[key]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="wfm-btn wfm-btn-secondary" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="wfm-btn wfm-btn-primary" style={{ flex: 1 }}>
                  <Check size={16} />
                  <span>Rolü Kaydet</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
