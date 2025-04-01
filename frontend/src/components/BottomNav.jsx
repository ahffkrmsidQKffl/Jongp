import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUser,
  faBookmark,
  faMagnifyingGlass,
  faMapLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./BottomNav.css";

const BottomNav = ({ onOpenAddressModal, onOpenNearbyRecommend }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const handleConnectUser = () => {
    if (!user) navigate("/login");
    else navigate("/mypage");
  };

  const showNav = ["/", "/home", "/mypage", "/map", "/bookmarks"].includes(location.pathname);
  if (!showNav) return null;

  return (
    <nav className="nav-wrapper">
      {/* 첫 번째 아이콘: 현재 위치 기반 추천 */}
      <div onClick={onOpenNearbyRecommend} className="nav-link">
        <FontAwesomeIcon icon={faMapLocationDot} className="nav-item" />
      </div>

      <Link to="/bookmarks" className="nav-link">
        <FontAwesomeIcon icon={faBookmark} className={location.pathname === "/bookmarks" ? "nav-item active-nav-item" : "nav-item"} />
      </Link>
      <Link to="/home" className="nav-link">
        <FontAwesomeIcon icon={faHome} className={location.pathname === "/home" ? "nav-item active-nav-item" : "nav-item"} />
      </Link>

      <div onClick={onOpenAddressModal} className="nav-link">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="nav-item" />
      </div>

      <div onClick={handleConnectUser} className="nav-link">
        <FontAwesomeIcon icon={faUser} className={location.pathname === "/mypage" ? "nav-item active-nav-item" : "nav-item"} />
      </div>
    </nav>
  );
};

export default BottomNav;