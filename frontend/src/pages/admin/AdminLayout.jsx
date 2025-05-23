import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiRequest } from '../../api/api';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiRequest('/api/users/logout', 'POST');
      sessionStorage.clear();
      document.cookie = 'email=; max-age=0; path=/';
      toast.info('로그아웃 되었습니다.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        {/* ① 상단: 제목 + 로그아웃 */}
        <div className="admin-header-top">
          <h1>관리자 페이지</h1>
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
        {/* ② 하단: 메뉴 */}
        <nav className="admin-nav">
          <Link to="users">회원 관리</Link>
          <Link to="parkings">주차장 관리</Link>
          <Link to="ratings">평점 관리</Link>
        </nav>
      </header>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
