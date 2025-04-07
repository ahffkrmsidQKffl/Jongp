// AdminRatingList.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ratingData from '../../data/ratingData.json';
import './AdminRatingList.css';
import './AdminCommon.css';

export default function AdminRatingList() {
  const location = useLocation();
  const presetSearch = location.state?.presetSearch || '';
  const [ratings, setRatings] = useState([]);
  const [searchTerm, setSearchTerm] = useState(presetSearch);

  useEffect(() => {
    setRatings(ratingData);
  }, []);

  const handleDelete = (id) => {
    setRatings(ratings.filter(r => r.rating_id !== id));
  };

  const handleRefresh = () => {
    setRatings(ratingData);
    setSearchTerm('');
    window.history.replaceState({}, '', '/admin/ratings');
  };

  const filteredRatings = ratings.filter(r => {
    return (
      r.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.parking_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
        <button className="admin-btn" onClick={handleRefresh}>🔄 새로고침</button>
      </div>
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
                <button className="admin-btn danger" onClick={() => handleDelete(r.rating_id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}