import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/api';
import { useLocation } from 'react-router-dom';
import './AdminRatingList.css';
import './AdminCommon.css';

export default function AdminRatingList() {
  const location = useLocation();
  const presetSearch = location.state?.presetSearch || '';
  const [ratings, setRatings] = useState([]);
  const [searchTerm, setSearchTerm] = useState(presetSearch);
  const [loading, setLoading] = useState(false);

  // 전체 평점 + 사용자/주차장 정보 불러오기
  const fetchRatings = async () => {
    setLoading(true);
    try {
      // 평점, 사용자, 주차장 데이터를 동시에 가져옴
      const [rawRatings, users, lots] = await Promise.all([
        apiRequest('/admin/api/ratings', 'GET'),
        apiRequest('/admin/api/users', 'GET'),
        apiRequest('/admin/api/parking-lots', 'GET'),
      ]);

      // 사용자 닉네임, 주차장 이름, 등록일 병합
      const enriched = rawRatings.map((r) => {
        const user = users.find((u) => u.email === r.email);
        const lot  = lots.find((p) => p.p_id === r.p_id);
        return {
          ...r,
          nickname:     user?.nickname     || '',
          parking_name: lot?.name         || '',
          rated_at:     r.createdAt       || '',  // 백엔드에서 createdAt 필드를 보내줄 경우
        };
      });

      setRatings(enriched);
    } catch (err) {
      console.error('평점 목록 조회 실패', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(`정말 평점 #${id} 를 삭제하시겠습니까?`)) return;
    try {
      await apiRequest(`/admin/api/ratings/${id}`, 'DELETE');
      setRatings((prev) => prev.filter((r) => r.rating_id !== id));
    } catch (err) {
      console.error('평점 삭제 실패', err);
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    window.history.replaceState({}, '', '/admin/ratings');
    fetchRatings();
  };

  // 안전하게 toLowerCase 호출
  const filteredRatings = ratings.filter((r) => {
    const nick = (r.nickname     || '').toLowerCase();
    const park = (r.parking_name || '').toLowerCase();
    const kw   = searchTerm.toLowerCase();
    return nick.includes(kw) || park.includes(kw);
  });

  return (
    <div className="admin-section">
      <h2>평점 관리</h2>

      <div className="admin-header-actions">
        <input
          className="admin-search-input"
          type="text"
          placeholder="사용자 또는 주차장명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="admin-btn" onClick={handleRefresh}>
          🔄 새로고침
        </button>
      </div>

      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>사용자</th>
              <th>주차장</th>
              <th>점수</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredRatings.map((r) => (
              <tr key={r.rating_id}>
                <td>{r.rating_id}</td>
                <td>{r.nickname}</td>
                <td>{r.parking_name}</td>
                <td>{r.score}</td>
                <td>{r.rated_at}</td>
                <td>
                  <button
                    className="admin-btn danger"
                    onClick={() => handleDelete(r.rating_id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
