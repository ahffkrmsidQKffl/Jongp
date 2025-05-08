const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = NODE_ENV === 'development' ? 5000 : (process.env.PORT || 60015);
const distPath = path.join(__dirname, '../frontend/dist');

const loadJson = (filename) => {
  try {
    return JSON.parse(fs.readFileSync(`./data/${filename}`, 'utf-8'));
  } catch (err) {
    console.error(`❌ ${filename} 파일 로딩 실패:`, err);
    return [];
  }
};

const saveJson = (filename, data) => {
  fs.writeFileSync(`./data/${filename}`, JSON.stringify(data, null, 2));
};

let users = loadJson('userData.json');
let bookmarks = loadJson('bookmarks.json');
let ratings = loadJson('ratingData.json');
let parkingData = loadJson('parkingData.json');
let nextRatingId = ratings.length ? Math.max(...ratings.map(r => r.rating_id)) + 1 : 1;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log('➡️ 요청 URL:', req.url);
  next();
});

const authMiddleware = (req, res, next) => {
  const email = req.headers['x-user-email'];
  req.user = email ? users.find(u => u.email === email) : null;
  if (!req.user) return res.status(401).json({ status: 401, message: '로그인이 필요합니다.', data: null });
  next();
};

if (NODE_ENV === 'production') {
  const indexPath = path.join(distPath, 'index.html');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(indexPath);
  });
}

// ✅ 사용자 API
app.post('/api/users/register', (req, res) => {
  const { email } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ status: 409, message: '이미 사용 중인 이메일입니다.', data: null });
  }
  const id = users.length ? users[users.length - 1].id + 1 : 1;
  const joined_at = new Date().toISOString().split('T')[0];
  const user = { ...req.body, id, joined_at };
  users.push(user);
  saveJson('userData.json', users);
  res.status(201).json({ status: 201, message: '회원가입 성공', data: null });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ status: 401, message: '이메일 또는 비밀번호가 잘못되었습니다.', data: null });
  const { nickname, preferred_factor } = user;
  res.status(200).json({ status: 200, message: '로그인 성공', data: { email, nickname, preferred_factor } });
});

app.post('/api/users/logout', (req, res) => {
  res.status(200).json({ status: 200, message: '로그아웃 성공', data: null });
});

app.get('/api/users/mypage', authMiddleware, (req, res) => {
  const { password, ...userInfo } = req.user;
  res.status(200).json({ status: 200, message: '마이페이지 조회 성공', data: userInfo });
});

app.patch('/api/users/mypage', authMiddleware, (req, res) => {
  Object.assign(req.user, req.body);
  saveJson('userData.json', users);
  res.status(200).json({ status: 200, message: '회원정보 수정 완료', data: req.user });
});

app.patch('/api/users/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  if (req.user.password !== current_password)
    return res.status(400).json({ status: 400, message: '현재 비밀번호가 일치하지 않습니다.', data: null });
  req.user.password = new_password;
  saveJson('userData.json', users);
  res.status(200).json({ status: 200, message: '비밀번호 변경 완료', data: null });
});

app.delete('/api/users', authMiddleware, (req, res) => {
  const email = req.user.email;
  users = users.filter(u => u.email !== email);
  bookmarks = bookmarks.filter(b => b.email !== email);
  ratings = ratings.filter(r => r.email !== email);
  saveJson('userData.json', users);
  saveJson('bookmarks.json', bookmarks);
  saveJson('ratingData.json', ratings);
  res.status(200).json({ status: 200, message: '회원 탈퇴 성공', data: null });
});

// ✅ 북마크 API
app.get('/api/bookmarks', authMiddleware, (req, res) => {
  const data = bookmarks.filter(b => b.email === req.user.email).map(b => ({ p_id: b.p_id }));
  res.status(200).json({ status: 200, message: '북마크 조회 성공', data });
});

app.post('/api/bookmarks', authMiddleware, (req, res) => {
  const { p_id } = req.body;
  if (!bookmarks.some(b => b.email === req.user.email && b.p_id === p_id)) {
    bookmarks.push({ email: req.user.email, p_id });
    saveJson('bookmarks.json', bookmarks);
  }
  res.status(201).json({ status: 201, message: '북마크 추가 성공', data: null });
});

