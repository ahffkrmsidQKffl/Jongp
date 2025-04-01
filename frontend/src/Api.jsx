/*
import React, { useEffect, useState } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // ✅ API 호출 및 디버깅 로직
  useEffect(() => {
    console.log('[App] ⚡ API 요청 시작');
    
    fetch('/api/greeting')
      .then(response => {
        console.log('[App] ➔ 응답 수신:', response.status);
        if (!response.ok) throw new Error(`${response.status} 에러`);
        return response.json();
      })
      .then(data => {
        console.log('[App] ✅ 데이터 수신:', data);
        setData(data);
      })
      .catch(error => {
        console.error('[App] ❌ 오류 발생:', error);
        setError(error.message);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>MSW 작동 테스트</h1>
      {error ? (
        <p style={{ color: 'red' }}>오류: {error}</p>
      ) : data ? (
        <div>
          <p>{data.message}</p>
          <small>서버 시간: {new Date(data.timestamp).toLocaleString()}</small>
        </div>
      ) : (
        <p>데이터 로드 중...</p>
      )}
      <button 
        onClick={() => window.location.reload()}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        새로고침 테스트
      </button>
    </div>
  );
}
  */