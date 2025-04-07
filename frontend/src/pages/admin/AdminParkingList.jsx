import React, { useEffect, useState } from 'react';
import parkingData from '../../data/parkingData.json';
import './AdminParkingList.css';
import './AdminCommon.css';
import ParkingEditModal from '../../components/admin/ParkingEditModal';

export default function AdminParkingList() {
  const [parkings, setParkings] = useState([]);
  const [modalMode, setModalMode] = useState(null); // 'create' or 'edit'
  const [selectedParking, setSelectedParking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setParkings(parkingData);
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedParking(null);
  };

  const handleOpenEdit = (parking) => {
    setModalMode('edit');
    setSelectedParking(parking);
  };

  const handleSubmit = (newData) => {
    if (modalMode === 'create') {
      const newId = Math.max(...parkings.map(p => p.p_id)) + 1;
      setParkings([...parkings, { ...newData, p_id: newId }]);
    } else if (modalMode === 'edit') {
      setParkings(parkings.map(p => (p.p_id === selectedParking.p_id ? { ...p, ...newData } : p)));
    }
  };

  const handleDelete = (id) => {
    setParkings(prev => prev.filter(p => p.p_id !== id));
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedParking(null);
  };

  const handleRefresh = () => {
    setParkings(parkingData);
    setSearchTerm('');
  };

  const filteredParkings = parkings.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-section">
      <h2>주차장 정보 관리</h2>
      <div className="admin-header-actions">
        <input
          className="admin-search-input"
          type="text"
          placeholder="이름 또는 주소 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="admin-btn" onClick={handleRefresh}>🔄 새로고침</button>
        <button className="admin-btn primary" onClick={handleOpenCreate}>➕ 등록</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>주소</th>
            <th>요금</th>
            <th>평점</th>
            <th>혼잡도</th>
          </tr>
        </thead>
        <tbody>
          {filteredParkings.map((p) => (
            <tr
              key={p.p_id}
              className="clickable-row"
              onClick={() => handleOpenEdit(p)}
            >
              <td>{p.p_id}</td>
              <td>{p.name}</td>
              <td>{p.address}</td>
              <td>{p.fee}원</td>
              <td>{p.avg_rating}</td>
              <td>{p.real_time_congestion}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalMode && (
        <ParkingEditModal
          mode={modalMode}
          data={selectedParking}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
