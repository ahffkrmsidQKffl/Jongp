import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import ParkingPopup from "./ParkingPopup";
import { apiRequest } from "../api/api";
import { toast } from "react-toastify";

const ParkingLocationMarker = ({ map }) => {
  const { user } = useContext(UserContext);
  const [parkingData, setParkingData] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);

  // 전체 주차장 목록 로드
  useEffect(() => {
    const fetchParking = async () => {
      try {
        const result = await apiRequest("/api/parking-lots");

        if (!Array.isArray(result.data)) {
          console.error("❌ /api/parking-lots 응답이 배열이 아닙니다:", result.data);
          setParkingData([]);
          return;
        }

        setParkingData(result.data);
      } catch (e) {
        console.error("주차장 데이터 오류:", e.message);
        setParkingData([]);
      }
    };
    fetchParking();
  }, []);

  // Kakao Map에 마커 찍기
  useEffect(() => {
    if (!map || !window.kakao || !Array.isArray(parkingData) || parkingData.length === 0) return;

    parkingData.forEach((parking) => {
      const svg = `
        <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="black" flood-opacity="0.3"/>
            </filter>
          </defs>
          <circle
            cx="15"
            cy="15"
            r="13"
            fill="#3A6EFF"
            stroke="black"
            stroke-width="0.5"
            filter="url(#markerShadow)"
          />
          <text
            x="15"
            y="20"
            font-size="16"
            font-weight="bold"
            text-anchor="middle"
            fill="#fff"
            stroke="black"
            stroke-width="0.5"
            font-family="Arial"
          >
            P
          </text>
        </svg>
      `;

      const markerImage = new window.kakao.maps.MarkerImage(
        "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
        new window.kakao.maps.Size(30, 30),
        { offset: new window.kakao.maps.Point(15, 15) }
      );

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(parking.latitude, parking.longitude),
        image: markerImage,
        map,
        clickable: true,
      });

      // 클릭 시 단일 조회 API 호출
      window.kakao.maps.event.addListener(marker, "click", async () => {
        try {
          const res = await apiRequest(`/api/parking-lots/${parking.p_id}`);
          const detail = res.data;
          // avg_score 필드를 avg_rating으로 매핑
          setSelectedParking({
            ...detail,
            avg_rating: detail.avg_score ?? detail.avg_rating,
          });
        } catch (err) {
          console.error("주차장 상세 조회 실패", err);
          toast.error("주차장 상세 정보를 불러오지 못했습니다.");
        }
      });
    });
  }, [map, parkingData]);

  return (
    <>
      {selectedParking && (
        <ParkingPopup
          parking={selectedParking}
          preferredFactor={user?.preferred_factor}
          onClose={() => setSelectedParking(null)}
        />
      )}
    </>
  );
};

export default ParkingLocationMarker;
