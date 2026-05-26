import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Plus, 
  Send, 
  Trash2, 
  Users, 
  Shield, 
  User, 
  ChevronRight, 
  CheckSquare, 
  Square,
  Edit2
} from 'lucide-react';

export default function LiveChat({ data, currentUser, token, fetchData, showToast }) {
  const { chatRooms, roles, teams, agents } = data;
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState('room-general');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  // Room Creation Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [allowedTeams, setAllowedTeams] = useState([]);
  const [allowedAgents, setAllowedAgents] = useState([]);

  // Unread tracker state
  const [unreadCount, setUnreadCount] = useState(0);
  const lastViewedRoomMsgsLengthRef = useRef((() => {
    try {
      const saved = localStorage.getItem(`doxwfm_chat_last_seen_${currentUser?.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })());

  const saveReadCounts = (roomId, count) => {
    if (!currentUser?.id) return;
    lastViewedRoomMsgsLengthRef.current[roomId] = count;
    try {
      localStorage.setItem(`doxwfm_chat_last_seen_${currentUser.id}`, JSON.stringify(lastViewedRoomMsgsLengthRef.current));
    } catch (e) {
      console.error("Error saving read counts to localStorage", e);
    }
  };

  // Message Edit States
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');

  // Unread filter state
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Scroll ref for chat messages area
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Determine rooms visible to this user
  const visibleRooms = (chatRooms || []).filter(room => {
    // Superadmin sees everything
    if (currentUser.roleId === 'role-superadmin') return true;

    const roleMatch = room.allowedRoles.length === 0 || room.allowedRoles.includes(currentUser.roleId);
    const teamMatch = room.allowedTeams.length === 0 || room.allowedTeams.includes(currentUser.teamId);
    const agentMatch = room.allowedAgents.length === 0 || room.allowedAgents.includes(currentUser.id);

    return (roleMatch && teamMatch) || agentMatch;
  });

  // Dynamic visible rooms with unread metadata
  const visibleRoomsWithMetadata = visibleRooms.map(room => {
    const lastLength = lastViewedRoomMsgsLengthRef.current[room.id] || 0;
    const unreadMsgs = room.messages.length - lastLength;
    return {
      ...room,
      unreadCount: unreadMsgs > 0 ? unreadMsgs : 0
    };
  });

  // Sort visible rooms so that rooms with unread messages are floated to the top!
  const sortedRooms = [...visibleRoomsWithMetadata].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    return 0; // maintain default order if both are unread or both are read
  });

  // Filter if showUnreadOnly is toggled
  const filteredRooms = showUnreadOnly 
    ? sortedRooms.filter(r => r.unreadCount > 0) 
    : sortedRooms;

  const activeRoom = visibleRooms.find(r => r.id === activeRoomId) || visibleRooms[0] || null;

  // Track unread messages on sync
  useEffect(() => {
    if (!chatRooms) return;
    
    let totalUnread = 0;
    visibleRooms.forEach(room => {
      // Initialize if not present in ref so we don't treat all historic messages as unread on first load
      if (lastViewedRoomMsgsLengthRef.current[room.id] === undefined) {
        saveReadCounts(room.id, room.messages.length);
      }

      // If we are currently active on this room and chat is open, we assume it's read
      if (isOpen && activeRoomId === room.id) {
        saveReadCounts(room.id, room.messages.length);
        return;
      }
      
      const lastLength = lastViewedRoomMsgsLengthRef.current[room.id] || 0;
      const diff = room.messages.length - lastLength;
      if (diff > 0) {
        totalUnread += diff;
      }
    });

    setUnreadCount(totalUnread);
  }, [chatRooms, isOpen, activeRoomId]);

  // Handle active room messages read count update when switching or opening chat
  useEffect(() => {
    if (activeRoom && isOpen) {
      saveReadCounts(activeRoom.id, activeRoom.messages.length);
      // Recalculate unread count
      let totalUnread = 0;
      visibleRooms.forEach(room => {
        if (room.id === activeRoom.id) return;
        const lastLength = lastViewedRoomMsgsLengthRef.current[room.id] || 0;
        const diff = room.messages.length - lastLength;
        if (diff > 0) {
          totalUnread += diff;
        }
      });
      setUnreadCount(totalUnread);
    }
  }, [activeRoomId, isOpen]);

  // Scroll to bottom when room changes or new messages arrive
  useEffect(() => {
    if (isOpen && activeRoom) {
      scrollToBottom();
    }
  }, [activeRoom?.messages?.length, isOpen]);

  // Send Message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoom || sending) return;

    setSending(true);
    const tempText = messageText.trim();
    setMessageText('');

    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: tempText })
      });

      if (res.ok) {
        // Optimistically reload database WFM payload
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Mesaj gönderilemedi.", "error");
        setMessageText(tempText); // restore text
      }
    } catch (err) {
      showToast("Mesaj gönderilirken hata oluştu.", "error");
      setMessageText(tempText);
    } finally {
      setSending(false);
    }
  };

  // Create Room handler
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return showToast("Lütfen oda adı girin.", "error");

    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRoomName.trim(),
          allowedRoles,
          allowedTeams,
          allowedAgents
        })
      });

      if (res.ok) {
        const room = await res.json();
        showToast(`"${room.name}" sohbet odası oluşturuldu!`, "success");
        setNewRoomName('');
        setAllowedRoles([]);
        setAllowedTeams([]);
        setAllowedAgents([]);
        setShowCreateModal(false);
        setActiveRoomId(room.id);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Oda oluşturulamadı.", "error");
      }
    } catch (err) {
      showToast("Sunucu bağlantısı kurulamadı.", "error");
    }
  };

  // Delete Room handler
  const handleDeleteRoom = async (roomId, roomName) => {
    if (!window.confirm(`"${roomName}" odasını ve içindeki tüm yazışmaları silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Sohbet odası silindi.", "success");
        if (activeRoomId === roomId) {
          setActiveRoomId('room-general');
        }
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Silme işlemi başarısız.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  // Handle Save Edit Message
  const handleSaveEdit = async (e, msgId) => {
    e.preventDefault();
    if (!editingMessageText.trim() || !activeRoom) return;

    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages/${msgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: editingMessageText.trim() })
      });

      if (res.ok) {
        setEditingMessageId(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Mesaj düzenlenemedi.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  // Handle Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Bu mesajı silmek istediğinizden emin misiniz?")) return;

    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages/${msgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Mesaj silinemedi.", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  // Toggles for checkboxes in Create Room form
  const toggleRoleLimit = (id) => {
    setAllowedRoles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleTeamLimit = (id) => {
    setAllowedTeams(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAgentLimit = (id) => {
    setAllowedAgents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isUserAdmin = currentUser.roleId === 'role-superadmin' || 
                      currentUser.roleId === 'role-admin' || 
                      currentUser.roleId === 'role-teamleader' || 
                      currentUser.permissions?.manage_teams;

  // Format timestamp for display
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* closed state: floating action button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: unreadCount > 0 ? 'pulse-blue-chat 2s infinite' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          className="chat-fab-button"
          title="Ekip Sohbeti"
        >
          <MessageSquare size={24} color="white" />
          
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '3px 7px',
              borderRadius: '50px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {unreadCount}
            </span>
          )}
          
          {/* Keyframe animation definitions embedded via style */}
          <style>{`
            @keyframes pulse-blue-chat {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
              70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
            @keyframes pulse-badge-glow {
              0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
              70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
              100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            .chat-fab-button:hover {
              transform: scale(1.08);
            }
            .chat-message-bubble-container {
              position: relative;
            }
            .chat-message-actions {
              display: none;
              position: absolute;
              top: -12px;
              right: 8px;
              background: rgba(15, 23, 42, 0.95);
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 6px;
              padding: 3px 6px;
              gap: 4px;
              z-index: 10;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              align-items: center;
            }
            .chat-message-bubble-container:hover .chat-message-actions {
              display: flex;
            }
          `}</style>
        </button>
      )}

      {/* open state: Collapsible glassmorphism chat card */}
      {isOpen && (
        <div 
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '660px',
            height: '490px',
            display: 'flex',
            borderRadius: '16px',
            border: '1px solid var(--border-glass-bright)',
            backdropFilter: 'blur(25px)',
            background: 'rgba(15, 23, 42, 0.96)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            animation: 'slideUpChat 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Inject slide animation */}
          <style>{`
            @keyframes slideUpChat {
              0% { transform: translateY(40px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          {/* A. Left column: Room List */}
          <aside style={{
            width: '230px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(0,0,0,0.1)'
          }}>
            {/* Rooms Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sohbet Odaları</span>
              
              {isUserAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                  title="Yeni Kısıtlı Oda Ekle"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {/* Unread filter toggle bar */}
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Okunmamış En Üstte</span>
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                style={{
                  background: showUnreadOnly ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: showUnreadOnly ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                  padding: '2px 8px',
                  borderRadius: '50px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: showUnreadOnly ? '#f87171' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {showUnreadOnly ? 'Tümü' : 'Okunmamışlar'}
              </button>
            </div>

            {/* Rooms scroll lists */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredRooms.map(room => {
                  const isActive = activeRoomId === room.id;
                  const isRestricted = room.allowedRoles.length > 0 || room.allowedTeams.length > 0 || room.allowedAgents.length > 0;
                  const unreadMsgs = room.unreadCount;

                  return (
                    <div
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))' : 'transparent',
                        border: isActive ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent',
                        transition: 'all 0.15s'
                      }}
                      className="chat-room-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <Users size={14} color={isActive ? '#60a5fa' : '#64748b'} style={{ flexShrink: 0 }} />
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? 'white' : '#cbd5e1',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {room.name}
                        </span>
                        {isRestricted && (
                          <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }} title="Kısıtlı Görünüm">
                            Kilit
                          </span>
                        )}
                      </div>
                      
                      {/* Trash or unread count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        {unreadMsgs > 0 && !isActive && (
                          <span style={{
                            background: 'linear-gradient(135deg, #ef4444, #f97316)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '50px',
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                            animation: 'pulse-badge-glow 1.5s infinite',
                            display: 'inline-block',
                            lineHeight: 1
                          }}>{unreadMsgs}</span>
                        )}

                        {isUserAdmin && room.id !== 'room-general' && (
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.4
                            }}
                            className="room-delete-btn"
                            title="Odayı Sil"
                          >
                            <Trash2 size={12} color="#f87171" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* B. Right column: Live Chat Area */}
          <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header top bar */}
            <header style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{activeRoom ? activeRoom.name : 'Sohbet Odası Seçin'}</h4>
                <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                  {activeRoom?.id === 'room-general' ? 'Tüm çağrı merkezi personelleri katılım sağlayabilir.' : 'Yalnızca yetkilendirilmiş personeller katılım sağlayabilir.'}
                </p>
              </div>

              {/* Minimize/Close chat window */}
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </header>

            {/* Chat message listing scroll panel */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {activeRoom?.messages?.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', margin: 'auto' }}>Bu odada henüz bir konuşma gerçekleşmedi. İlk mesajı siz yazın!</span>
              ) : (
                activeRoom?.messages?.map((msg, index) => {
                  const isMe = msg.senderId === currentUser.id;
                  
                  return (
                    <div 
                      key={msg.id || index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        gap: '3px',
                        maxWidth: '80%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        position: 'relative'
                      }}
                      className="chat-message-bubble-container"
                    >
                      {/* Sender metadata label */}
                      {!isMe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '2px' }}>
                          {/* Avatar Circle */}
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            background: msg.senderAvatarColor || '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            color: 'white'
                          }}>
                            {msg.senderAvatar}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{msg.senderName}</span>
                        </div>
                      )}

                      {/* Msg bubble card or Inline Edit input form */}
                      {editingMessageId === msg.id ? (
                        <form onSubmit={(e) => handleSaveEdit(e, msg.id)} style={{ display: 'flex', gap: '6px', width: '100%', minWidth: '220px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <input 
                            type="text"
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            className="wfm-input"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1, borderRadius: '6px' }}
                            required
                            autoFocus
                          />
                          <button type="submit" className="wfm-btn wfm-btn-primary" style={{ padding: '6px 10px', background: '#10b981', minWidth: '32px' }} title="Kaydet">
                            <Send size={10} />
                          </button>
                          <button type="button" onClick={() => setEditingMessageId(null)} className="wfm-btn wfm-btn-secondary" style={{ padding: '6px 10px', minWidth: '32px' }} title="Vazgeç">
                            <X size={10} />
                          </button>
                        </form>
                      ) : (
                        <div 
                          style={{
                            padding: '10px 14px',
                            borderRadius: isMe ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                            background: isMe ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.04)',
                            border: isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.02)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', color: '#f8fafc', lineHeight: 1.4 }}>{msg.text}</span>
                        </div>
                      )}

                      {/* Edit/Delete action bar triggers on hover for own messages */}
                      {isMe && editingMessageId !== msg.id && (
                        <div className="chat-message-actions">
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditingMessageText(msg.text);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="Düzenle"
                          >
                            <Edit2 size={12} color="#60a5fa" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="Sil"
                          >
                            <Trash2 size={12} color="#f87171" />
                          </button>
                        </div>
                      )}
                      
                      {/* time stamp */}
                      <span style={{ fontSize: '0.55rem', color: '#64748b', marginRight: '4px', marginLeft: '4px' }}>
                        {msg.edited && <span style={{ fontStyle: 'italic', marginRight: '4px', color: '#38bdf8' }}>(düzenlendi)</span>}
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
              {/* Invisible scroll target anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom text bar send form */}
            <form onSubmit={handleSendMessage} style={{
              padding: '12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(0,0,0,0.15)'
            }}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={activeRoom ? `${activeRoom.name} odasına yazın...` : 'Sohbet alanı aktif değil'}
                disabled={!activeRoom || sending}
                className="wfm-input"
                style={{ flex: 1, borderRadius: '8px', fontSize: '0.8rem', padding: '10px 14px' }}
              />
              <button
                type="submit"
                disabled={!activeRoom || !messageText.trim() || sending}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: (!activeRoom || !messageText.trim()) ? 0.4 : 1
                }}
              >
                <Send size={16} color="white" />
              </button>
            </form>
          </main>
        </div>
      )}

      {/* C. Create Room overlay Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="glass-panel modal-content" style={{ padding: '24px', background: '#111827', border: '1px solid var(--border-glass-bright)', maxWidth: '480px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Yeni Sohbet Odası Oluştur</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Odaların görünürlük sınırlarını ve erişimlerini yapılandırın.</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Room name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Oda Adı</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Örn: Outbound Satış Grubu, Liderler Odası"
                  className="wfm-input"
                  required
                />
              </div>

              {/* Advanced Access Filters: Roles, Teams, Specific Agents */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                
                {/* 1. Roles Visibility limits */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Shield size={12} /> Yetki Kademeleri (Roller) Kısıtı
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {roles && roles.map(role => {
                      const isSelected = allowedRoles.includes(role.id);
                      return (
                        <div 
                          key={role.id}
                          onClick={() => toggleRoleLimit(role.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', cursor: 'pointer', color: isSelected ? '#a855f7' : '#cbd5e1' }}
                        >
                          {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                          <span>{role.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginTop: '3px' }}>* Boş bırakılırsa tüm roller görebilir.</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                {/* 2. Teams Visibility limits */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Users size={12} /> Departman & Takımlar Kısıtı
                  </span>
                  {teams && teams.length === 0 ? (
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>Tanımlı takım bulunmuyor.</span>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {teams && teams.map(team => {
                        const isSelected = allowedTeams.includes(team.id);
                        return (
                          <div 
                            key={team.id}
                            onClick={() => toggleTeamLimit(team.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', cursor: 'pointer', color: isSelected ? '#34d399' : '#cbd5e1' }}
                          >
                            {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                            <span>{team.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <span style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginTop: '3px' }}>* Boş bırakılırsa tüm takımlar görebilir.</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                {/* 3. Specific Agent visibility limits */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <User size={12} /> Özel Kişisel Erişim (İsteğe Bağlı)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {agents && agents.filter(a => a.id !== currentUser.id).map(agent => {
                      const isSelected = allowedAgents.includes(agent.id);
                      return (
                        <div 
                          key={agent.id}
                          onClick={() => toggleAgentLimit(agent.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', cursor: 'pointer', color: isSelected ? '#a855f7' : '#cbd5e1' }}
                        >
                          {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                          <span>{agent.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginTop: '3px' }}>* Ekstra tekil kişi yetkilendirmesi eklemek için seçin.</span>
                </div>

              </div>

              {/* Action buttons inside form */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="wfm-btn wfm-btn-secondary" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="wfm-btn wfm-btn-primary" style={{ flex: 1 }}>
                  <span>Oda Oluştur</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
