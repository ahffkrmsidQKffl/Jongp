import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import LoadingOverlay from "../components/LoadingOverlay";
import "./Home.css";

const Home = ({ triggerNearby, clearTriggerNearby }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [isLoadingRecommend, setIsLoadingRecommend] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  const fetchCurrentAddress = ({ lat, lng }) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address?.address_name || "";
        setCurrentAddress(address);
      }
    });
  };

  // 추천 리스트 병합 helper
  const fetchMergedLots = async (basicLots) => {
    const merged = await Promise.all(
      basicLots.map(async (lot) => {
        try {
          const res = await apiRequest(`/api/parking-lots/${lot.p_id}`);
          return {
            ...lot,
            total_spaces: res.data.total_spaces,
            current_vehicles: res.data.current_vehicles,
          };
        } catch (err) {
          console.error("주차장 상세 조회 실패", lot.p_id, err);
          return lot;
        }
      })
    );
    return merged;
  };

  // 추천 리스트에서 하나 클릭했을 때 상세조회 + 팝업 열기
  const handleRecommendSelect = async (lot) => {
    try {
      const res = await apiRequest(`/api/parking-lots/${lot.p_id}`);
      const detail = res.data;
      // 지도 센터링
      const moveLatLng = new window.kakao.maps.LatLng(detail.latitude, detail.longitude);
      mapInstance.setCenter(moveLatLng);
      // 팝업 열기 (실시간 현황까지 담긴 detail)
      setSelectedParking({
        ...detail,
        avg_rating: detail.avg_score ?? detail.avg_rating,
      });
      // 추천 리스트 닫기
      setShowRecommendedList(false);
    } catch (err) {
      console.error("추천 주차장 상세 조회 실패", err);
      toast.error("추천 주차장 상세 정보를 불러오지 못했습니다.");
    }
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

  // 서울시 외곽선 그리기
  useEffect(() => {
    if (!mapInstance) return;
    fetch("/seoul-outline.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("GeoJSON 파일 로드 실패");
        return res.json();
      })
      .then((geojson) => {
        const geometry = geojson?.geometries?.[0];
        let coordsRaw = [];
        if (geometry.type === "Polygon") {
          coordsRaw = geometry.coordinates[0];
        } else if (geometry.type === "MultiPolygon") {
          coordsRaw = geometry.coordinates[0][0];
        }
        const coords = coordsRaw.map(([lng, lat]) => new window.kakao.maps.LatLng(lat, lng));
        new window.kakao.maps.Polygon({
          path: coords,
          strokeWeight: 5,
          strokeColor: "#0047AB",
          strokeOpacity: 0.9,
          fillColor: "#A2D5F2",
          fillOpacity: 0,
        }).setMap(mapInstance);
      })
      .catch((err) => {
        console.error("서울 외곽선 로드 실패", err);
      });
  }, [mapInstance]);

  // URL state 로직 (다른 페이지에서 targetParkingId 로 이동)
  useEffect(() => {
    const targetId = location.state?.targetParkingId;
    if (targetId != null && mapInstance) {
      apiRequest(`/api/parking-lots/${targetId}`)
        .then((res) => {
          const detail = res.data;
          const moveLatLng = new window.kakao.maps.LatLng(detail.latitude, detail.longitude);
          mapInstance.setCenter(moveLatLng);
          setSelectedParking(detail);
          navigate(location.pathname, { replace: true, state: {} });
        })
        .catch((err) => {
          console.error("주차장 상세 조회 실패", err);
          toast.error("목표 주차장 정보를 불러오지 못했습니다.");
        });
    }
  }, [location.state, mapInstance, navigate, location.pathname]);

  const handleNearbyRecommend = async (isAuto = false) => {
  if (!userPosition || !mapInstance) return;

  // 1) 지금 시각 HH:MM 계산해서 상태에 저장
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  setSelectedTime(`${hh}:${mm}`);

  setIsLoadingRecommend(true);
  try {
    // 2) 요일·시간 뽑을 때도 같은 now 사용
    const weekday = now.getDay();
    const hour = now.getHours();
    const result = await apiRequest(
      "/api/parking-lots/recommendations/nearby",
      "POST",
      { latitude: userPosition.lat, longitude: userPosition.lng, weekday, hour },
      user.email
    );

    mapInstance.setCenter(new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng));
    mapInstance.setLevel(3);

    // 기본 추천 리스트 → 상세 현황 병합
    const mergedLots = await fetchMergedLots(result.data);

    setRecommendedLots(mergedLots);
    setRecommendTitle("현재 위치 기반 추천");
    setBaseLocation(userPosition);
    fetchCurrentAddress(userPosition);
    setShowRecommendedList(true);
    if (!isAuto) sessionStorage.setItem("nearbyRun", "true");
  } catch (err) {
    console.error("현재 위치 추천 실패", err);
  } finally {
    setIsLoadingRecommend(false);
  }
};

  const handleSelectAddress = ({ lat, lng, place }) => {
    if (!mapInstance) return;
    const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
    mapInstance.setCenter(moveLatLng);
    new window.kakao.maps.Marker({ position: moveLatLng, map: mapInstance });
    setConfirmTarget({ lat, lng, place });
  };

  const handleConfirmAddress = async (selectedTime) => {
    setSelectedTime(selectedTime);
    setIsLoadingRecommend(true);
    try {
      const { lat, lng, place } = confirmTarget;
      const now = new Date();
      const weekday = now.getDay();
      const hour = typeof selectedTime === "string"
        ? Number(selectedTime.split(":")[0])
        : now.getHours();
      const result = await apiRequest(
        "/api/parking-lots/recommendations/destination",
        "POST",
        { latitude: lat, longitude: lng, weekday, hour },
        user.email
      );

      // 병합
      const basicLots = result.data;
      const mergedLots = await fetchMergedLots(basicLots);

      setRecommendedLots(mergedLots);
      setRecommendTitle(`"${place.place_name}" 근처 추천`);
      setBaseLocation({ lat, lng });
      setShowRecommendedList(true);
      setConfirmTarget(null);
    } catch (err) {
      console.error("추천 실패", err);
    } finally {
      setIsLoadingRecommend(false);
    }
  };

  if (!locationAllowed) {
    return (
      <div className="location-denied-message">
        <FontAwesomeIcon icon={faLocationCrosshairs} size="3x" />
        <h2>위치 권한이 필요해요</h2>
        <p>서비스 이용을 위해 위치 정보 제공에 동의해주세요.</p>
        <button
          onClick={() => {
            sessionStorage.removeItem("nearbyRun");
            navigate("/login");
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <>
      {isLoadingRecommend && <LoadingOverlay />}
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
              onSelect={handleRecommendSelect}
              onClose={() => setShowRecommendedList(false)}
              selectedTime={selectedTime}
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
    </>
  );
};

export default Home;