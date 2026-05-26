import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'database.json');

// --- Relational Database Schema Initializer (ZERO Mock Data Policy) ---
const getInitialData = () => {
  // Pre-seed default core WFM roles
  const roles = [
    {
      id: 'role-superadmin',
      name: 'Süper Admin',
      description: 'Sistem sahibi, tam yetki.',
      permissions: {
        manage_roles: true,
        manage_teams: true,
        manage_agents: true,
        manage_schedules: true,
        approve_requests: true,
        view_all_dashboards: true,
        view_personal_only: false
      }
    },
    {
      id: 'role-admin',
      name: 'Admin',
      description: 'Çağrı merkezi operasyon yöneticisi.',
      permissions: {
        manage_roles: false,
        manage_teams: true,
        manage_agents: true,
        manage_schedules: true,
        approve_requests: true,
        view_all_dashboards: true,
        view_personal_only: false
      }
    },
    {
      id: 'role-teamleader',
      name: 'Takım Lideri',
      description: 'Takım lideri, kendi takımı için vardiya planlar.',
      permissions: {
        manage_roles: false,
        manage_teams: false,
        manage_agents: false,
        manage_schedules: true,
        approve_requests: true,
        view_all_dashboards: true,
        view_personal_only: false
      }
    },
    {
      id: 'role-quality',
      name: 'Kalite Yöneticisi',
      description: 'Kalite değerlendirme ve performans izleme yetkilisi.',
      permissions: {
        manage_roles: false,
        manage_teams: false,
        manage_agents: false,
        manage_schedules: false,
        approve_requests: false,
        view_all_dashboards: true,
        view_personal_only: false
      }
    },
    {
      id: 'role-agent',
      name: 'Müşteri Temsilcisi',
      description: 'Çağrı merkezi müşteri temsilcisi.',
      permissions: {
        manage_roles: false,
        manage_teams: false,
        manage_agents: false,
        manage_schedules: false,
        approve_requests: false,
        view_all_dashboards: false,
        view_personal_only: true
      }
    }
  ];

  // SEED ONLY THE SINGLE SUPER ADMIN - Absolutely no mock agents!
  const agents = [
    {
      id: 'superadmin-100',
      name: 'Doxish Super Admin',
      roleId: 'role-superadmin',
      username: 'Doxish',
      password: 'DoxWFM44.',
      teamId: '',
      state: 'Available',
      stateDuration: 0,
      avatar: 'DX',
      avatarColor: '#6366f1',
      skills: ['Sistem'],
      rating: 5.0,
      stats: { calls: 0, chats: 0, emails: 0, aht: 0, sla: 100, loginTime: '06:00:00' }
    }
  ];

  const teams = [];
  const schedules = {};
  
  // Set up 96-slot schedule grid for the Super Admin (all Off by default)
  schedules['superadmin-100'] = Array(96).fill(0);

  const queue = {
    callsWaiting: 0,
    maxWaitTime: 0,
    sla: 100.0,
    totalCalls: 0,
    handledCalls: 0,
    abandonedCalls: 0,
    occupancy: 0.0,
    targetSla: 85
  };

  const requests = [];
  
  const activityLog = [
    { id: 'log-1', time: '13:00:00', message: 'Doxish WFM Sistemi ilk kurulumu başarıyla tamamlandı.', type: 'admin' }
  ];

  return { roles, teams, agents, schedules, queue, requests, activityLog };
};

const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const data = getInitialData();
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    return getInitialData();
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database:', err);
  }
};

// Force DB re-seeding if mock data is present or migrator criteria is met
(() => {
  const data = readDB();
  const hasMultipleAgentsInit = data.agents.length > 2; // if old mock agents are there, wipe and re-seed!
  const hasRoleSuperadmin = data.roles && data.roles.some(r => r.id === 'role-superadmin');
  
  if (hasMultipleAgentsInit || !hasRoleSuperadmin) {
    console.log("Enterprise Database Migration: Wiping all mock data & initializing core schemas...");
    const resetData = getInitialData();
    writeDB(resetData);
  }
})();

