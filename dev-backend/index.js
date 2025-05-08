const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ⭐ NODE_ENV 기본값 설정
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log('🌎 현재 NODE_ENV:', NODE_ENV);

// ⭐ PORT 설정
const PORT = NODE_ENV === 'development' ? 5000 : (process.env.PORT || 60015);
console.log('✅ 현재 포트번호:', PORT);

// ⭐ distPath 최상단에 선언
const distPath = path.join(__dirname, '../frontend/dist');
console.log('✅ 강제 출력 distPath:', distPath);

// dist 폴더 존재 확인
if (!fs.existsSync(distPath)) {
  console.error('❌ dist 폴더가 존재하지 않습니다!!');
} else {
  console.log('✅ dist 폴더가 정상적으로 존재합니다.');
}

// ⭐ 데이터 로딩
const loadJson = (filename) => {
  try {
    const raw = fs.readFileSync(`./data/${filename}`, 'utf-8');
    return JSON.parse(raw);
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
let nextRatingId = ratings.length ? Math.max(...ratings.map(r => r.rating_id)) + 1 : 1;
let parkingData = loadJson('parkingData.json');

app.use(cors());
app.use(express.json());

// ⭐ 요청마다 URL 출력 (디버깅용)
app.use((req, res, next) => {
  console.log('➡️ 요청 URL:', req.url);
  next();
});

// ⭐ 사용자 인증 미들웨어
const authMiddleware = (req, res, next) => {
  const email = req.headers['x-user-email'];
  req.user = email ? users.find(u => u.email === email) : null;
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  next();
};

// ⭐ 배포모드일 때 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  console.log('📦 (진입성공) 정적 파일 서빙 준비 시작');
  const indexPath = path.join(distPath, 'index.html');
  console.log('✅ dist/index.html 존재:', fs.existsSync(indexPath));

  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    console.log('📄 index.html 반환!');
    res.sendFile(indexPath);
  });
}

// ========== API 시작 ==========

// 회원가입 (인증 없음)
app.post('/api/users/register', (req, res) => {
  const newUser = req.body;
  if (users.find(u => u.email === newUser.email)) {
    return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
  }
  const newId = users.length ? users[users.length - 1].id + 1 : 1;
  const joined_at = new Date().toISOString().split('T')[0];
  const user = { ...newUser, id: newId, joined_at };
  users.push(user);
  saveJson('userData.json', users);
  res.status(201).json(user);
});

// 로그인 (인증 없음)
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
  res.status(200).json({
    message: '로그인 성공',
    nickname: user.nickname,
    preferred_factor: user.preferred_factor,
    email: user.email,
  });
});

// 로그아웃 (인증 없음)
app.post('/api/users/logout', (req, res) => {
  res.status(200).json({ message: '로그아웃 성공' });
});

// 회원 탈퇴 (인증 필요)
app.delete('/api/users', authMiddleware, (req, res) => {
  const email = req.user.email;
  users = users.filter(u => u.email !== email);
  bookmarks = bookmarks.filter(b => b.email !== email);
  ratings = ratings.filter(r => r.email !== email);
  saveJson('userData.json', users);
  saveJson('bookmarks.json', bookmarks);
  saveJson('ratingData.json', ratings);
  res.status(200).json({ message: '회원 탈퇴 성공' });
});

// 마이페이지 (인증 필요)
app.get('/api/users/mypage', authMiddleware, (req, res) => {
  const { password, ...userInfo } = req.user;
  res.status(200).json(userInfo);
});

app.patch('/api/users/mypage', authMiddleware, (req, res) => {
  const { nickname, preferred_factor } = req.body;
  if (nickname) req.user.nickname = nickname;
  if (preferred_factor) req.user.preferred_factor = preferred_factor;
  saveJson('userData.json', users);
  res.status(200).json(req.user);
});

app.patch('/api/users/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  if (req.user.password !== current_password)
    return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
  req.user.password = new_password;
  saveJson('userData.json', users);
  res.status(200).json({ message: '비밀번호 변경 완료' });
});

