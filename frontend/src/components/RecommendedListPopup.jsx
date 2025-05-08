import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./RecommendedListPopup.css";

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

const RecommendedListPopup = ({
  lots,
  onSelect,
  onClose,
  title,
  baseLocation,
  userAddress,
  isInitial,
}) => {
  const { user } = useContext(UserContext);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const x = dLng * Math.cos(toRad((lat1 + lat2) / 2));
    const y = dLat;
    const distance = Math.sqrt(x * x + y * y) * R;
    return Math.round(distance);
  };

  const sortedLots = [...lots]
    .map((lot) => {
      const score = lot.recommendationScore || 0;
      const distance = baseLocation
        ? getDistance(
            baseLocation.lat,
            baseLocation.lng,
            lot.latitude,
            lot.longitude
          )
        : null;
      return { ...lot, score, distance };
    })
    .sort((a, b) => b.score - a.score);

  const limitCount = title === "현재 위치 기반 추천" && isInitial ? 1 : 3;
  const limitedLots = sortedLots.slice(0, limitCount);

  return (
    <div className="recommend-popup-overlay">
      <div className="recommend-popup-card">
        <h3 className="recommend-title">{title}</h3>
        {userAddress && (
          <p className="recommend-address">
            현재 위치는 <strong>{userAddress}</strong> 입니다.
          </p>
        )}
        <button className="recommend-close-btn" onClick={onClose}>
          ×
        </button>
        <ul className="recommend-list">
          {limitedLots.map((lot) => {
            const scoreColor = getColorByScore(lot.score);
            return (
              <li
                key={lot.p_id}
                className="recommend-card"
                onClick={() => onSelect(lot)}
              >
                <div className="recommend-card-header">
                  <h4>{lot.name}</h4>
                  <div
                    className="recommend-score-badge large"
                    style={{ backgroundColor: scoreColor }}
                  >
                    {lot.score}
                  </div>
                </div>
                <p>{lot.address}</p>
                {lot.fee != null && <p>요금: {lot.fee.toLocaleString()}원</p>}
                {lot.distance != null && (
                  <p>거리: {lot.distance.toLocaleString()}m</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default RecommendedListPopup;