// --- Authentication & Permission Check Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Oturum açılması gerekmektedir.' });

  const tokenParts = token.split('-session-');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'wfm-token') {
    return res.status(403).json({ error: 'Oturum geçersiz veya süresi dolmuş.' });
  }

  const userId = tokenParts[1];
  const data = readDB();
  const user = data.agents.find(a => a.id === userId);

  if (!user) return res.status(403).json({ error: 'Kullanıcı oturumu bulunamadı.' });

  // Load permissions dynamically based on user roleId
  const role = data.roles.find(r => r.id === user.roleId);
  user.permissions = role ? role.permissions : {};
  user.roleName = role ? role.name : 'Unknown';

  req.user = user;
  next();
};

const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Giriş gereklidir.' });
    if (!req.user.permissions || !req.user.permissions[permissionKey]) {
      return res.status(403).json({ error: `Bu işlem yetkiniz dahilinde değil. ('${permissionKey}' yetkisi gerekiyor).` });
    }
    next();
  };
};

// --- Live Call Center Background Simulator (Robust version) ---
setInterval(() => {
  const data = readDB();
  let updated = false;

  // Filter actual agents (excluding admins/supervisors who don't answer calls)
  const availableAgents = data.agents.filter(a => a.roleId === 'role-agent' && a.state !== 'Offline');
  
  // If there are no active agents in the database, skip simulations gracefully!
  if (availableAgents.length === 0) {
    // Keep logs clean, just increment duration for the superadmin or anyone online
    data.agents.forEach(agent => {
      if (agent.state !== 'Offline') {
        agent.stateDuration += 2;
        updated = true;
      }
    });
    if (updated) writeDB(data);
    return;
  }

  // Update duration
  data.agents.forEach(agent => {
    if (agent.state !== 'Offline') {
      agent.stateDuration += 2;
      updated = true;
    }

    // Simulate states dynamically only for Müşteri Temsilcisi (role-agent)
    if (agent.roleId === 'role-agent' && agent.state !== 'Offline' && Math.random() < 0.08) {
      const roll = Math.random();
      const oldState = agent.state;
      let newState = oldState;

      if (oldState === 'Available') {
        if (roll < 0.70) {
          newState = 'On Call';
        } else if (roll < 0.85) {
          newState = 'Break';
        } else {
          newState = 'Training';
        }
      } else if (oldState === 'On Call') {
        if (roll < 0.80) {
          newState = 'ACW';
        } else {
          newState = 'Available';
        }
        
        // Find channel type
        const team = data.teams.find(t => t.id === agent.teamId);
        const channelType = team ? (team.channelType || 'Call') : 'Call';

        let durationMin = 90;
        let durationMax = 120;
        let count = 0;

        if (channelType === 'Call') {
          agent.stats.calls = (agent.stats.calls || 0) + 1;
          count = agent.stats.calls;
          data.queue.handledCalls += 1;
          data.queue.totalCalls += 1;
        } else if (channelType === 'Chat') {
          agent.stats.chats = (agent.stats.chats || 0) + 1;
          count = agent.stats.chats;
          data.queue.handledCalls += 1;
          data.queue.totalCalls += 1;
          durationMin = 180;
          durationMax = 300;
        } else if (channelType === 'E-Posta') {
          agent.stats.emails = (agent.stats.emails || 0) + 1;
          count = agent.stats.emails;
          data.queue.handledCalls += 1;
          data.queue.totalCalls += 1;
          durationMin = 300;
          durationMax = 600;
        }

        const duration = Math.floor(Math.random() * (durationMax - durationMin)) + durationMin;
        agent.stats.aht = Math.round((agent.stats.aht * (count - 1) + duration) / count);
        
        const answeredInTime = Math.random() < (channelType === 'Call' ? 0.90 : channelType === 'Chat' ? 0.85 : 0.95);
        if (answeredInTime) {
          agent.stats.sla = Math.round((agent.stats.sla * (count - 1) + 100) / count);
        } else {
          agent.stats.sla = Math.round((agent.stats.sla * (count - 1) + 0) / count);
        }
      } else if (oldState === 'ACW') {
        newState = 'Available';
      } else if (oldState === 'Break' && agent.stateDuration > 300) {
        newState = 'Available';
      } else if (oldState === 'Training' && agent.stateDuration > 600) {
        newState = 'Available';
      }

      if (newState !== oldState) {
        agent.state = newState;
        agent.stateDuration = 0;
        
        const timeStr = new Date().toTimeString().split(' ')[0];
        data.activityLog.unshift({
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          message: `${agent.name} durumunu "${newState}" olarak değiştirdi.`,
          type: 'state'
        });
        
        if (data.activityLog.length > 30) data.activityLog.pop();
        updated = true;
      }
    }
  });

  // Call queue simulation
  const queueRoll = Math.random();
  if (queueRoll < 0.35) {
    data.queue.callsWaiting += 1;
    data.queue.totalCalls += 1;
    updated = true;
  } else if (queueRoll < 0.70 && data.queue.callsWaiting > 0) {
    // Only Available agents who are in a "Call" team (or have no team, which defaults to Call)
    const availAgents = data.agents.filter(a => {
      if (a.state !== 'Available' || a.roleId !== 'role-agent') return false;
      const team = data.teams.find(t => t.id === a.teamId);
      const channelType = team ? (team.channelType || 'Call') : 'Call';
      return channelType === 'Call';
    });

    if (availAgents.length > 0) {
      data.queue.callsWaiting -= 1;
      const luckyAgent = availAgents[Math.floor(Math.random() * availAgents.length)];
      
      luckyAgent.state = 'On Call';
      luckyAgent.stateDuration = 0;
      
      const waitTime = data.queue.maxWaitTime;
      const metSla = waitTime < 20;
      
      if (!metSla) {
        data.queue.sla = parseFloat(( (data.queue.sla * (data.queue.handledCalls) + 0) / (data.queue.handledCalls + 1) ).toFixed(1));
      } else {
        data.queue.sla = parseFloat(( (data.queue.sla * (data.queue.handledCalls) + 100) / (data.queue.handledCalls + 1) ).toFixed(1));
      }
      
      data.queue.maxWaitTime = data.queue.callsWaiting > 0 ? Math.floor(Math.random() * 20) + 10 : 0;
      updated = true;
    }
  } else if (queueRoll < 0.78 && data.queue.callsWaiting > 0) {
    data.queue.callsWaiting -= 1;
    data.queue.abandonedCalls += 1;
    data.queue.sla = parseFloat(( (data.queue.sla * (data.queue.handledCalls) + 0) / (data.queue.handledCalls + 1) ).toFixed(1));
    updated = true;
  }

  if (data.queue.callsWaiting > 0) {
    data.queue.maxWaitTime += 2;
    updated = true;
  } else {
    data.queue.maxWaitTime = 0;
  }

  const activeAgents = data.agents.filter(a => a.roleId === 'role-agent' && a.state !== 'Offline').length;
  const onCallOrAcw = data.agents.filter(a => a.roleId === 'role-agent' && (a.state === 'On Call' || a.state === 'ACW')).length;
  if (activeAgents > 0) {
    data.queue.occupancy = parseFloat(((onCallOrAcw / activeAgents) * 100).toFixed(1));
    updated = true;
  }

  if (updated) writeDB(data);
}, 2000);

