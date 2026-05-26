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

// --- Helper Functions to Read/Write DB ---
const getInitialData = () => {
  const agents = [
    { id: 'agt-101', name: 'Ahmet Yılmaz', role: 'agent', state: 'Available', stateDuration: 120, avatar: 'AY', avatarColor: '#3b82f6', skills: ['Destek', 'Teknik'], rating: 4.8, stats: { calls: 24, aht: 210, sla: 95, loginTime: '06:12:00' } },
    { id: 'agt-102', name: 'Elif Demir', role: 'agent', state: 'On Call', stateDuration: 45, avatar: 'ED', avatarColor: '#10b981', skills: ['Satış', 'İngilizce'], rating: 4.5, stats: { calls: 18, aht: 185, sla: 88, loginTime: '06:15:00' } },
    { id: 'agt-103', name: 'Can Kaya', role: 'agent', state: 'ACW', stateDuration: 12, avatar: 'CK', avatarColor: '#8b5cf6', skills: ['Destek', 'Şikayet'], rating: 4.2, stats: { calls: 20, aht: 245, sla: 82, loginTime: '06:22:00' } },
    { id: 'agt-104', name: 'Zeynep Çelik', role: 'agent', state: 'Break', stateDuration: 340, avatar: 'ZC', avatarColor: '#f59e0b', skills: ['Fatura', 'Destek'], rating: 4.9, stats: { calls: 15, aht: 170, sla: 98, loginTime: '07:02:00' } },
    { id: 'agt-105', name: 'Merve Şahin', role: 'agent', state: 'Available', stateDuration: 310, avatar: 'MŞ', avatarColor: '#ec4899', skills: ['Teknik', 'Destek'], rating: 4.6, stats: { calls: 22, aht: 225, sla: 92, loginTime: '06:45:00' } },
    { id: 'agt-106', name: 'Burak Aslan', role: 'agent', state: 'On Call', stateDuration: 180, avatar: 'BA', avatarColor: '#f97316', skills: ['Şikayet', 'Satış'], rating: 4.4, stats: { calls: 19, aht: 205, sla: 87, loginTime: '06:30:00' } },
    { id: 'agt-107', name: 'Selin Öztürk', role: 'agent', state: 'Lunch', stateDuration: 1220, avatar: 'SÖ', avatarColor: '#14b8a6', skills: ['İngilizce', 'Fatura'], rating: 4.7, stats: { calls: 12, aht: 195, sla: 94, loginTime: '07:15:00' } },
    { id: 'agt-108', name: 'Emre Koç', role: 'agent', state: 'Meeting', stateDuration: 900, avatar: 'EK', avatarColor: '#6366f1', skills: ['Almanca', 'Destek'], rating: 4.1, stats: { calls: 8, aht: 280, sla: 80, loginTime: '08:00:00' } },
    { id: 'agt-109', name: 'Gamze Polat', role: 'agent', state: 'Available', stateDuration: 15, avatar: 'GP', avatarColor: '#06b6d4', skills: ['Destek', 'Sosyal Medya'], rating: 4.3, stats: { calls: 16, aht: 230, sla: 89, loginTime: '07:45:00' } },
    { id: 'agt-110', name: 'Deniz Aksu', role: 'agent', state: 'Offline', stateDuration: 0, avatar: 'DA', avatarColor: '#64748b', skills: ['Fatura', 'Şikayet'], rating: 4.5, stats: { calls: 0, aht: 0, sla: 0, loginTime: '00:00:00' } },
    { id: 'sup-201', name: 'Kaan Demir', role: 'supervisor', state: 'Available', stateDuration: 420, avatar: 'KD', avatarColor: '#ef4444', skills: ['Yönetim', 'Süpervizör'], rating: 4.9, stats: { calls: 2, aht: 120, sla: 100, loginTime: '06:00:00' } }
  ];

  const initialSchedules = {};
  const today = new Date().toISOString().split('T')[0];
  
  agents.forEach(agent => {
    // Generate simple weekly schedule starting today
    initialSchedules[agent.id] = {
      agentId: agent.id,
      agentName: agent.name,
      weeklyShift: {
        Pazartesi: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
        Salı: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
        Çarşamba: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
        Perşembe: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
        Cuma: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
        Cumartesi: { type: 'Off', lunch: '', breaks: [] },
        Pazar: { type: 'Off', lunch: '', breaks: [] }
      }
    };
  });

  const queue = {
    callsWaiting: 3,
    maxWaitTime: 45,
    sla: 89.4,
    totalCalls: 179,
    handledCalls: 161,
    abandonedCalls: 15,
    occupancy: 78.5,
    targetSla: 85
  };

  const requests = [
    { id: 'req-1', agentId: 'agt-103', agentName: 'Can Kaya', type: 'Mola', duration: 15, status: 'Pending', timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
    { id: 'req-2', agentId: 'agt-105', agentName: 'Merve Şahin', type: 'Yemek', duration: 45, status: 'Pending', timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString() }
  ];

  const activityLog = [
    { id: 'log-1', time: '12:45:10', message: 'Zeynep Çelik durumunu "Mola" olarak değiştirdi.', type: 'state' },
    { id: 'log-2', time: '12:48:32', message: 'Selin Öztürk durumunu "Yemek" olarak değiştirdi.', type: 'state' },
    { id: 'log-3', time: '12:51:15', message: 'Can Kaya mola onay talebi gönderdi.', type: 'request' }
  ];

  return { agents, schedules: initialSchedules, queue, requests, activityLog };
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

// --- Live Call Center Background Simulator ---
// This background loop simulates dynamic, real-time call center activity to show off the UI beautifully!
setInterval(() => {
  const data = readDB();
  let updated = false;

  // 1. Update active states duration
  data.agents.forEach(agent => {
    if (agent.state !== 'Offline') {
      agent.stateDuration += 2;
      updated = true;
    }

    // 2. Simulate state changes occasionally for active agents
    if (agent.role === 'agent' && agent.state !== 'Offline' && Math.random() < 0.08) {
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
          newState = 'ACW'; // After Call Work
        } else {
          newState = 'Available';
        }
        // Increment calls handled when call finishes
        agent.stats.calls += 1;
        data.queue.handledCalls += 1;
        data.queue.totalCalls += 1;
        
        // Add random call to calculate AHT
        const callDuration = Math.floor(Math.random() * 120) + 90; // 90-210 sec
        agent.stats.aht = Math.round((agent.stats.aht * (agent.stats.calls - 1) + callDuration) / agent.stats.calls);
        
        // SLA update simulation
        const callAnsweredInTime = Math.random() < 0.90;
        if (callAnsweredInTime) {
          agent.stats.sla = Math.round((agent.stats.sla * (agent.stats.calls - 1) + 100) / agent.stats.calls);
        } else {
          agent.stats.sla = Math.round((agent.stats.sla * (agent.stats.calls - 1) + 0) / agent.stats.calls);
        }
      } else if (oldState === 'ACW') {
        newState = 'Available';
      } else if (oldState === 'Break' && agent.stateDuration > 300) { // Auto return from break after a while in simulator
        newState = 'Available';
      } else if (oldState === 'Training' && agent.stateDuration > 600) {
        newState = 'Available';
      }

      if (newState !== oldState) {
        agent.state = newState;
        agent.stateDuration = 0;
        
        // Log the activity
        const timeStr = new Date().toTimeString().split(' ')[0];
        data.activityLog.unshift({
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          message: `${agent.name} durumunu "${newState}" olarak değiştirdi.`,
          type: 'state'
        });
        
        // Keep logs capped at 30 entries
        if (data.activityLog.length > 30) {
          data.activityLog.pop();
        }
        updated = true;
      }
    }
  });

  // 3. Queue Simulation
  const queueRoll = Math.random();
  if (queueRoll < 0.35) {
    // New Call arrives
    data.queue.callsWaiting += 1;
    data.queue.totalCalls += 1;
    updated = true;
  } else if (queueRoll < 0.70 && data.queue.callsWaiting > 0) {
    // Call is answered by available agents
    const availableCount = data.agents.filter(a => a.state === 'Available' && a.role === 'agent').length;
    if (availableCount > 0) {
      data.queue.callsWaiting -= 1;
      
      // Select a random available agent to answer the call
      const availableAgents = data.agents.filter(a => a.state === 'Available' && a.role === 'agent');
      const luckyAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
      
      luckyAgent.state = 'On Call';
      luckyAgent.stateDuration = 0;
      
      // Update SLA
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
    // Call is abandoned
    data.queue.callsWaiting -= 1;
    data.queue.abandonedCalls += 1;
    data.queue.sla = parseFloat(( (data.queue.sla * (data.queue.handledCalls) + 0) / (data.queue.handledCalls + 1) ).toFixed(1));
    updated = true;
  }

  // Handle waiting time increment
  if (data.queue.callsWaiting > 0) {
    data.queue.maxWaitTime += 2;
    updated = true;
  } else {
    data.queue.maxWaitTime = 0;
  }

  // Calculate live occupancy based on agent states
  const activeAgents = data.agents.filter(a => a.role === 'agent' && a.state !== 'Offline').length;
  const onCallOrAcw = data.agents.filter(a => a.role === 'agent' && (a.state === 'On Call' || a.state === 'ACW')).length;
  if (activeAgents > 0) {
    data.queue.occupancy = parseFloat(((onCallOrAcw / activeAgents) * 100).toFixed(1));
    updated = true;
  }

  if (updated) {
    writeDB(data);
  }
}, 2000);

// --- REST API Endpoints ---

// Get all WFM data (Dashboard, Schedules, Requests, Logs)
app.get('/api/data', (req, res) => {
  const data = readDB();
  res.json(data);
});

// Add new Agent
app.post('/api/agents', (req, res) => {
  const { name, role, skills, avatarColor } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const data = readDB();
  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const newAgent = {
    id: `agt-${Date.now()}`,
    name,
    role: role || 'agent',
    state: 'Offline',
    stateDuration: 0,
    avatar,
    avatarColor: avatarColor || '#1e293b',
    skills: skills || ['Destek'],
    rating: 5.0,
    stats: { calls: 0, aht: 0, sla: 100, loginTime: '00:00:00' }
  };

  data.agents.push(newAgent);

  // Initialize schedule for the new agent
  data.schedules[newAgent.id] = {
    agentId: newAgent.id,
    agentName: newAgent.name,
    weeklyShift: {
      Pazartesi: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
      Salı: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
      Çarşamba: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
      Perşembe: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
      Cuma: { type: 'Morning (08:00-17:00)', lunch: '12:30-13:30', breaks: ['10:15-10:30', '15:15-15:30'] },
      Cumartesi: { type: 'Off', lunch: '', breaks: [] },
      Pazar: { type: 'Off', lunch: '', breaks: [] }
    }
  };

  // Add event log
  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `Yeni temsilci eklendi: ${newAgent.name} (${newAgent.role})`,
    type: 'admin'
  });

  writeDB(data);
  res.status(201).json(newAgent);
});

