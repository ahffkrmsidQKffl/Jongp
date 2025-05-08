import { createContext, useState, useEffect } from "react";
import { apiRequest } from "../api/api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 환경 구분
  const isDev = process.env.NODE_ENV === "development";

  // 초기 로그인 상태 확인
  useEffect(() => {
    const initializeUser = async () => {
      if (isDev) {
        // 개발 모드: localStorage에서 불러오기
        const saved = localStorage.getItem("user");
        if (saved) setUser(JSON.parse(saved));
      } else {
        // 배포 모드: 서버에 인증된 사용자 요청
        try {
          const res = await apiRequest("/api/users/mypage", "GET");
          setUser(res.data);
        } catch (err) {
          console.warn("로그인 상태 아님 (서버 기준)");
          setUser(null);
        }
      }
    };

    initializeUser();
  }, []);

  // 개발 모드에서만 localStorage 저장
  useEffect(() => {
    if (!isDev) return;
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
