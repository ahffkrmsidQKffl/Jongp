import React, { useState, useEffect } from 'react';
import './ParkingEditModal.css';
import './AdminCommon.css';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/api';
import AddressSearchModal from './AddressSearchModal';

export default function ParkingEditModal({ mode = 'create', data = {}, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    fee: '',
    avg_rating: '',
    real_time_congestion: '',
    latitude: null,
    longitude: null
  });
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        name: data.name || '',
        address: data.address || '',
        fee: data.fee || '',
        avg_rating: data.avg_rating || '',
        real_time_congestion: data.real_time_congestion || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null
      });
    }
  }, [mode, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSelectAddress = ({ address, latitude, longitude }) => {
    setForm({ ...form, address, latitude, longitude });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || form.latitude == null || form.longitude == null) {
      alert('이름, 주소는 필수 입력 항목입니다.');
      return;
    }
  
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        fee: Number(form.fee),
        latitude: form.latitude,
        longitude: form.longitude
      };
  
      if (mode === 'create') {
        const newItem = await apiRequest('/admin/api/parking-lots', 'POST', payload);
        onSubmit(newItem);
      } else {
        const updated = await apiRequest('/admin/api/parking-lots', 'PATCH', {
          p_id: data.p_id,
          ...payload
        });
        onSubmit(updated);
      }
  
      onClose();
    } catch (err) {
      console.error('주차장 저장 실패', err);
      alert('주차장 정보를 저장하는 도중 오류가 발생했습니다.');
    }
  };

  const handleViewRatings = () => {
    navigate('/admin/ratings', { state: { presetSearch: form.name } });
    onClose();
  };

  const handleDeleteClick = async () => {
    if (window.confirm(`정말 "${form.name}" 주차장을 삭제하시겠습니까?`)) {
      await apiRequest(`/admin/api/parking-lots/${data.p_id}`, 'DELETE');
      onDelete(data.p_id);
      onClose();
    }
  };

  return (
    <>
      <AddressSearchModal
        visible={addressModalVisible}
        onSelect={handleSelectAddress}
        onClose={() => setAddressModalVisible(false)}
      />
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>{mode === 'edit' ? '주차장 수정' : '주차장 등록'}</h3>
          <label>
            이름
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>
            주소
            <div className="address-field">
              <input name="address" value={form.address} disabled />
              <button className="admin-btn" onClick={() => setAddressModalVisible(true)}>
                주소 검색
              </button>
            </div>
          </label>
          <label>
            요금
            <input name="fee" type="number" value={form.fee} onChange={handleChange} />
          </label>
          <label>
            평점
            <input name="avg_rating" type="number" value={form.avg_rating} disabled />
          </label>
          <label>
            혼잡도
            <input name="real_time_congestion" type="number" value={form.real_time_congestion} disabled />
          </label>

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
                <button className="admin-btn danger" onClick={handleDeleteClick}>삭제</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