// Update Agent details or Active State
app.put('/api/agents/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const data = readDB();
  const index = data.agents.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Agent not found' });

  const oldAgent = data.agents[index];
  
  // Track state change
  if (updates.state && updates.state !== oldAgent.state) {
    updates.stateDuration = 0;
    
    // Login / Logout handling
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

  const updatedAgent = { ...oldAgent, ...updates };
  data.agents[index] = updatedAgent;

  writeDB(data);
  res.json(updatedAgent);
});

// Delete Agent
app.delete('/api/agents/:id', (req, res) => {
  const { id } = req.params;

  const data = readDB();
  const filteredAgents = data.agents.filter(a => a.id !== id);
  
  if (filteredAgents.length === data.agents.length) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const agentName = data.agents.find(a => a.id === id)?.name;
  data.agents = filteredAgents;
  
  // Delete associated schedule
  delete data.schedules[id];

  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `${agentName} sistemden silindi.`,
    type: 'admin'
  });

  writeDB(data);
  res.json({ message: 'Agent deleted successfully' });
});

// Update Agent Schedules
app.put('/api/schedule/:agentId', (req, res) => {
  const { agentId } = req.params;
  const { weeklyShift } = req.body;

  const data = readDB();
  if (!data.schedules[agentId]) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  data.schedules[agentId].weeklyShift = weeklyShift;

  const timeStr = new Date().toTimeString().split(' ')[0];
  data.activityLog.unshift({
    id: `log-${Date.now()}`,
    time: timeStr,
    message: `${data.schedules[agentId].agentName} vardiya planı güncellendi.`,
    type: 'admin'
  });

  writeDB(data);
  res.json(data.schedules[agentId]);
});

