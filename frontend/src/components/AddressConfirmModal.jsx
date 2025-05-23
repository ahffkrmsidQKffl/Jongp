import { useState } from "react";
import "./AddressConfirmModal.css";

const AddressConfirmModal = ({ place, onConfirm, onCancel }) => {
  // timeMode: 'current' or 'custom'
  const [timeMode, setTimeMode] = useState("current");
  // customTime: HH:MM (10분 단위)
  const now = new Date();
  const padded = (num) => String(num).padStart(2, "0");
  const defaultTime = `${padded(now.getHours())}:${padded(now.getMinutes())}`;
  const [customTime, setCustomTime] = useState(defaultTime);

  const handleConfirm = () => {
    // timeMode에 따라 HH:MM 전체 문자열을 넘깁니다
    const selectedTime =
      timeMode === "custom"
        ? customTime
        : defaultTime;
    onConfirm(selectedTime);
  };

  return (
    <div className="address-confirm-modal">
      <div className="confirm-modal-content">
        <p className="confirm-modal-title">선택한 주소가 맞나요?</p>
        <h4>{place.address_name}</h4>

        <div className="time-mode-group">
          <label className="time-mode-option">
            <input
              type="radio"
              name="timeMode"
              value="current"
              checked={timeMode === "current"}
              onChange={() => setTimeMode("current")}
            />
            현재 시간 사용 (지금 {defaultTime})
          </label>
          <label className="time-mode-option">
            <input
              type="radio"
              name="timeMode"
              value="custom"
              checked={timeMode === "custom"}
              onChange={() => setTimeMode("custom")}
            />
            시간 직접 설정
            <input
              type="time"
              className="time-picker"
              value={customTime}
              disabled={timeMode !== "custom"}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </label>
        </div>

        <div className="confirm-modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            취소
          </button>
          <button className="confirm-btn" onClick={handleConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressConfirmModal;
