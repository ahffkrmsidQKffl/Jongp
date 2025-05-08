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
    try {
      const [rawRatingsRes, usersRes, lotsRes] = await Promise.all([
        apiRequest("/admin/api/ratings"),
        apiRequest("/admin/api/users"),
        apiRequest("/admin/api/parking-lots")
      ]);
  
      const rawRatings = rawRatingsRes.data;
      const users = usersRes.data;
      const parkingLots = lotsRes.data;
  
      const enriched = rawRatings.map((r) => {
        const user = users.find((u) => u.email === r.email);
        const lot = parkingLots.find((p) => p.p_id === r.p_id);
        return {
          ...r,
          user_nickname: user?.nickname || "알 수 없음",
          parking_name: lot?.name || "알 수 없음"
        };
      });
  
      setRatings(enriched);
    } catch (err) {
      console.error("데이터 로드 실패", err);
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
