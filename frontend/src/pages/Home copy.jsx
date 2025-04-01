import { useEffect, useRef, useState } from "react";
import "./Home.css";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

const Home = () => {
  const mapRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [showErrorMessage, setShowErrorMessage] = useState(false); // 오류 메시지 상태 추가

  // 1. 사용자 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setShowErrorMessage(false); // 위치 정보가 성공적으로 받아지면 오류 메시지 숨김
        },
        (err) => {
          console.error("❌ 위치 가져오기 실패:", err);
          setUserPosition({ lat: 37.5665, lng: 126.9780 }); // fallback: 서울시청
          setShowErrorMessage(true); // 오류 발생 시 메시지 표시
          
          // 3초 후에 오류 메시지 사라지도록 설정
          setTimeout(() => {
            setShowErrorMessage(false);
          }, 3000);
        }
      );
    } else {
      console.warn("Geolocation을 지원하지 않습니다.");
      setUserPosition({ lat: 37.5665, lng: 126.9780 }); // fallback
      setShowErrorMessage(true); // 오류 메시지 표시

      // 3초 후에 오류 메시지 사라지도록 설정
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
    }
  }, []);

  // 2. 지도 로딩 (위치 정보가 준비된 이후에만)
  useEffect(() => {
    if (!userPosition) return;

    const scriptId = "kakao-map-sdk";

    const loadMap = () => {
      if (!window.kakao || !window.kakao.maps || !mapRef.current) {
        console.error("❌ Kakao maps not loaded or container missing");
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng),
        level: 3,
      };

      new window.kakao.maps.Map(mapRef.current, options);
      console.log("🟢 Kakao map rendered at current location");
    };

    const waitForReady = () => {
      const startTime = Date.now();
      const maxWait = 5000;

      const checkReady = () => {
        const elapsed = Date.now() - startTime;

        const isReady =
          mapRef.current &&
          window.kakao &&
          window.kakao.maps &&
          typeof window.kakao.maps.LatLng === "function";

        if (isReady) {
          loadMap();
        } else if (elapsed < maxWait) {
          requestAnimationFrame(checkReady);
        } else {
          console.error("❌ Kakao maps or container not available after timeout");
        }
      };

      checkReady();
    };

    // Kakao script 삽입
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://dapi.kakao.com/v2/maps/sdk.js?appkey=76d35304f2cbc0619c0024e8f209970a&autoload=false";
      script.onload = () => {
        console.log("🟢 Kakao script loaded");
        if (window.kakao && typeof window.kakao.maps?.load === "function") {
          window.kakao.maps.load(() => {
            waitForReady();
          });
        }
      };
      document.head.appendChild(script);
    } else {
      if (window.kakao && typeof window.kakao.maps?.load === "function") {
        window.kakao.maps.load(() => {
          waitForReady();
        });
      }
    }
  }, [userPosition]);

  return (
    <div className="home-page">
      {/* 위치 정보 오류 메시지가 표시될 때 화면 어두워지기 */}
      {showErrorMessage && (
        <div className="error-overlay">
          <div className="error-message">
            위치 정보를 찾을 수 없어 서울시청역으로 변경합니다
          </div>
        </div>
      )}

      {/* 지도 */}
      <div
        id="map"
        ref={mapRef}
        style={{ width: "100%", height: "100vh" }}
      />
      <BottomNav />
    </div>
  );
};

export default Home;
