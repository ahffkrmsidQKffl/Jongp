import { useEffect, useState } from "react";
import { Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import MyPage from "./pages/MyPage";
import BookmarkList from "./pages/BookmarkList";
import Ratings from "./pages/Ratings";

const Layout = ({ setShowAddressModal, triggerNearbyRecommend, currentPath }) => {
  const showHeader = ["/", "/login", "/signup", "/home", "/mypage", "/bookmarks"].some((p) =>
    currentPath.startsWith(p)
  );
  const showBottomNav = ["/home", "/mypage", "/bookmarks", "/ratings"].some((p) =>
    currentPath.startsWith(p)
  );

  return (
    <>
      {showHeader && <Header />}
      <Outlet />
      {showBottomNav && (
        <BottomNav
          currentPath={currentPath}
          onOpenAddressModal={() => setShowAddressModal(true)}
          onOpenNearbyRecommend={triggerNearbyRecommend}
        />
      )}
    </>
  );
};

function App() {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [triggerNearby, setTriggerNearby] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace("#", "") || "/");
  const navigate = useNavigate();

  const triggerNearbyRecommend = () => {
    setTriggerNearby(true);
  };

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    return () => window.removeEventListener("resize", setViewportHeight);
  }, []);

  // 🚀 경로 변경 후 강제로 다시 상태 업데이트하여 렌더링 보장
  useEffect(() => {
    const onHashChange = () => {
      setCurrentPath(window.location.hash.replace("#", "") || "/");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // 로그인 후 페이지 경로 업데이트
  const handleLoginRedirect = (targetPath) => {
    navigate(targetPath);
    setCurrentPath(targetPath); // 상태를 바로 업데이트하여 하단 네비게이션을 보이게 함
  };

  return (
    <Routes>
      <Route
        element={
          <Layout
            setShowAddressModal={setShowAddressModal}
            triggerNearbyRecommend={triggerNearbyRecommend}
            currentPath={currentPath}
          />
        }
      >
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login onLoginRedirect={handleLoginRedirect} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={
          <Home
            showAddressModal={showAddressModal}
            setShowAddressModal={setShowAddressModal}
            triggerNearby={triggerNearby}
            clearTriggerNearby={() => setTriggerNearby(false)}
          />
        } />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/bookmarks" element={<BookmarkList />} />
        <Route path="/ratings" element={<Ratings />} />
      </Route>
    </Routes>
  );
}

export default App;