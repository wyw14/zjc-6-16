const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 6045;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const CARD_PAIRS = 8;
let leaderboard = [];

let announcements = [
  {
    id: 1,
    title: '欢迎来到翻牌配对游戏',
    content: '挑战你的记忆力，看看谁能最快完成所有配对！',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 30).toISOString(),
    createTime: new Date().toISOString()
  }
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

app.get('/api/shuffle', (req, res) => {
  const cardIds = [];
  for (let i = 1; i <= CARD_PAIRS; i++) {
    cardIds.push(i, i);
  }
  const shuffled = shuffle(cardIds);
  res.json({ cards: shuffled });
});

app.post('/api/score', (req, res) => {
  const { time, playerName } = req.body;
  
  if (typeof time !== 'number' || time <= 0) {
    return res.status(400).json({ error: '无效的成绩数据' });
  }

  const entry = {
    id: Date.now(),
    time: time,
    playerName: playerName || '匿名玩家',
    date: new Date().toLocaleString('zh-CN')
  };

  leaderboard.push(entry);
  leaderboard.sort((a, b) => a.time - b.time);
  leaderboard = leaderboard.slice(0, 10);

  const rank = leaderboard.findIndex(e => e.id === entry.id) + 1;

  res.json({
    success: true,
    rank: rank,
    leaderboard: leaderboard
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json({ leaderboard: leaderboard });
});

app.get('/api/announcements', (req, res) => {
  const now = new Date();
  const activeAnnouncements = announcements.filter(a => {
    const start = new Date(a.startTime);
    const end = new Date(a.endTime);
    return start <= now && now <= end;
  });
  res.json({ announcements: activeAnnouncements });
});

app.get('/api/admin/announcements', (req, res) => {
  res.json({ announcements: announcements });
});

app.post('/api/admin/announcements', (req, res) => {
  const { title, content, startTime, endTime } = req.body;

  if (!title || !content || !startTime || !endTime) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const newAnnouncement = {
    id: Date.now(),
    title,
    content,
    startTime,
    endTime,
    createTime: new Date().toISOString()
  };

  announcements.push(newAnnouncement);
  res.json({ success: true, announcement: newAnnouncement });
});

app.put('/api/admin/announcements/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, content, startTime, endTime } = req.body;

  const index = announcements.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '公告不存在' });
  }

  announcements[index] = {
    ...announcements[index],
    title: title || announcements[index].title,
    content: content || announcements[index].content,
    startTime: startTime || announcements[index].startTime,
    endTime: endTime || announcements[index].endTime
  };

  res.json({ success: true, announcement: announcements[index] });
});

app.delete('/api/admin/announcements/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = announcements.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '公告不存在' });
  }

  announcements.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
