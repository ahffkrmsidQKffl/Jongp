import { useState } from "react";
import "./EditRatingModal.css";
import StarDisplay from "./StarDisplay"; // 별 시각화 컴포넌트 import

const EditRatingModal = ({ initialScore, onSave, onCancel }) => {
  const [score, setScore] = useState(initialScore);

  const handlePlus = () => {
    if (score < 5) setScore((prev) => Math.min(5, Math.round((prev + 0.5) * 10) / 10));
  };

  const handleMinus = () => {
    if (score > 0) setScore((prev) => Math.max(0, Math.round((prev - 0.5) * 10) / 10));
  };

  const handleSubmit = () => {
    onSave(score);
  };

  return (
    <div className="edit-rating-overlay">
      <div className="edit-rating-modal">
        <h3>평점 수정</h3>

        {/* 별점 시각화 */}
        <StarDisplay score={score} />

        <div className="edit-score-controls">
          <button className="edit-minus" onClick={handleMinus}>-</button>
          <span className="edit-score">{score.toFixed(1)}점</span>
          <button className="edit-plus" onClick={handlePlus}>+</button>
        </div>

        <div className="edit-rating-buttons">
          <button className="cancel-btn" onClick={onCancel}>취소</button>
          <button className="save-btn" onClick={handleSubmit}>저장</button>
        </div>
      </div>
    </div>
  );
};

export default EditRatingModal;