app.delete('/api/bookmarks/:p_id', authMiddleware, (req, res) => {
  const p_id = parseInt(req.params.p_id, 10);
  bookmarks = bookmarks.filter(b => !(b.email === req.user.email && b.p_id === p_id));
  saveJson('bookmarks.json', bookmarks);
  res.status(200).json({ status: 200, message: '북마크 삭제 성공', data: null });
});

// ✅ 평점 API
app.get('/api/ratings', authMiddleware, (req, res) => {
  res.status(200).json({ status: 200, message: '평점 조회 성공', data: ratings });
});

app.post('/api/ratings', authMiddleware, (req, res) => {
  const { p_id, score } = req.body;
  if (ratings.some(r => r.email === req.user.email && r.p_id === p_id)) {
    return res.status(409).json({ status: 409, message: '이미 등록된 평점입니다.', data: null });
  }
  const newRating = { rating_id: nextRatingId++, email: req.user.email, p_id, score };
  ratings.push(newRating);
  saveJson('ratingData.json', ratings);
  res.status(201).json({ status: 201, message: '평점 등록 성공', data: newRating });
});

app.patch('/api/ratings', authMiddleware, (req, res) => {
  const { rating_id, rating } = req.body;
  const target = ratings.find(r => r.rating_id === rating_id && r.email === req.user.email);
  if (!target) return res.status(404).json({ status: 404, message: '평점을 찾을 수 없습니다.', data: null });
  target.score = rating;
  saveJson('ratingData.json', ratings);
  res.status(200).json({ status: 200, message: '평점 수정 성공', data: target });
});

app.delete('/api/ratings/:rating_id', authMiddleware, (req, res) => {
  const rating_id = parseInt(req.params.rating_id, 10);
  const index = ratings.findIndex(r => r.rating_id === rating_id && r.email === req.user.email);
  if (index === -1) return res.status(404).json({ status: 404, message: '평점을 찾을 수 없습니다.', data: null });
  ratings.splice(index, 1);
  saveJson('ratingData.json', ratings);
  res.status(200).json({ status: 200, message: '평점 삭제 성공', data: null });
});

// ✅ 주차장 API
app.get('/api/parking-lots', (req, res) => {
  res.status(200).json({ status: 200, message: '주차장 목록 조회 성공', data: parkingData });
});

app.get('/api/parking-lots/search', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const result = parkingData.filter(lot =>
    lot.name.toLowerCase().includes(keyword) ||
    lot.address.toLowerCase().includes(keyword)
  );
  res.status(200).json({ status: 200, message: '주차장 검색 성공', data: result });
});

app.post('/api/parking-lots/recommendations/nearby', authMiddleware, (req, res) => {
  const { latitude, longitude, weekday, hour } = req.body;
  const preferredFactor = req.user?.preferred_factor?.toLowerCase();
  const scoreKey = `ai_recommend_score_${preferredFactor}`;
  console.log(`📍 현재 위치 추천: 위도=${latitude}, 경도=${longitude}, 요일=${weekday}, 시간=${hour}, 요소=${preferredFactor}`);

  const recommended = parkingData.filter(lot =>
    Math.abs(lot.latitude - latitude) < 0.1 && Math.abs(lot.longitude - longitude) < 0.1
  ).map(lot => ({ ...lot, recommendationScore: lot[scoreKey] ?? 0 }));

  res.status(200).json({ status: 200, message: '현재 위치 기반 추천 성공', data: recommended });
});

app.post('/api/parking-lots/recommendations/destination', authMiddleware, (req, res) => {
  const { latitude, longitude, weekday, hour } = req.body;
  const preferredFactor = req.user?.preferred_factor?.toLowerCase();
  const scoreKey = `ai_recommend_score_${preferredFactor}`;
  console.log(`🗺 목적지 추천: 위도=${latitude}, 경도=${longitude}, 요일=${weekday}, 시간=${hour}, 요소=${preferredFactor}`);

  const recommended = parkingData.filter(lot =>
    Math.abs(lot.latitude - latitude) < 0.1 && Math.abs(lot.longitude - longitude) < 0.1
  ).map(lot => ({ ...lot, recommendationScore: lot[scoreKey] ?? 0 }));

  res.status(200).json({ status: 200, message: '목적지 기반 추천 성공', data: recommended });
});

