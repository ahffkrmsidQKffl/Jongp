import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faUser, faBookmark } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./BottomNav.css";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const currentPath = location.pathname;

  const handleConnectUser = () => {
    if (!user) navigate("/login");
    else navigate("/mypage");
  };

  return (
    <nav className="nav-wrapper">
      <Link to="/bookmarks" className="nav-link">
        <FontAwesomeIcon
          icon={faBookmark}
          className={
            currentPath === "/bookmarks"
              ? "nav-item active-nav-item"
              : "nav-item"
          }
        />
      </Link>

      <Link to="/home" className="nav-link">
        <FontAwesomeIcon
          icon={faHome}
          className={
            currentPath === "/home"
              ? "nav-item active-nav-item"
              : "nav-item"
          }
        />
      </Link>

      <div onClick={handleConnectUser} className="nav-link">
        <FontAwesomeIcon
          icon={faUser}
          className={
            currentPath === "/mypage"
              ? "nav-item active-nav-item"
              : "nav-item"
          }
        />
      </div>
    </nav>
  );
};

export default BottomNav;
