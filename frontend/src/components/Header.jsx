import { faAngleLeft, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiRequest } from "../api/api";  // apiRequest 추가
import "./Header.css";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const isAuthPage = ["/", "/login", "/signup"].includes(path);

  const getCookie = (name) => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return cookie ? cookie.split("=")[1] : null;
  };

  const userId = sessionStorage.getItem("email") || getCookie("email");

  const goBack = () => navigate(-1);

  const handleLogout = async () => {
    try {
      // 백엔드 로그아웃 API 호출
      await apiRequest("/api/users/logout", "POST");

      // 클라이언트 측 세션/쿠키 정리
      document.cookie = "email=; max-age=0; path=/";
      sessionStorage.removeItem("email");
      sessionStorage.clear();

      toast.info("로그아웃 되었습니다.");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <header className="header">
      <div className="back">
        <FontAwesomeIcon icon={faAngleLeft} className="back-icon" onClick={goBack} />
      </div>

      <h1 className="title">SmartParking</h1>

      {/* 우측 아이콘: 로그인 이후에만 표시 */}
      {isAuthPage ? (
        <div className="link" style={{ width: "24px" }}></div>
      ) : (
        <div className="link" onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} className="logout-icon" />
        </div>
      )}
    </header>
  );
};

export default Header;
