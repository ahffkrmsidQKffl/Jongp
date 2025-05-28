import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./RecommendedListPopup.css";

const getColorByScore = (score) => {
  const red    = { r: 206, g:   0, b:  24 };
  const yellow = { r: 250, g: 206, b:   6 };
  const green  = { r:  39, g: 130, b:  74 };
  const s = Math.max(0, Math.min(score, 100));
  const lerp = (start, end, t) => Math.round(start + (end - start) * t);

  let r, g, b;
  if (s <= 50) {
    const t = s / 50;
    r = lerp(red.r, yellow.r, t);
    g = lerp(red.g, yellow.g, t);
    b = lerp(red.b, yellow.b, t);
  } else {
    const t = (s - 50) / 50;
    r = lerp(yellow.r, green.r, t);
    g = lerp(yellow.g, green.g, t);
    b = lerp(yellow.b, green.b, t);
  }

  return `rgb(${r}, ${g}, ${b})`;
};

export default function RecommendedListPopup({
  lots,
  onSelect,
  onClose,
  title,
  userAddress,
  isInitial,
  selectedTime,
}) {
  const { user } = useContext(UserContext);

  const sortedLots = [...lots]
    .map((lot) => ({
      ...lot,
      score: lot.recommendationScore || 0,
      distance: lot.distance != null ? lot.distance : null,
    }))
    .sort((a, b) => b.score - a.score);

  const limitCount = title === "현재 위치 기반 추천" && isInitial ? 1 : 3;
  const limitedLots = sortedLots.slice(0, limitCount);

  return (
    <div className="recommend-popup-overlay">
      <div className="recommend-popup-card">
        <h3 className="recommend-title">{title}</h3>
        {userAddress && <p className="recommend-address">현재 위치는 {userAddress} 입니다.</p>}
        {selectedTime && (
          <p className="recommend-time">
            <strong>추천 기준 시각</strong> {selectedTime}
          </p>
        )}
        <button className="recommend-close-btn" onClick={onClose}>×</button>
        <ul className="recommend-list">
          {limitedLots.map((lot) => {
            const scoreColor = getColorByScore(lot.score);
            return (
              <li
                key={lot.p_id}
                className="recommend-card"
                onClick={() => onSelect(lot)}
              >
                <div className="recommend-card-content">
                  <h4 className="recommend-card-title">{lot.name}</h4>
                    <p>{lot.address}</p>
                    {lot.fee != null && (
                      <p><strong>요금</strong> 기본요금 5분 {lot.fee.toLocaleString()}원<br/>
                      이후 5분당 {lot.fee.toLocaleString()}원</p>)}
                    {lot.distance != null && (
                      <p><strong>거리</strong> {lot.distance.toFixed(1)}km</p>)}
                    {lot.total_spaces != null && lot.current_vehicles != null ? (
                      <p><strong>주차현황</strong> 총 {lot.total_spaces.toLocaleString()}대 중 {lot.current_vehicles.toLocaleString()}대 사용 중</p>
                    ) : (
                      <p><strong>주차현황</strong> 정보 없음</p>)}
                </div>
                <div className="recommend-score-badge large" style={{ backgroundColor: scoreColor }}>
                  {lot.score.toFixed(1)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}