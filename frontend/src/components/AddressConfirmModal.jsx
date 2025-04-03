import "./AddressConfirmModal.css";

const AddressConfirmModal = ({ place, onConfirm, onCancel }) => {
  return (
    <div className="address-confirm-modal">
      <div className="confirm-modal-content">
        <p className="confirm-modal-title">선택한 주소가 맞나요?</p>
        <h4>{place.address_name}</h4>
        <div className="confirm-modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>취소</button>
          <button className="confirm-btn" onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default AddressConfirmModal;