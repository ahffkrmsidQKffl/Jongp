import React from "react";
import "./ScoreLegend.css";

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