// ✅ 관리자 API
app.get('/admin/api/users', (req, res) => {
  res.status(200).json({ status: 200, message: '사용자 목록 조회 성공', data: users });
});

app.get('/admin/api/users/search', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const result = users.filter(u =>
    u.nickname.toLowerCase().includes(keyword) ||
    u.email.toLowerCase().includes(keyword)
  );
  res.status(200).json({ status: 200, message: '사용자 검색 성공', data: result });
});

app.delete('/admin/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const deletedUser = users.find(u => u.id === id);
  if (deletedUser) {
    users = users.filter(u => u.id !== id);
    bookmarks = bookmarks.filter(b => b.email !== deletedUser.email);
    ratings = ratings.filter(r => r.email !== deletedUser.email);
    saveJson('userData.json', users);
    saveJson('bookmarks.json', bookmarks);
    saveJson('ratingData.json', ratings);
    return res.status(200).json({ status: 200, message: '사용자 삭제 성공', data: null });
  }
  res.status(404).json({ status: 404, message: '사용자를 찾을 수 없습니다.', data: null });
});

app.get('/admin/api/parking-lots', (req, res) => {
  res.status(200).json({ status: 200, message: '주차장 목록 조회 성공', data: parkingData });
});

app.get('/admin/api/parking-lots/search', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const result = parkingData.filter(p =>
    p.name.toLowerCase().includes(keyword) ||
    p.address.toLowerCase().includes(keyword)
  );
  res.status(200).json({ status: 200, message: '주차장 검색 성공', data: result });
});

app.post('/admin/api/parking-lots', (req, res) => {
  const newP = { ...req.body, p_id: Math.max(0, ...parkingData.map(p => p.p_id)) + 1 };
  parkingData.push(newP);
  saveJson('parkingData.json', parkingData);
  res.status(201).json({ status: 201, message: '주차장 등록 성공', data: newP });
});

app.patch('/admin/api/parking-lots', (req, res) => {
  const { p_id, name, address, fee } = req.body;
  const lot = parkingData.find(p => p.p_id === p_id);
  if (!lot) return res.status(404).json({ status: 404, message: '주차장을 찾을 수 없습니다.', data: null });
  if (name) lot.name = name;
  if (address) lot.address = address;
  if (fee != null) lot.fee = fee;
  saveJson('parkingData.json', parkingData);
  res.status(200).json({ status: 200, message: '주차장 수정 성공', data: lot });
});

app.delete('/admin/api/parking-lots/:p_id', (req, res) => {
  const id = parseInt(req.params.p_id, 10);
  parkingData = parkingData.filter(p => p.p_id !== id);
  saveJson('parkingData.json', parkingData);
  res.status(200).json({ status: 200, message: '주차장 삭제 성공', data: null });
});

app.get('/admin/api/ratings/search', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const result = ratings.filter(r => r.email.toLowerCase().includes(keyword));
  res.status(200).json({ status: 200, message: '평점 검색 성공', data: result });
});

app.get('/admin/api/ratings', (req, res) => {
  res.status(200).json({ status: 200, message: '평점 목록 조회 성공', data: ratings });
});

app.delete('/admin/api/ratings/:rating_id', (req, res) => {
  const rating_id = parseInt(req.params.rating_id, 10);
  const index = ratings.findIndex(r => r.rating_id === rating_id);
  if (index === -1) return res.status(404).json({ status: 404, message: '해당 평점을 찾을 수 없습니다.', data: null });
  ratings.splice(index, 1);
  saveJson('ratingData.json', ratings);
  res.status(200).json({ status: 200, message: '평점 삭제 성공', data: null });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT} (${NODE_ENV})`);
});
