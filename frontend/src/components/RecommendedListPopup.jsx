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

const RecommendedListPopup = ({ lots, onSelect, onClose, title, baseLocation }) => {
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const x = dLng * Math.cos(toRad((lat1 + lat2) / 2));
    const y = dLat;
    const distance = Math.sqrt(x * x + y * y) * R;
    return Math.round(distance);
  };

  const sortedLots = [...lots]
    .map(lot => {
      const factor = "ai_recommend_score_" + (lot.preferred_factor?.toLowerCase() || "distance");
      const score = lot[factor] || 0;
      const distance = baseLocation
        ? getDistance(baseLocation.lat, baseLocation.lng, lot.latitude, lot.longitude)
        : null;
      return { ...lot, score, distance };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="recommend-popup-overlay">
      <div className="recommend-popup-card">
        <h3 className="recommend-title">{title}</h3>
        <button className="recommend-close-btn" onClick={onClose}>×</button>
        <ul className="recommend-list">
          {sortedLots.map((lot) => {
            const scoreColor = getColorByScore(lot.score);
            return (
              <li key={lot.p_id} className="recommend-card" onClick={() => onSelect(lot)}>
                <h4>{lot.name}</h4>
                <p>{lot.address}</p>
                <p>요금: {lot.fee.toLocaleString()}원</p>
                <p>AI 추천 점수: <span style={{ color: scoreColor }}>{lot.score}</span></p>
                {lot.distance != null && <p>거리: {lot.distance.toLocaleString()}m</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default RecommendedListPopup;