// --- REST API Endpoints ---

// Authentication Router
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
  }

  const data = readDB();
  const user = data.agents.find(
    u => u.username?.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre girdiniz.' });
  }

  const token = `wfm-token-session-${user.id}`;
  
  // Find role and attach permissions + roleName so the frontend instantly registers user privileges
  const role = data.roles.find(r => r.id === user.roleId);
  const permissions = role ? role.permissions : {};
  const roleName = role ? role.name : 'Unknown';
  
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      roleId: user.roleId,
      username: user.username,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      permissions,
      roleName
    }
  });
});

// GET Global WFM Data (Authed)
app.get('/api/data', authenticateToken, (req, res) => {
  const data = readDB();
  
  // Wipe out passwords before sending to front-end for security
  const cleanAgents = data.agents.map(a => {
    const { password, ...rest } = a;
    return rest;
  });

  res.json({
    roles: data.roles,
    teams: data.teams,
    agents: cleanAgents,
    schedules: data.schedules,
    queue: data.queue,
    requests: data.requests,
    activityLog: data.activityLog
  });
});

// --- Dynamic ROLES CRUD ---
app.get('/api/roles', authenticateToken, (req, res) => {
  const data = readDB();
  res.json(data.roles);
});

app.post('/api/roles', authenticateToken, requirePermission('manage_roles'), (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name) return res.status(400).json({ error: 'Rol ismi girmelisiniz.' });

  const data = readDB();
  const newRole = {
    id: `role-${Date.now()}`,
    name,
    description: description || '',
    permissions: permissions || {
      manage_roles: false,
      manage_teams: false,
      manage_agents: false,
      manage_schedules: false,
      approve_requests: false,
      view_all_dashboards: false,
      view_personal_only: true
    }
  };

  data.roles.push(newRole);
  writeDB(data);
  res.status(201).json(newRole);
});

