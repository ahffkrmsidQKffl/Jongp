import React, { useEffect, useState } from 'react';
import './UserDetailModal.css';
import './AdminCommon.css';
import ratingData from '../../data/ratingData.json';
import { useNavigate } from 'react-router-dom';

export default function UserDetailModal({ user, onClose, onDelete }) {
  const [ratings, setRatings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const userRatings = ratingData.filter((r) => r.user_id === user.id);
      setRatings(userRatings);
    }
  }, [user]);

  const handleViewRatings = () => {
    navigate('/admin/ratings', { state: { presetSearch: user.nickname } });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`정말 "${user.nickname}" 회원을 삭제하시겠습니까?`)) {
      onDelete(user.id);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>회원 상세 정보</h3>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>이메일:</strong> {user.email}</p>
        <p><strong>닉네임:</strong> {user.nickname}</p>
        <p><strong>가입일:</strong> {user.joined_at}</p>
        <p><strong>선호 요소:</strong> {user.preferred_factor}</p>

        <div className="modal-footer">
          <button className="admin-btn" onClick={onClose}>닫기</button>
          <button className="admin-btn primary" onClick={handleViewRatings}>평점 전체 보기</button>
          <button className="admin-btn danger" onClick={handleDelete}>삭제</button>
        </div>
      </div>
    </div>
  );
}
