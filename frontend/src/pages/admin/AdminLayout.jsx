import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>관리자 페이지</h1>
        <nav>
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