app.put('/api/roles/:id', authenticateToken, requirePermission('manage_roles'), (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  if (['role-superadmin', 'role-agent'].includes(id)) {
    return res.status(403).json({ error: 'Sistem varsayılan rollerinin izinleri değiştirilemez.' });
  }

  const data = readDB();
  const index = data.roles.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: 'Rol bulunamadı.' });

  data.roles[index] = {
    ...data.roles[index],
    name: name || data.roles[index].name,
    description: description || data.roles[index].description,
    permissions: permissions || data.roles[index].permissions
  };

  writeDB(data);
  res.json(data.roles[index]);
});

app.delete('/api/roles/:id', authenticateToken, requirePermission('manage_roles'), (req, res) => {
  const { id } = req.params;
  
  if (['role-superadmin', 'role-agent'].includes(id)) {
    return res.status(403).json({ error: 'Sistem varsayılan rollerini silemezsiniz.' });
  }

  const data = readDB();
  // Check if any agent is currently assigned to this role
  const isUsed = data.agents.some(a => a.roleId === id);
  if (isUsed) {
    return res.status(400).json({ error: 'Bu role atanmış personeller bulunmaktadır. Silmeden önce personellerin rollerini değiştirin.' });
  }

  data.roles = data.roles.filter(r => r.id !== id);
  writeDB(data);
  res.json({ message: 'Role deleted successfully' });
});

// --- Dynamic TEAMS CRUD ---
app.get('/api/teams', authenticateToken, (req, res) => {
  const data = readDB();
  res.json(data.teams);
});

app.post('/api/teams', authenticateToken, requirePermission('manage_teams'), (req, res) => {
  const { name, color, leaderId, channelType } = req.body;
  if (!name) return res.status(400).json({ error: 'Takım ismi girmelisiniz.' });

  const data = readDB();
  const newTeam = {
    id: `team-${Date.now()}`,
    name,
    color: color || '#3b82f6',
    leaderId: leaderId || '',
    channelType: channelType || 'Call'
  };

  data.teams.push(newTeam);
  writeDB(data);
  res.status(201).json(newTeam);
});

app.put('/api/teams/:id', authenticateToken, requirePermission('manage_teams'), (req, res) => {
  const { id } = req.params;
  const { name, color, leaderId, channelType } = req.body;

  const data = readDB();
  const index = data.teams.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Takım bulunamadı.' });

  data.teams[index] = {
    ...data.teams[index],
    name: name || data.teams[index].name,
    color: color || data.teams[index].color,
    leaderId: leaderId !== undefined ? leaderId : data.teams[index].leaderId,
    channelType: channelType !== undefined ? channelType : data.teams[index].channelType || 'Call'
  };

  writeDB(data);
  res.json(data.teams[index]);
});

app.delete('/api/teams/:id', authenticateToken, requirePermission('manage_teams'), (req, res) => {
  const { id } = req.params;
  
  const data = readDB();
  // Clear teamId references in agents
  data.agents.forEach(agent => {
    if (agent.teamId === id) agent.teamId = '';
  });

  data.teams = data.teams.filter(t => t.id !== id);
  writeDB(data);
  res.json({ message: 'Team deleted successfully' });
});

