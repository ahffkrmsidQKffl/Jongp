import { http, HttpResponse } from 'msw';
import parkingData from '../data/parkingData.json';

const users = [
  {
    id: 1,
    email: "asd@asd.com",
    password: "5678",
    nickname: "테스트",
    preferred_factor: "DISTANCE"
  }
];

let currentUserEmail = null;
let bookmarks = []; // [{ email, p_id }]
let ratings = [];   // [{ rating_id, email, p_id, score }]
let nextRatingId = 1;

export const handlers = [
  // 회원가입
  http.post('/api/users/register', async ({ request }) => {
    const { email, password, nickname, preferred_factor } = await request.json();
    if (users.some(u => u.email === email)) {
      return HttpResponse.json({ message: '이미 존재하는 이메일입니다.' }, { status: 409 });
    }
    const newUser = { id: users.length + 1, email, password, nickname, preferred_factor };
    users.push(newUser);
    return HttpResponse.json({ user: newUser }, { status: 201 });
  }),

  // 로그인
  http.post('/api/users/login', async ({ request }) => {
    const { email, password } = await request.json();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return HttpResponse.json({ message: '이메일 또는 비밀번호 오류' }, { status: 401 });
    currentUserEmail = user.email;
    const { password: _, ...userInfo } = user;
    return HttpResponse.json(userInfo);
  }),

  // 로그아웃
  http.post('/api/users/logout', () => {
    currentUserEmail = null;
    return HttpResponse.json({ message: '로그아웃 성공' });
  }),

  // 마이페이지 조회
  http.get('/api/users/mypage', () => {
    const user = users.find(u => u.email === currentUserEmail);
    if (!user) return HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const { password, ...userInfo } = user;
    return HttpResponse.json(userInfo);
  }),

  // 마이페이지 수정
  http.patch('/api/users/mypage', async ({ request }) => {
    const user = users.find(u => u.email === currentUserEmail);
    if (!user) return HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const body = await request.json();
    if (body.nickname) user.nickname = body.nickname;
    if (body.preferred_factor) user.preferred_factor = body.preferred_factor;
    return HttpResponse.json(user);
  }),

  // 비밀번호 변경
  http.patch('/api/users/password', async ({ request }) => {
    const user = users.find(u => u.email === currentUserEmail);
    if (!user) return HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const { current_password, new_password } = await request.json();
    if (user.password !== current_password) {
      return HttpResponse.json({ message: '현재 비밀번호가 일치하지 않습니다.' }, { status: 400 });
    }
    user.password = new_password;
    return HttpResponse.json({ message: '비밀번호 변경 완료' });
  }),

  // 주차장 목록
  http.get('/api/parking-lots', () => HttpResponse.json(parkingData)),

  // 검색
  http.get('/api/parking-lots/search', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword")?.toLowerCase() || "";
    const result = parkingData.filter(lot => lot.name.toLowerCase().includes(keyword));
    return HttpResponse.json(result);
  }),

  // 북마크 조회
  http.get('/api/bookmarks', () => {
    if (!currentUserEmail) return HttpResponse.json([], { status: 200 });
    const userBookmarks = bookmarks
      .filter(b => b.email === currentUserEmail)
      .map(b => ({ p_id: b.p_id }));
    return HttpResponse.json(userBookmarks);
  }),

  // 북마크 추가
  http.post('/api/bookmarks', async ({ request }) => {
    const { p_id } = await request.json();
    if (!currentUserEmail) return HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const exists = bookmarks.some(b => b.email === currentUserEmail && b.p_id === p_id);
    if (!exists) bookmarks.push({ email: currentUserEmail, p_id });
    return HttpResponse.json({ message: '북마크 추가됨' }, { status: 201 });
  }),

  // 북마크 삭제
  http.delete('/api/bookmarks/:p_id', ({ params }) => {
    const targetId = parseInt(params.p_id);
    bookmarks = bookmarks.filter(b => !(b.email === currentUserEmail && b.p_id === targetId));
    return HttpResponse.json({ message: '북마크 삭제됨' });
  }),

  // 평점 조회
  http.get('/api/ratings', () => HttpResponse.json(ratings)),

  // 평점 등록
  http.post('/api/ratings', async ({ request }) => {
    if (!currentUserEmail) return HttpResponse.json({ message: '로그인 필요' }, { status: 401 });
    const { p_id, score } = await request.json();
    const exists = ratings.find(r => r.email === currentUserEmail && r.p_id === p_id);
    if (exists) {
      return HttpResponse.json({ message: '이미 등록된 평점이 있습니다.' }, { status: 409 });
    }
    const newRating = {
      rating_id: nextRatingId++,
      email: currentUserEmail,
      p_id,
      score,
    };
    ratings.push(newRating);
    return HttpResponse.json({ message: '평점 등록 완료', rating: newRating }, { status: 201 });
  }),

  // 평점 수정
  http.patch('/api/ratings', async ({ request }) => {
    if (!currentUserEmail) return HttpResponse.json({ message: '로그인 필요' }, { status: 401 });
    const { rating_id, score } = await request.json();
    const rating = ratings.find(r => r.rating_id === rating_id && r.email === currentUserEmail);
    if (!rating) {
      return HttpResponse.json({ message: '해당 평점을 찾을 수 없습니다.' }, { status: 404 });
    }
    rating.score = score;
    return HttpResponse.json({ message: '평점 수정 완료', rating });
  }),

  // 목적지 기반 추천 (POST)
  http.post('/api/parking-lots/recommendations/destination', async ({ request }) => {
    const { lat, lng } = await request.json();

    const getDistance = (a, b) => {
      const R = 6371e3;
      const toRad = deg => deg * Math.PI / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const x = dLng * Math.cos(toRad((a.lat + b.lat) / 2));
      const y = dLat;
      return Math.sqrt(x * x + y * y) * R;
    };

    const nearby = parkingData
      .map(lot => ({
        ...lot,
        distance: getDistance(
          { lat, lng },
          { lat: parseFloat(lot.latitude), lng: parseFloat(lot.longitude) }
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    return HttpResponse.json(nearby, { status: 200 });
  }),

  // 현재 위치 기반 추천 (POST)
  http.post("/api/parking-lots/recommendations/nearby", async ({ request }) => {
    const { lat, lng } = await request.json();
    const filtered = parkingData.filter(
      lot =>
        Math.abs(lot.latitude - lat) < 0.1 &&
        Math.abs(lot.longitude - lng) < 0.1
    );
    return HttpResponse.json(filtered, { status: 200 });
  }),
];
