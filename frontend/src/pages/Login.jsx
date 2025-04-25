import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../api/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";
import logoImg from "../assets/logo.png"; // 로고 이미지 경로

export default function Login({ onLoginRedirect }) {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    const cookieEmail = document.cookie
      .split("; ")
      .find((row) => row.startsWith("email="))?.split("=")[1];
    if (cookieEmail) {
      setEmail(cookieEmail);
      setAutoLogin(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const data = await apiRequest("/api/users/login", "POST", {
        email,
        password,
      });

      setUser({
        email,
        nickname: data.nickname,
        preferred_factor: data.preferred_factor,
      });

      if (autoLogin) {
        document.cookie = `email=${email}; max-age=604800; path=/`;
      } else {
        document.cookie = `email=; max-age=0; path=/`;
      }

      toast.success("로그인 성공!");

      if (email === "admin" && password === "admin") {
        onLoginRedirect("/admin/users");
      } else {
        onLoginRedirect("/home");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      toast.error(error.message || "로그인 실패");
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logoImg} alt="로고" />
        <h1>스마트 파킹</h1>
        <p>AI 기반 실시간 주차 추천 서비스</p>
      </div>

      <div className="login-right">
        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <h2>로그인</h2>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
          />
          <label>
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
            />
            자동 로그인
          </label>
          <button onClick={handleLogin}>로그인</button>
          <div className="signup-link">
            <Link to="/signup">회원가입</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
