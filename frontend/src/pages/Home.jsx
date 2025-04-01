import { useEffect, useState, useRef } from "react";
import LocationMarker from "../components/LocationMarker";
import ParkingLocationMarker from "../components/ParkingLocationMarker";
import BottomNav from "../components/BottomNav";
import ParkingPopup from "../components/ParkingPopup";
import AddressSearchModal from "../components/AddressSearchModal";
import RecommendedListPopup from "../components/RecommendedListPopup";
import { apiRequest } from "../api/api";
import "./Home.css";

const Home = () => {
  const mapRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isKakaoMapLoaded, setIsKakaoMapLoaded] = useState(false);
  const [selectedParking, setSelectedParking] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [recommendedLots, setRecommendedLots] = useState([]);
  const [recommendTitle, setRecommendTitle] = useState("");
  const [showRecommendedList, setShowRecommendedList] = useState(false);
  const [baseLocation, setBaseLocation] = useState(null);


  // 사용자 위치 받아오기
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPosition({ lat: 37.5665, lng: 126.978 }) // fallback: 서울시청
    );
  }, []);

  // Kakao Map 로딩
  useEffect(() => {
    if (!userPosition || isKakaoMapLoaded) return;

    const scriptId = "kakao-map-sdk";

    const loadMap = () => {
      const options = {
        center: new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng),
        level: 3,
      };
      const map = new window.kakao.maps.Map(mapRef.current, options);
      setMapInstance(map);
      setIsKakaoMapLoaded(true);

      // sessionStorage에 저장된 북마크 대상이 있다면 지도 이동 + 팝업 표시
      const stored = sessionStorage.getItem("targetParking");
      if (stored) {
        const parking = JSON.parse(stored);
        const moveLatLng = new window.kakao.maps.LatLng(parking.latitude, parking.longitude);
        map.setCenter(moveLatLng);
        setSelectedParking(parking);
        sessionStorage.removeItem("targetParking");
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://dapi.kakao.com/v2/maps/sdk.js?appkey=76d35304f2cbc0619c0024e8f209970a&libraries=services&autoload=false";
      script.onload = () => window.kakao.maps.load(loadMap);
      document.head.appendChild(script);
    } else {
      window.kakao.maps.load(loadMap);
    }
  }, [userPosition, isKakaoMapLoaded]);

  // 목적지 주소 선택 시
  const handleSelectAddress = async ({ lat, lng, place }) => {
    try {
      const result = await apiRequest("/api/parking-lots/recommendations/destination", "POST", {
        lat,
        lng,
      });
      setRecommendedLots(result);
      setRecommendTitle(`"${place.place_name}" 근처 추천`);
      setShowRecommendedList(true);
      setBaseLocation({ lat, lng });
    } catch (err) {
      console.error("목적지 추천 실패", err);
    }
  };

  // 현재 위치 기반 추천
  const handleNearbyRecommend = async () => {
    if (!userPosition) return;
    try {
      const result = await apiRequest("/api/parking-lots/recommendations/nearby", "POST", userPosition);
      setRecommendedLots(result);
      setRecommendTitle("현재 위치 기반 추천");
      setBaseLocation(userPosition); 
      setShowRecommendedList(true);
    } catch (err) {
      console.error("현재 위치 추천 실패", err);
    }
  };

  return (
    <div className="home-page">
      <div id="map" ref={mapRef} style={{ width: "100%", height: "100vh" }} />

      {mapInstance && userPosition && (
        <LocationMarker map={mapInstance} position={userPosition} />
      )}

      {mapInstance && (
        <ParkingLocationMarker map={mapInstance} setSelectedParking={setSelectedParking} />
      )}

      {selectedParking && (
        <ParkingPopup parking={selectedParking} onClose={() => setSelectedParking(null)} />
      )}

      {showAddressModal && (
        <AddressSearchModal
          onClose={() => setShowAddressModal(false)}
          onSelect={handleSelectAddress}
        />
      )}

      {showRecommendedList && (
        <RecommendedListPopup
          title={recommendTitle}
          lots={recommendedLots}
          baseLocation={baseLocation} // 현재 위치 or 검색 위치
          onSelect={(lot) => {
            const moveLatLng = new window.kakao.maps.LatLng(lot.latitude, lot.longitude);
            mapInstance.setCenter(moveLatLng);
            setSelectedParking(lot);
            setShowRecommendedList(false);
          }}
          onClose={() => setShowRecommendedList(false)}
        />
      )}

      <BottomNav
        onOpenAddressModal={() => setShowAddressModal(true)}
        onOpenNearbyRecommend={handleNearbyRecommend}
      />
    </div>
  );
};

export default Home;