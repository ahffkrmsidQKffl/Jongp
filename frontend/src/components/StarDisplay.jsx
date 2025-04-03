import "./StarDisplay.css";

const StarDisplay = ({ score, color = "gold" }) => {
    const stars = [];
  
    for (let i = 0; i < 5; i++) {
      const fillPercent = Math.max(0, Math.min(1, score - i));
      stars.push(
        <div className="star-wrapper" key={i}>
          <div className="star-background">★</div>
          <div
            className="star-fill"
            style={{
              width: `${fillPercent * 100}%`,
              color: color
            }}
          >
            ★
          </div>
        </div>
      );
    }
  
    return <div className="star-display">{stars}</div>;
  };
  

export default StarDisplay;