// --- AGENTS CRUD (Now checking granular permission) ---
app.post('/api/agents', authenticateToken, requirePermission('manage_agents'), (req, res) => {
  const { name, roleId, teamId, skills, avatarColor, username, password } = req.body;
  if (!name || !username || !password || !roleId) {
    return res.status(400).json({ error: 'İsim, kullanıcı adı, şifre ve rol alanları boş bırakılamaz.' });
  }

  const data = readDB();
  
  const userExists = data.agents.some(a => a.username?.toLowerCase() === username.toLowerCase());
  if (userExists) {
    return res.status(400).json({ error: 'Bu kullanıcı adı sistemde zaten kayıtlı.' });
  }

  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const newAgent = {
    id: `agt-${Date.now()}`,
    name,
    roleId,
    teamId: teamId || '',
    username,
    password,
    state: 'Offline',
    stateDuration: 0,
    avatar,
    avatarColor: avatarColor || '#1e293b',
    skills: skills || ['Destek'],
    rating: 5.0,
    stats: { calls: 0, chats: 0, emails: 0, aht: 0, sla: 100, loginTime: '00:00:00' }
  };

  data.agents.push(newAgent);
  
  // Set up 96-slot blank schedule timeline (all Off / index 0)
  data.schedules[newAgent.id] = Array(96).fill(0);

  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `Yeni kullanıcı eklendi: ${newAgent.name} (Rol: ${newAgent.roleId})`,
    type: 'admin'
  });

  writeDB(data);
  const { password: pw, ...cleanUser } = newAgent;
  res.status(201).json(cleanUser);
});

app.put('/api/agents/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const currentUser = req.user;

  // Permission logic: Can update self, or needs manage_agents
  if (currentUser.id !== id && !currentUser.permissions.manage_agents) {
    return res.status(403).json({ error: 'Bu personeli düzenleme yetkiniz bulunmamaktadır.' });
  }

  // Security gate
  if (id === 'superadmin-100' && currentUser.id !== 'superadmin-100') {
    return res.status(403).json({ error: 'Ana Süper Admin bilgilerini başkası değiştiremez.' });
  }

  const data = readDB();
  const index = data.agents.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Personel bulunamadı.' });

  const oldAgent = data.agents[index];

  // Log state change
  if (updates.state && updates.state !== oldAgent.state) {
    updates.stateDuration = 0;
    if (updates.state === 'Offline') {
      updates.stats = { ...oldAgent.stats, loginTime: '00:00:00' };
    } else if (oldAgent.state === 'Offline') {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      updates.stats = { ...oldAgent.stats, loginTime: timeStr };
    }

    const timeStr = new Date().toTimeString().split(' ')[0];
    data.activityLog.unshift({
      id: `log-${Date.now()}`,
      time: timeStr,
      message: `${oldAgent.name} durumu "${updates.state}" olarak güncellendi.`,
      type: 'state'
    });
  }

  data.agents[index] = { ...oldAgent, ...updates };
  writeDB(data);

  const { password, ...cleanAgent } = data.agents[index];
  res.json(cleanAgent);
});

app.delete('/api/agents/:id', authenticateToken, requirePermission('manage_agents'), (req, res) => {
  const { id } = req.params;
  if (id === 'superadmin-100') {
    return res.status(403).json({ error: 'Süper Admin hesabı sistemden silinemez.' });
  }

  const data = readDB();
  const filtered = data.agents.filter(a => a.id !== id);
  if (filtered.length === data.agents.length) {
    return res.status(404).json({ error: 'Personel bulunamadı.' });
  }

  const agentName = data.agents.find(a => a.id === id)?.name;
  data.agents = filtered;
  delete data.schedules[id];

  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `${agentName} sistemden silindi.`,
    type: 'admin'
  });

  writeDB(data);
  res.json({ message: 'User deleted successfully' });
});

// --- SCHEDULES ENDPOINTS (96-slot minute grid) ---
app.get('/api/schedule/:agentId', authenticateToken, (req, res) => {
  const { agentId } = req.params;
  const data = readDB();
  const schedule = data.schedules[agentId] || Array(96).fill(0);
  res.json(schedule);
});

// Save single agent's daily timeline array (Requires manage_schedules)
app.put('/api/schedule/:agentId', authenticateToken, requirePermission('manage_schedules'), (req, res) => {
  const { agentId } = req.params;
  const { timeline } = req.body; // Expects 96-element array

  if (!Array.isArray(timeline) || timeline.length !== 96) {
    return res.status(400).json({ error: 'Hatalı vardiya şeması. 96 elemanlı dizi gereklidir.' });
  }

  const data = readDB();
  data.schedules[agentId] = timeline;

  const agentName = data.agents.find(a => a.id === agentId)?.name || agentId;
  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `${agentName} için vardiya detayları güncellendi.`,
    type: 'admin'
  });

  writeDB(data);
  res.json(timeline);
});

