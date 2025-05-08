import React, { useEffect, useState } from 'react';
import './AdminUserList.css';
import './AdminCommon.css';
import UserDetailModal from '../../components/admin/UserDetailModal';
import { apiRequest } from '../../api/api';
import useKakaoLoader from '../../components/common/KakaoLoader'; // ✅ 추가

export default function AdminUserList() {
  const sdkLoaded = useKakaoLoader(); // ✅ 공통 훅 사용
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sdkLoaded) fetchUsers();
  }, [sdkLoaded]);

  useEffect(() => {
    if (!sdkLoaded) return;
    if (searchTerm.trim()) fetchSearch(searchTerm);
    else fetchUsers();
  }, [searchTerm, sdkLoaded]);

  const fetchUsers = async () => {
    try {
      const res = await apiRequest('/admin/api/users', 'GET');
      setUsers(res.data);
    } catch (err) {
      console.error('사용자 목록 조회 실패', err);
    }
  };
  
  const fetchSearch = async (keyword) => {
    try {
      const encoded = encodeURIComponent(keyword);
      const res = await apiRequest(`/admin/api/users/search?keyword=${encoded}`, 'GET');
      setUsers(res.data);
    } catch (err) {
      console.error('사용자 검색 실패', err);
    }
  };

  const handleDelete = (id) => {
    setUsers((prev) => prev.filter((u) => u.user_id !== id));
  };

  const handleRefresh = () => {
    setSearchTerm('');
    fetchUsers();
  };

  if (!sdkLoaded) return <p>카카오맵 SDK 로딩 중...</p>; // ✅ 로딩 대기 처리

  return (
    <div className="admin-section">
      <h2>회원 정보 관리</h2>
      <div className="admin-header-actions">
        <input
          className="admin-search-input"
          type="text"
          placeholder="닉네임 또는 이메일 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="admin-btn" onClick={handleRefresh}>🔄 새로고침</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>이메일</th>
            <th>닉네임</th>
            <th>가입일</th>
            <th>선호 요소</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.user_id}
              className="clickable-row"
              onClick={() => setSelectedUser(user)}
            >
              <td>{user.user_id}</td>
              <td>{user.email}</td>
              <td>{user.nickname}</td>
              <td>{user.created_at?.split('T')[0] || ''}</td>
              <td>{user.preferred_factor}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
