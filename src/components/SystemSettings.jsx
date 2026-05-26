import React, { useState } from 'react';
import { 
  Settings, 
  RefreshCw, 
  Plus, 
  Edit2, 
  Trash2, 
  Lock, 
  ShieldAlert, 
  Check, 
  X, 
  KeyRound 
} from 'lucide-react';

export default function SystemSettings({ data, showToast, fetchData, token }) {
  const { skills } = data;

  // Skills States
  const [newSkillName, setNewSkillName] = useState('');
  const [editingSkill, setEditingSkill] = useState(null); // { oldName: '', newName: '' }
  const [addingSkill, setAddingSkill] = useState(false);

  // Security / Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Handle Add Skill
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return showToast("Lütfen beceri adı girin.", "error");

    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSkillName.trim() })
      });

      if (res.ok) {
        showToast("Yeni beceri başarıyla tanımlandı!", "success");
        setNewSkillName('');
        setAddingSkill(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Beceri eklenemedi.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  // Handle Edit Skill
  const handleEditSkillSubmit = async (e) => {
    e.preventDefault();
    if (!editingSkill.newName.trim()) return showToast("Lütfen beceri adı girin.", "error");

    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(editingSkill.oldName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newName: editingSkill.newName.trim() })
      });

      if (res.ok) {
        showToast("Beceri adı başarıyla güncellendi!", "success");
        setEditingSkill(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Güncelleme başarısız.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  // Handle Delete Skill
  const handleDeleteSkill = async (skillName) => {
    if (!window.confirm(`"${skillName}" becerisini silmek istiyor musunuz? Bu beceriye sahip tüm personellerden bu etiket kaldırılacaktır.`)) return;

    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skillName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showToast("Beceri başarıyla silindi.", "success");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Silme işlemi başarısız.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  // Handle Password-Protected Reset Database
  const handleResetConfirm = async (e) => {
    e.preventDefault();
    if (!adminPassword) {
      setPasswordError("Lütfen şifrenizi girin.");
      return;
    }

    setVerifying(true);
    setPasswordError('');

    try {
      // 1. Verify Password securely on backend
      const verifyRes = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: adminPassword })
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        setPasswordError(err.error || "Şifre doğrulanamadı.");
        setVerifying(false);
        return;
      }

      // 2. If password verified, trigger actual reset
      const resetRes = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (resetRes.ok) {
        showToast("Tüm sistem verileri varsayılan ayarlara sıfırlandı!", "success");
        setShowResetModal(false);
        setAdminPassword('');
        fetchData();
      } else {
        showToast("Sıfırlama işlemi başarısız oldu.", "error");
      }
    } catch (err) {
      showToast("Sunucuyla bağlantı kurulamadı.", "error");
    } finally {
      setVerifying(false);
    }
  };

  const openResetModal = () => {
    setAdminPassword('');
    setPasswordError('');
    setShowResetModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header ribbon */}
      <section className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings color="#6366f1" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Sistem Ayarları</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dinamik becerileri (skills) yönetin ve kritik sistem kurtarma araçlarını şifre korumalı kullanın.</span>
          </div>
        </div>
      </section>

      {/* 2. Grid Section */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Dynamic Skills Manager */}
        <div className="glass-panel" style={{ flex: '2 1 500px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Operasyonel Beceriler ve Yetkinlikler ({skills?.length || 0})
            </h4>
            
            {!addingSkill && !editingSkill && (
              <button 
                onClick={() => setAddingSkill(true)}
                className="wfm-btn wfm-btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                <Plus size={14} /> Yeni Beceri Ekle
              </button>
            )}
          </div>

          {/* Add Skill Form Inline */}
          {addingSkill && (
            <form onSubmit={handleAddSkill} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Örn: Live Chat, Backoffice, Twitter/X"
                className="wfm-input"
                style={{ flex: 1 }}
                required
                autoFocus
              />
              <button type="submit" className="wfm-btn wfm-btn-primary" style={{ padding: '8px 16px', background: '#10b981' }}>
                <Check size={14} /> Ekle
              </button>
              <button type="button" onClick={() => setAddingSkill(false)} className="wfm-btn wfm-btn-secondary" style={{ padding: '8px 12px' }}>
                <X size={14} />
              </button>
            </form>
          )}

          {/* Edit Skill Form Inline */}
          {editingSkill && (
            <form onSubmit={handleEditSkillSubmit} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>Düzenle: <strong>{editingSkill.oldName}</strong> →</span>
              <input 
                type="text"
                value={editingSkill.newName}
                onChange={(e) => setEditingSkill({ ...editingSkill, newName: e.target.value })}
                className="wfm-input"
                style={{ flex: 1 }}
                required
                autoFocus
              />
              <button type="submit" className="wfm-btn wfm-btn-primary" style={{ padding: '8px 16px', background: '#3b82f6' }}>
                <Check size={14} /> Kaydet
              </button>
              <button type="button" onClick={() => setEditingSkill(null)} className="wfm-btn wfm-btn-secondary" style={{ padding: '8px 12px' }}>
                <X size={14} />
              </button>
            </form>
          )}

          {/* Skills Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {skills && skills.length === 0 ? (
              <span style={{ color: '#64748b', fontSize: '0.85rem', gridColumn: '1 / -1', textAlign: 'center', padding: '24px 0' }}>Tanımlı beceri bulunmuyor.</span>
            ) : (
              skills && skills.map(skill => (
                <div 
                  key={skill}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{skill}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => setEditingSkill({ oldName: skill, newName: skill })}
                      className="wfm-btn wfm-btn-secondary"
                      style={{ padding: '4px 6px', borderRadius: '4px', background: 'transparent', border: 'none' }}
                      title="Düzenle"
                    >
                      <Edit2 size={12} color="#60a5fa" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSkill(skill)}
                      className="wfm-btn wfm-btn-danger"
                      style={{ padding: '4px 6px', borderRadius: '4px', background: 'transparent', border: 'none' }}
                      title="Sil"
                    >
                      <Trash2 size={12} color="#f87171" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Security & Reset */}
        <div className="glass-panel" style={{ flex: '1 1 300px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} /> Tehlikeli Bölge ve Sıfırlama
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Aşağıdaki işlem tüm çağrı merkezi verilerini (personeller, takımlar, çizelgeler, mola talepleri ve günlük kayıtları) anında silecek ve sistemi ilk kurulum şemasına sıfırlayacaktır.
          </p>

          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px dashed rgba(239, 68, 68, 0.25)',
            padding: '16px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>UYARI: Bu işlem geri alınamaz!</span>
            <button 
              onClick={openResetModal}
              className="wfm-btn wfm-btn-danger" 
              style={{
                width: '100%',
                padding: '12px',
                background: '#ef4444',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                fontWeight: 700
              }}
            >
              <RefreshCw size={16} /> Tüm Sistemi Sıfırla
            </button>
          </div>
        </div>

      </div>

      {/* 3. Password Verification Overlay Modal */}
      {showResetModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="glass-panel modal-content" style={{ padding: '28px', background: '#111827', border: '1px solid var(--border-glass-bright)', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={22} color="#fbbf24" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Güvenlik Doğrulaması</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResetConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Sistem sıfırlama işlemi son derece kritiktir. Devam etmek için lütfen **Süper Admin** giriş şifrenizi doğrulayın.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Yönetici Giriş Şifresi</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Şifrenizi yazın"
                    className="wfm-input"
                    style={{ paddingLeft: '36px', border: passwordError ? '1px solid #ef4444' : '1px solid var(--border-glass)' }}
                    required
                    autoFocus
                  />
                  <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                </div>
                {passwordError && (
                  <span style={{ color: '#f87171', fontSize: '0.75rem', display: 'block', marginTop: '6px', fontWeight: 600 }}>{passwordError}</span>
                )}
              </div>

              {/* Action buttons inside password modal */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(false)} 
                  className="wfm-btn wfm-btn-secondary" 
                  style={{ flex: 1 }}
                  disabled={verifying}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="wfm-btn wfm-btn-danger" 
                  style={{ flex: 1, background: '#ef4444' }}
                  disabled={verifying}
                >
                  {verifying ? (
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Doğrula ve Sıfırla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
