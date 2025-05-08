import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import LocationMarker from "../components/LocationMarker";
import ParkingLocationMarker from "../components/ParkingLocationMarker";
import ParkingPopup from "../components/ParkingPopup";
import RecommendedListPopup from "../components/RecommendedListPopup";
import AddressSearchBar from "../components/AddressSearchBar";
import AddressConfirmModal from "../components/AddressConfirmModal";
import ScoreLegend from "../components/ScoreLegend";
import { apiRequest } from "../api/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { UserContext } from "../context/UserContext";
import "./Home.css";

const Home = ({ triggerNearby, clearTriggerNearby }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const { user } = useContext(UserContext);

  const [userPosition, setUserPosition] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isKakaoMapLoaded, setIsKakaoMapLoaded] = useState(false);
  const [selectedParking, setSelectedParking] = useState(null);
  const [recommendedLots, setRecommendedLots] = useState([]);
  const [recommendTitle, setRecommendTitle] = useState("");
  const [showRecommendedList, setShowRecommendedList] = useState(false);
  const [baseLocation, setBaseLocation] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [locationAllowed, setLocationAllowed] = useState(true);
  const [isInitialNearby, setIsInitialNearby] = useState(false);

  const fetchCurrentAddress = ({ lat, lng }) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address?.address_name || "";
        setCurrentAddress(address);
      }
    });
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAllowed(true);
      },
      () => {
        setLocationAllowed(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!locationAllowed) {
      toast.error("위치 정보 제공에 동의해야 서비스를 이용할 수 있습니다.");
    }
  }, [locationAllowed]);

  useEffect(() => {
    const alreadyRan = sessionStorage.getItem("nearbyRun") === "true";
    if (!alreadyRan && mapInstance && userPosition && locationAllowed) {
      setIsInitialNearby(true);
      handleNearbyRecommend(true);
      sessionStorage.setItem("nearbyRun", "true");
    }
  }, [mapInstance, userPosition, locationAllowed]);

  useEffect(() => {
    if (!userPosition || isKakaoMapLoaded) return;
    const scriptId = "kakao-map-sdk";

    const loadMap = () => {
      const options = {
        center: new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng),
        level: 3,
        maxLevel: 7,
      };
      const map = new window.kakao.maps.Map(mapRef.current, options);
      setMapInstance(map);
      setIsKakaoMapLoaded(true);

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

  useEffect(() => {
    if (triggerNearby && userPosition && mapInstance && locationAllowed) {
      setIsInitialNearby(false);
      handleNearbyRecommend();
      clearTriggerNearby();
    }
  }, [triggerNearby, userPosition, mapInstance, locationAllowed]);

  // ✅ 추가되는 외곽선 그리기용 useEffect
  useEffect(() => {
    if (!mapInstance) return;
  
    fetch("/seoul-outline.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("GeoJSON 파일 로드 실패 (status: " + res.status + ")");
        return res.json();
      })
      .then((geojson) => {
        const geometry = geojson?.geometries?.[0];
        if (!geometry || !geometry.coordinates) {
          console.error("❌ GeoJSON geometry 구조가 이상합니다:", geometry);
          return;
        }
  
        let coordsRaw = null;
        if (geometry.type === "Polygon") {
          coordsRaw = geometry.coordinates?.[0];
        } else if (geometry.type === "MultiPolygon") {
          coordsRaw = geometry.coordinates?.[0]?.[0];
        }
  
        if (!Array.isArray(coordsRaw)) {
          console.error("❌ coordsRaw가 배열이 아닙니다:", coordsRaw);
          return;
        }
  
        const coords = coordsRaw.map(
          ([lng, lat]) => new window.kakao.maps.LatLng(lat, lng)
        );
  
        const polygon = new window.kakao.maps.Polygon({
          path: coords,
          strokeWeight: 5,
          strokeColor: "#0047AB",
          strokeOpacity: 0.9,
          fillColor: "#A2D5F2",
          fillOpacity: 0.0
        });
  
        polygon.setMap(mapInstance);
      })
      .catch((err) => {
        console.error("서울 외곽선 GeoJSON 로드 실패:", err);
      });
  }, [mapInstance]);
  
  

  const handleNearbyRecommend = async (isAuto = false) => {
    if (!userPosition || !mapInstance) return;
    try {
      // 현재 시간 기준 weekday, hour 계산
      const now = new Date();
      const weekday = now.getDay();    // 0(일)~6(토)
      const hour    = now.getHours();  // 0~23

      const result = await apiRequest(
        "/api/parking-lots/recommendations/nearby",
        "POST",
        {
          latitude:  userPosition.lat,
          longitude: userPosition.lng,
          weekday,
          hour
        },
        user.email
      );
      mapInstance.setCenter(new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng));
      mapInstance.setLevel(3);
      setRecommendedLots(result.data);
      setRecommendTitle("현재 위치 기반 추천");
      setBaseLocation(userPosition);
      fetchCurrentAddress(userPosition);
      setShowRecommendedList(true);
      if (!isAuto) sessionStorage.setItem("nearbyRun", "true");
    } catch (err) {
      console.error("현재 위치 추천 실패", err);
    }
  };

  const handleSelectAddress = ({ lat, lng, place }) => {
    if (!mapInstance) return;
    const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
    mapInstance.setCenter(moveLatLng);
    new window.kakao.maps.Marker({ position: moveLatLng, map: mapInstance });
    setConfirmTarget({ lat, lng, place });
  };

  const handleConfirmAddress = async () => {
    try {
      const { lat, lng, place } = confirmTarget;
      // 현재 시간 기준 weekday, hour 계산
      const now = new Date();
      const weekday = now.getDay();    // 0(일)~6(토)
      const hour    = now.getHours();  // 0~23

      const result = await apiRequest(
        "/api/parking-lots/recommendations/destination",
        "POST",
        {
          latitude:  lat,
          longitude: lng,
          weekday,
          hour
        },
        user.email
      );
      setRecommendedLots(result.data);
      setRecommendTitle(`"${place.place_name}" 근처 추천`);
      setShowRecommendedList(true);
      setBaseLocation({ lat, lng });
      setConfirmTarget(null);
    } catch (err) {
      console.error("추천 실패", err);
    }
  };

  if (!locationAllowed) {
    return (
      <div className="location-denied-message">
        <div className="location-icon">
          <FontAwesomeIcon icon={faLocationCrosshairs} />
        </div>
        <h2>위치 권한이 필요해요</h2>
        <p>
          스마트 파킹 서비스를 이용하려면<br />
          위치 정보 제공에 동의해주세요.
        </p>
        <button
          onClick={() => {
            sessionStorage.removeItem("nearbyRun"); // 초기 추천 초기화
            navigate("/login"); // 로그인 페이지로 이동
          }}
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div id="map" ref={mapRef} style={{ width: "100%", height: "100vh" }} />

      {mapInstance && userPosition && <LocationMarker map={mapInstance} position={userPosition} />}
      {mapInstance && <ParkingLocationMarker map={mapInstance} setSelectedParking={setSelectedParking} />}
      {selectedParking && <ParkingPopup parking={selectedParking} onClose={() => setSelectedParking(null)} />}

      <AddressSearchBar onSelect={handleSelectAddress} />

      {confirmTarget && (
        <AddressConfirmModal
          place={confirmTarget.place}
          onConfirm={handleConfirmAddress}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {showRecommendedList && (
        <>
        <RecommendedListPopup
          title={recommendTitle}
          lots={recommendedLots}
          baseLocation={baseLocation}
          userAddress={recommendTitle === "현재 위치 기반 추천" ? currentAddress : null}
          isInitial={isInitialNearby}
          onSelect={(lot) => {
            const moveLatLng = new window.kakao.maps.LatLng(lot.latitude, lot.longitude);
            mapInstance.setCenter(moveLatLng);
            setSelectedParking(lot);
            setShowRecommendedList(false);
          }}
          onClose={() => setShowRecommendedList(false)}
        />
        <ScoreLegend />
        </>
      )}



      <button
        className="nearby-fab"
        onClick={() => {
          setIsInitialNearby(false);
          handleNearbyRecommend(false);
        }}
        title="주변 추천"
      >
        <FontAwesomeIcon icon={faLocationCrosshairs} />
      </button>
    </div>
  );
};

export default Home;