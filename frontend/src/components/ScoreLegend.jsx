import React from "react";
import "./ScoreLegend.css";

const getColorByScore = (score) => {
  // RGB 값 정의
  const red    = { r: 206, g:   0, b:  24 }; // #CE0018
  const yellow = { r: 250, g: 206, b:   6 }; // #FACE06
  const green  = { r:  39, g: 130, b:  74 }; // #27824A

  // 0~100 clamp
  const s = Math.max(0, Math.min(score, 100));

  // 보간 함수
  const lerp = (start, end, t) => 
    Math.round(start + (end - start) * t);

  let r, g, b;

  if (s <= 50) {
    // 0~50 → t: 0.0 ~ 1.0
    const t = s / 50;
    r = lerp(red.r, yellow.r, t);
    g = lerp(red.g, yellow.g, t);
    b = lerp(red.b, yellow.b, t);
  } else {
    // 50~100 → t: 0.0 ~ 1.0
    const t = (s - 50) / 50;
    r = lerp(yellow.r, green.r, t);
    g = lerp(yellow.g, green.g, t);
    b = lerp(yellow.b, green.b, t);
  }

  return `rgb(${r}, ${g}, ${b})`;
};


const ScoreLegend = () => {
  const steps = 10;
  const scores = Array.from({ length: steps + 1 }, (_, i) => i * 10);

  return (
    <div className="score-legend-vertical">
        <div className="score-legend-vertical-labels">
            <span>100</span>
            <span>50</span>
            <span>0</span>
        </div>
        <div className="score-legend-vertical-bar">
            {scores.map((s) => (
            <div
                key={s}
                className="score-legend-vertical-segment"
                style={{ backgroundColor: getColorByScore(s) }}
            ></div>
            ))}
        </div>
    </div>
  );
};

console.log("ScoreLegend 렌더링 됨");

export default ScoreLegend;