// Bulk schedule assignments for multiple agents in a range (Requires manage_schedules)
app.post('/api/schedule/bulk', authenticateToken, requirePermission('manage_schedules'), (req, res) => {
  const { agentIds, startSlot, endSlot, activityCode } = req.body;

  if (!Array.isArray(agentIds) || agentIds.length === 0) {
    return res.status(400).json({ error: 'Lütfen en az bir temsilci seçin.' });
  }
  if (startSlot < 0 || endSlot > 95 || startSlot > endSlot) {
    return res.status(400).json({ error: 'Geçersiz saat zaman aralığı (0-95 arası olmalıdır).' });
  }
  if (activityCode === undefined || activityCode < 0 || activityCode > 7) {
    return res.status(400).json({ error: 'Geçersiz aktivite kodu (0-7 arası olmalıdır).' });
  }

  const data = readDB();
  agentIds.forEach(id => {
    if (!data.schedules[id]) {
      data.schedules[id] = Array(96).fill(0);
    }
    // Write activity to specific range in the 96 slots grid
    for (let i = startSlot; i <= endSlot; i++) {
      data.schedules[id][i] = activityCode;
    }
  });

  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `${agentIds.length} temsilci için toplu aktivite ataması yapıldı (Slots: ${startSlot}-${endSlot}, Kod: ${activityCode})`,
    type: 'admin'
  });

  writeDB(data);
  res.json({ message: 'Bulk schedules written successfully' });
});

// --- Dynamic REQUESTS Router ---
app.post('/api/requests', authenticateToken, (req, res) => {
  const { agentId, type, duration } = req.body;
  const currentUser = req.user;

  if (currentUser.roleId === 'role-agent' && currentUser.id !== agentId) {
    return res.status(403).json({ error: 'Diğer personeller adına mola talebi açamazsınız.' });
  }

  const data = readDB();
  const agent = data.agents.find(a => a.id === agentId);
  if (!agent) return res.status(404).json({ error: 'Personel bulunamadı.' });

  const newRequest = {
    id: `req-${Date.now()}`,
    agentId,
    agentName: agent.name,
    type,
    duration: parseInt(duration) || 15,
    status: 'Pending',
    timestamp: new Date().toISOString()
  };

  data.requests.push(newRequest);

  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `${agent.name} yeni bir "${type}" talebi gönderdi.`,
    type: 'request'
  });

  writeDB(data);
  res.status(201).json(newRequest);
});

app.put('/api/requests/:id', authenticateToken, requirePermission('approve_requests'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Denied'

  if (!['Approved', 'Denied'].includes(status)) {
    return res.status(400).json({ error: 'Grup onayı geçersiz.' });
  }

  const data = readDB();
  const reqIndex = data.requests.findIndex(r => r.id === id);
  if (reqIndex === -1) return res.status(404).json({ error: 'Talep bulunamadı.' });

  const request = data.requests[reqIndex];
  request.status = status;

  if (status === 'Approved') {
    const agentIndex = data.agents.findIndex(a => a.id === request.agentId);
    if (agentIndex !== -1) {
      const stateMapping = {
        'Mola': 'Break',
        'Yemek': 'Lunch',
        'Toplantı': 'Meeting',
        'Eğitim': 'Training'
      };
      
      const nextState = stateMapping[request.type] || 'Break';
      data.agents[agentIndex].state = nextState;
      data.agents[agentIndex].stateDuration = 0;
    }
  }

  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `${request.agentName} talebi (${request.type}) ${status === 'Approved' ? 'onaylandı' : 'reddedildi'}.`,
    type: 'request'
  });

  writeDB(data);
  res.json(request);
});

// Reset database (Requires manage_roles which is superadmin only)
app.post('/api/reset', authenticateToken, requirePermission('manage_roles'), (req, res) => {
  const defaultData = getInitialData();
  writeDB(defaultData);
  res.json({ message: 'Database reset successfully', data: defaultData });
});

// --- SPA Build Production Static Server ---
const DIST_PATH = path.join(__dirname, 'dist');
app.use(express.static(DIST_PATH));

app.get('*', (req, res) => {
  if (fs.existsSync(path.join(DIST_PATH, 'index.html'))) {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  } else {
    res.status(404).send('Vite build folder "dist" not found. Run "npm run build" to compile assets.');
  }
});

app.listen(PORT, () => {
  console.log(`Enterprise WFM Backend server running on http://localhost:${PORT}`);
});
