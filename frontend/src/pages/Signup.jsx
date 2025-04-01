import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import { toast } from "react-toastify";
import "./Signup.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [preferred, setPreferred] = useState("FEE");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await apiRequest("/api/users/register", "POST", {
        email,
        password,
        nickname,
        preferred_factor: preferred
      });

      toast.success("회원가입 성공! 이제 로그인 해보세요.");
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error.message);
      toast.error(error.message || "회원가입 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <label>이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label>비밀번호 확인</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <label>닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <label>선호 요소</label>
        <div className="radio-group">
          {["FEE", "DISTANCE", "RATING", "CONGESTION"].map((factor) => (
            <label key={factor}>
              <input
                type="radio"
                name="preferred"
                value={factor}
                checked={preferred === factor}
                onChange={(e) => setPreferred(e.target.value)}
              />
              {factor === "FEE" ? "요금" :
               factor === "DISTANCE" ? "거리" :
               factor === "RATING" ? "평점" : "혼잡도"}
            </label>
          ))}
        </div>
        <button type="submit">회원가입</button>
      </form>
    </div>
  );
};

export default Signup;