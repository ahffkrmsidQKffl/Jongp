import { useEffect, useState } from "react";

const LocationMarker = ({ map, position }) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!map || !position || !window.kakao || !window.kakao.maps) {
      console.warn("⛔ 지도 또는 위치 정보 없음");
      return;
    }

    const markerPosition = new window.kakao.maps.LatLng(position.lat, position.lng);

    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
      map: map,
    });

    setShowMessage(true);
    const timeout = setTimeout(() => setShowMessage(false), 3000);

    return () => {
      clearTimeout(timeout);
      marker.setMap(null); // cleanup
    };
  }, [map, position]);

  return (
    <>
      {showMessage && (
        <div className="location-message">
          환경에 따라 사용자의 현위치 정보는 약간의 오차(10~50m)가 발생할 수 있습니다.
        </div>
      )}
    </>
  );
};

export default LocationMarker;
