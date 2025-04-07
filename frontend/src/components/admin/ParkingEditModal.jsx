import React, { useState, useEffect } from 'react';
import './ParkingEditModal.css';
import './AdminCommon.css';
import { useNavigate } from 'react-router-dom';

export default function ParkingEditModal({ mode = 'create', data = {}, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    fee: '',
    avg_rating: '',
    real_time_congestion: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        name: data.name || '',
        address: data.address || '',
        fee: data.fee || '',
        avg_rating: data.avg_rating || '',
        real_time_congestion: data.real_time_congestion || '',
      });
    }
  }, [mode, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    onSubmit(form);
    onClose();
  };

  const handleViewRatings = () => {
    navigate('/admin/ratings', { state: { presetSearch: form.name } });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`정말 "${form.name}" 주차장을 삭제하시겠습니까?`)) {
      onDelete(data.p_id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'edit' ? '주차장 수정' : '주차장 등록'}</h3>
        <label>이름<input name="name" value={form.name} onChange={handleChange} /></label>
        <label>주소<input name="address" value={form.address} onChange={handleChange} /></label>
        <label>요금<input name="fee" type="number" value={form.fee} onChange={handleChange} /></label>
        <label>평점<input name="avg_rating" type="number" step="0.1" value={form.avg_rating} onChange={handleChange} /></label>
        <label>혼잡도<input name="real_time_congestion" type="number" value={form.real_time_congestion} onChange={handleChange} /></label>

        <div className="modal-footer">
          <div className="modal-left">
            <button className="admin-btn" onClick={onClose}>닫기</button>
          </div>
          <div className="modal-center">
            <button className="admin-btn primary" onClick={handleSubmit}>
              {mode === 'edit' ? '수정' : '등록'}
            </button>
            {mode === 'edit' && (
              <button className="admin-btn" onClick={handleViewRatings}>평점 전체 보기</button>
            )}
          </div>
          <div className="modal-right">
            {mode === 'edit' && (
              <button className="admin-btn danger" onClick={handleDelete}>삭제</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