// 북마크 (인증 필요)
app.get('/api/bookmarks', authMiddleware, (req, res) => {
  const userBookmarks = bookmarks.filter(b => b.email === req.user.email).map(b => ({ p_id: b.p_id }));
  res.json(userBookmarks);
});

app.post('/api/bookmarks', authMiddleware, (req, res) => {
  const { p_id } = req.body;
  const exists = bookmarks.some(b => b.email === req.user.email && b.p_id === p_id);
  if (!exists) {
    bookmarks.push({ email: req.user.email, p_id });
    saveJson('bookmarks.json', bookmarks);
  }
  res.status(201).json({ message: '북마크 추가됨' });
});

app.delete('/api/bookmarks/:p_id', authMiddleware, (req, res) => {
  const targetId = parseInt(req.params.p_id);
  bookmarks = bookmarks.filter(b => !(b.email === req.user.email && b.p_id === targetId));
  saveJson('bookmarks.json', bookmarks);
  res.status(200).json({ message: '북마크 삭제됨' });
});

// 주차장 검색 (공개)
app.get('/api/parking-lots/search', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const result = parkingData.filter(lot =>
    lot.name.toLowerCase().includes(keyword) ||
    lot.address.toLowerCase().includes(keyword)
  );
  res.status(200).json(result);
});

// 평점 조회 (인증 필요)
app.get('/api/ratings', authMiddleware, (req, res) => {
  res.status(200).json(ratings);
});

// 평점 등록 (인증 필요)
app.post('/api/ratings', authMiddleware, (req, res) => {
  const { p_id, score } = req.body;
  const exists = ratings.find(r => r.email === req.user.email && r.p_id === p_id);
  if (exists) return res.status(409).json({ message: '이미 등록된 평점이 있습니다.' });
  const newRating = { rating_id: nextRatingId++, email: req.user.email, p_id, score };
  ratings.push(newRating);
  saveJson('ratingData.json', ratings);
  res.status(201).json(newRating);
});

// 평점 수정 (인증 필요)
app.patch('/api/ratings', authMiddleware, (req, res) => {
  const { rating_id, rating } = req.body;
  const target = ratings.find(r => r.rating_id === rating_id && r.email === req.user.email);
  if (!target) return res.status(404).json({ message: '해당 평점을 찾을 수 없습니다.' });
  target.score = rating;
  saveJson('ratingData.json', ratings);
  res.status(200).json(target);
});

// 평점 삭제 (인증 필요)
app.delete('/api/ratings/:rating_id', authMiddleware, (req, res) => {
  const ratingId = parseInt(req.params.rating_id, 10);
  const index = ratings.findIndex(r => r.rating_id === ratingId && r.email === req.user.email);
  if (index === -1) return res.status(404).json({ message: '해당 평점을 찾을 수 없습니다.' });
  ratings.splice(index, 1);
  saveJson('ratingData.json', ratings);
  res.status(200).json({ message: '평점 삭제 완료' });
});

// 추천 (인증 필요)
app.post('/api/parking-lots/recommendations/nearby', authMiddleware, (req, res) => {
  const { latitude, longitude, weekday, hour } = req.body;
  const preferredFactor = req.user?.preferred_factor?.toLowerCase();
  const scoreKey = `ai_recommend_score_${preferredFactor}`;

  console.log(`📍 현재 위치 추천: 위도=${latitude}, 경도=${longitude}, 요일=${weekday}, 시간=${hour}, 요소=${preferredFactor}`);

  const recommended = parkingData
    .filter(lot =>
      Math.abs(lot.latitude - latitude) < 0.1 &&
      Math.abs(lot.longitude - longitude) < 0.1
    )
    .map(lot => ({
      ...lot,
      recommendationScore: lot[scoreKey] ?? 0
    }));

  res.status(200).json(recommended);
});