// Submit Break Request (from Agent Portal)
app.post('/api/requests', (req, res) => {
  const { agentId, type, duration } = req.body;
  if (!agentId || !type) return res.status(400).json({ error: 'Missing agentId or type' });

  const data = readDB();
  const agent = data.agents.find(a => a.id === agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

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
    message: `${agent.name} yeni bir "${type}" talebi oluşturdu.`,
    type: 'request'
  });

  writeDB(data);
  res.status(201).json(newRequest);
});

// Approve/Deny Break Request (from Supervisor Dashboard)
app.put('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Denied'

  if (!['Approved', 'Denied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const data = readDB();
  const reqIndex = data.requests.findIndex(r => r.id === id);
  if (reqIndex === -1) return res.status(404).json({ error: 'Request not found' });

  const request = data.requests[reqIndex];
  request.status = status;

  // If approved, transition agent to the appropriate state
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

// Reset database to rich initial state
app.post('/api/reset', (req, res) => {
  const defaultData = getInitialData();
  writeDB(defaultData);
  res.json({ message: 'Database reset successfully', data: defaultData });
});

// --- SPA Build Production Static Server ---
// In production, build output is created in the dist/ folder. Express serves those static files.
const DIST_PATH = path.join(__dirname, 'dist');
app.use(express.static(DIST_PATH));

app.get('*', (req, res) => {
  if (fs.existsSync(path.join(DIST_PATH, 'index.html'))) {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  } else {
    res.status(404).send('Vite build folder "dist" not found. Run "npm run build" to generate compile assets.');
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
