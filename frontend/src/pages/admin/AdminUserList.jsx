import React, { useEffect, useState } from 'react';
import './AdminUserList.css';
import './AdminCommon.css';
import UserDetailModal from '../../components/admin/UserDetailModal';
import userData from '../../data/userData.json';

export default function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setUsers(userData);
  }, []);

  const handleDelete = (id) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const handleRefresh = () => {
    setUsers(userData);
    setSearchTerm('');
  };

  const filteredUsers = users.filter(user =>
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {filteredUsers.map((user) => (
            <tr
              key={user.id}
              className="clickable-row"
              onClick={() => setSelectedUser(user)}
            >
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.nickname}</td>
              <td>{user.joined_at}</td>
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