app.post('/api/parking-lots/recommendations/destination', authMiddleware, (req, res) => {
  const { latitude, longitude, weekday, hour } = req.body;
  const preferredFactor = req.user?.preferred_factor?.toLowerCase();
  const scoreKey = `ai_recommend_score_${preferredFactor}`;

  console.log(`🗺 목적지 추천: 위도=${latitude}, 경도=${longitude}, 요일=${weekday}, 시간=${hour}, 요소=${preferredFactor}`);

  const recommended = parkingData
    .filter(lot =>
      Math.abs(lot.latitude - latitude) < 0.1 &&
      Math.abs(lot.longitude - longitude) < 0.1
    )
    .map(lot => ({
      ...lot,
      recommendationScore: lot[scoreKey] ?? 0
    }));

  res.status(200).json(recommended);
});

// 주차장 리스트 (공개)
app.get('/api/parking-lots', (req, res) => {
  res.status(200).json(parkingData);
});

// ========== 관리자용 API 시작 ==========

// 사용자 목록 조회 (인증 생략)
app.get('/admin/api/users', (req, res) => {
  res.status(200).json(users);
});

// 사용자 검색
app.get('/admin/api/users/search', (req, res) => {
  const kw = (req.query.keyword || '').toLowerCase();
  const result = users.filter(u =>
    u.nickname.toLowerCase().includes(kw) ||
    u.email.toLowerCase().includes(kw)
  );
  res.status(200).json(result);
});

// 사용자 삭제
app.delete('/admin/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  users = users.filter(u => u.id !== id);
  bookmarks = bookmarks.filter(b => b.email !== users.find(u=>u.id===id)?.email);
  ratings = ratings.filter(r => r.email !== users.find(u=>u.id===id)?.email);
  saveJson('userData.json', users);
  saveJson('bookmarks.json', bookmarks);
  saveJson('ratingData.json', ratings);
  res.status(200).json({ message: '관리자: 사용자 삭제 완료' });
});

// 주차장 목록 조회
app.get('/admin/api/parking-lots', (req, res) => {
  res.status(200).json(parkingData);
});

// 주차장 검색
app.get('/admin/api/parking-lots/search', (req, res) => {
  const kw = (req.query.keyword || '').toLowerCase();
  const result = parkingData.filter(p =>
    p.name.toLowerCase().includes(kw) ||
    p.address.toLowerCase().includes(kw)
  );
  res.status(200).json(result);
});

// 주차장 등록
app.post('/admin/api/parking-lots', (req, res) => {
  const newP = { ...req.body, p_id: Math.max(...parkingData.map(p=>p.p_id)) + 1 };
  parkingData.push(newP);
  saveJson('parkingData.json', parkingData);
  res.status(201).json(newP);
});

// 주차장 수정
app.patch('/admin/api/parking-lots', (req, res) => {
  const { p_id, name, address, fee } = req.body;
  const p = parkingData.find(p=>p.p_id===p_id);
  if (!p) return res.status(404).json({ message: '주차장을 찾을 수 없습니다.' });
  if (name) p.name = name;
  if (address) p.address = address;
  if (fee != null) p.fee = fee;
  saveJson('parkingData.json', parkingData);
  res.status(200).json(p);
});

// 주차장 삭제
app.delete('/admin/api/parking-lots/:p_id', (req, res) => {
  const id = parseInt(req.params.p_id, 10);
  parkingData = parkingData.filter(p => p.p_id !== id);
  saveJson('parkingData.json', parkingData);
  res.status(200).json({ message: '관리자: 주차장 삭제 완료' });
});

// 평점 검색 (관리자)
app.get('/admin/api/ratings/search', (req, res) => {
  const kw = (req.query.keyword || '').toLowerCase();
  const result = ratings.filter(r =>
    r.email.toLowerCase().includes(kw)
  );
  res.status(200).json(result);
});

// 평점 목록 조회 (관리자용)
app.get('/admin/api/ratings', (req, res) => {
  res.status(200).json(ratings);
});

// 평점 삭제 (관리자용)
app.delete('/admin/api/ratings/:rating_id', (req, res) => {
  const ratingId = parseInt(req.params.rating_id, 10);
  const index = ratings.findIndex(r => r.rating_id === ratingId);
  if (index === -1) {
    return res.status(404).json({ message: '평점을 찾을 수 없습니다.' });
  }
  ratings.splice(index, 1);
  saveJson('ratingData.json', ratings);
  res.status(200).json({ message: '관리자: 평점 삭제 완료' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
});
