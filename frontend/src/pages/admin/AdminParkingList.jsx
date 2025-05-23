import React, { useEffect, useState } from 'react';
import './AdminParkingList.css';
import './AdminCommon.css';
import ParkingEditModal from '../../components/admin/ParkingEditModal';
import { apiRequest } from '../../api/api';
import useKakaoLoader from '../../components/common/KakaoLoader';

export default function AdminParkingList() {
  const sdkLoaded = useKakaoLoader();
  const [parkings, setParkings] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [selectedParking, setSelectedParking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sdkLoaded) fetchParkings();
  }, [sdkLoaded]);

  useEffect(() => {
    if (!sdkLoaded) return;
    if (searchTerm.trim()) fetchSearch(searchTerm);
    else fetchParkings();
  }, [searchTerm, sdkLoaded]);

  const fetchParkings = async () => {
    try {
      const res = await apiRequest('/admin/api/parking-lots', 'GET');
      setParkings(res.data);
    } catch (err) {
      console.error('주차장 목록 조회 실패', err);
    }
  };

  const fetchSearch = async (keyword) => {
    try {
      const encoded = encodeURIComponent(keyword);
      const res = await apiRequest(`/admin/api/parking-lots/search?keyword=${encoded}`, 'GET');
      setParkings(res.data);
    } catch (err) {
      console.error('주차장 검색 실패', err);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedParking(null);
  };
  const handleOpenEdit = (p) => {
    setModalMode('edit');
    setSelectedParking(p);
  };
  const handleSubmit = () => fetchParkings();
  const handleDelete = async (id) => {
    await apiRequest(`/admin/api/parking-lots/${id}`, 'DELETE');
    fetchParkings();
  };
  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedParking(null);
  };
  const handleRefresh = () => {
    setSearchTerm('');
    fetchParkings();
  };

  const filteredParkings = parkings.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!sdkLoaded) return <p>카카오맵 SDK 로딩 중...</p>;

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
            <th>ID</th><th>이름</th><th>주소</th><th>요금</th><th>평점</th>
          </tr>
        </thead>
        <tbody>
          {filteredParkings.map((p) => (
            <tr key={p.p_id} className="clickable-row" onClick={() => handleOpenEdit(p)}>
              <td>{p.p_id}</td>
              <td>{p.name}</td>
              <td>{p.address}</td>
              <td>5분당 {p.fee.toLocaleString()}원</td>
              <td>{p.avg_rating}</td>
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