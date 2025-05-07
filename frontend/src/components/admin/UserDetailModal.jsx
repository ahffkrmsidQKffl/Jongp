import React, { useEffect, useState } from 'react';
import './UserDetailModal.css';
import './AdminCommon.css';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/api';

export default function UserDetailModal({ user, onClose, onDelete }) {
  const [ratings, setRatings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRatings = async () => {
      if (!user) return;
      try {
        const keyword = encodeURIComponent(user.nickname);
        const data = await apiRequest(
          `/admin/api/ratings/search?keyword=${keyword}`,
          'GET'
        );
        setRatings(data);
      } catch (err) {
        console.error('평점 조회 실패', err);
      }
    };
    fetchRatings();
  }, [user]);

  const handleViewRatings = () => {
    navigate('/admin/ratings', { state: { presetSearch: user.nickname } });
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm(`정말 "${user.nickname}" 회원을 삭제하시겠습니까?`)) {
      await onDelete(user.user_id);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>회원 상세 정보</h3>
        <p><strong>ID:</strong> {user.user_id}</p>
        <p><strong>이메일:</strong> {user.email}</p>
        <p><strong>닉네임:</strong> {user.nickname}</p>
        <p><strong>가입일:</strong> {user.created_at?.split('T')[0] || ''}</p>
        <p><strong>선호 요소:</strong> {user.preferred_factor}</p>

        <div className="rating-list">
          <h4>평점 내역</h4>
          <ul>
            {ratings.map((r) => (
              <li key={r.rating_id}>
                {r.p_name} - {r.score}점 ({r.created_at?.split('T')[0]})
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-footer">
          <button className="admin-btn" onClick={onClose}>닫기</button>
          <button className="admin-btn primary" onClick={handleViewRatings}>평점 전체 보기</button>
          <button className="admin-btn danger" onClick={handleDelete}>삭제</button>
        </div>
      </div>
    </div>
  );
}
