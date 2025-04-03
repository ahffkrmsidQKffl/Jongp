import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import ParkingPopup from "./ParkingPopup";
import { apiRequest } from "../api/api";

const ParkingLocationMarker = ({ map }) => {
  const { user } = useContext(UserContext);
  const [parkingData, setParkingData] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);

  const getColorByScore = (score) => {
    let red, green, blue = 0;
    if (score <= 50) {
      red = 255;
      green = Math.round(score * 5.1);
    } else {
      red = Math.round((100 - score) * 5.1);
      green = 255;
    }
    return `rgb(${red}, ${green}, ${blue})`;
  };

  useEffect(() => {
    const fetchParking = async () => {
      try {
        const data = await apiRequest("/api/parking-lots");
        setParkingData(data);
      } catch (e) {
        console.error("주차장 데이터 오류:", e.message);
      }
    };
    fetchParking();
  }, []);

  useEffect(() => {
    if (!map || !window.kakao || !user?.preferred_factor || parkingData.length === 0) return;

    parkingData.forEach((parking) => {
      const key = `ai_recommend_score_${user.preferred_factor.toLowerCase()}`;
      const score = parking[key] || 0;
      const color = getColorByScore(score);

      const svg = `
        <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="black" flood-opacity="0.3"/>
            </filter>
          </defs>
          <circle cx="15" cy="15" r="13" fill="${color}" stroke="black" stroke-width="0.5" filter="url(#markerShadow)" />
          <text x="15" y="20"
                font-size="16"
                font-weight="bold"
                text-anchor="middle"
                fill="#fff"
                stroke="black"
                stroke-width="0.5"
                font-family="Arial">
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

      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedParking(parking);
      });
    });
  }, [map, user?.preferred_factor, parkingData]);

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
