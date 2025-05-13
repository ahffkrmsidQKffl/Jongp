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
      const [rawRatingsRes, usersRes, lotsRes] = await Promise.all([
        apiRequest("/admin/api/ratings"),
        apiRequest("/admin/api/users"),
        apiRequest("/admin/api/parking-lots")
      ]);
  
      const rawRatings = rawRatingsRes.data;
      const users = usersRes.data;
      const parkingLots = lotsRes.data;
  
      // 필요한 필드 매핑
      const enriched = rawRatings.map((r) => {
        // r.user_name, r.p_name, r.rating_id, r.score, r.created_at
        const user = users.find((u) => u.email === r.user_name);
        const lot = parkingLots.find((p) => p.name === r.p_name);
        return {
          rating_id: r.rating_id,
          user_name: r.user_name,
          parking_name: r.p_name,
          score: r.score,
          rated_at: r.created_at,
          user_nickname: user?.nickname || r.user_name,
          parking_id: lot?.p_id || null
        };
      });
  
      setRatings(enriched);
    } catch (err) {
      console.error("데이터 로드 실패", err);
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

  // 검색: user_nickname 또는 parking_name
  const filteredRatings = ratings.filter((r) => {
    const nick = (r.user_nickname || '').toLowerCase();
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
                <td>{r.user_nickname}</td>
                <td>{r.parking_name}</td>
                <td>{r.score.toFixed(1)}</td>
                <td>{r.rated_at.split('T')[0]}</td>
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