import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import { toast } from "react-toastify";
import "./MyPage.css";

const MyPage = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [preferred, setPreferred] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await apiRequest("/api/users/mypage");
        setNickname(res.nickname);
        setPreferred(res.preferred_factor);
        setUser(res);
      } catch (err) {
        toast.error("로그인이 필요합니다.");
        navigate("/login");
      }
    };
    fetchUserInfo();
  }, []);

  const handleProfileUpdate = async () => {
    try {
      await apiRequest("/api/users/mypage", "PATCH", {
        nickname,
        preferred_factor: preferred,
      });

      toast.success("정보가 수정되었습니다.");
      setUser((prev) => ({
        ...prev,
        nickname,
        preferred_factor: preferred,
      }));
    } catch (error) {
      toast.error(error.message || "수정 실패");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await apiRequest("/api/users/password", "PATCH", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("비밀번호가 수정되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordChangeVisible(false);
    } catch (error) {
      toast.error(error.message || "비밀번호 수정 실패");
    }
  };

  return (
    <div className="mypage-container">
      <h1 className="mypage-title">마이페이지</h1>
      <form className="mypage-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label>이메일</label>
          <input type="text" value={user?.email || ""} disabled />
        </div>
        <div className="form-group">
          <label>닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>선호 요소</label>
          <select value={preferred} onChange={(e) => setPreferred(e.target.value)}>
            <option value="FEE">요금</option>
            <option value="DISTANCE">거리</option>
            <option value="RATING">평점</option>
            <option value="CONGESTION">혼잡도</option>
          </select>
        </div>

        <div className="section">
          <h3 className="section-title">내 활동</h3>
          <button
            type="button"
            className="mypage-button activity"
            onClick={() => navigate("/ratings")}
          >
            내가 준 평점 관리
          </button>
        </div>


        <button
          type="button"
          className="mypage-button main"
          onClick={handleProfileUpdate}
        >
          정보 수정
        </button>

        <button
          type="button"
          className="mypage-button toggle"
          onClick={() => setIsPasswordChangeVisible(!isPasswordChangeVisible)}
        >
          {isPasswordChangeVisible ? "비밀번호 변경 취소" : "비밀번호 변경하기"}
        </button>

        {isPasswordChangeVisible && (
          <div className="password-section">
            <div className="form-group">
              <label>현재 비밀번호</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="mypage-button"
              onClick={handlePasswordChange}
            >
              비밀번호 수정하기
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default MyPage;