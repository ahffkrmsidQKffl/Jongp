import { useState } from "react";
import "./AddressSearchModal.css";

const AddressSearchModal = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    if (!query.trim()) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(query, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setResults(data);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card slide-up">
        <button className="modal-close" onClick={onClose}>×</button>
        <h3 className="modal-title">주소 검색</h3>

        <div className="search-bar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
            placeholder="주소 또는 장소명 입력"
          />
          <button onClick={handleSearch} className="search-button">검색</button>
        </div>

        <ul className="search-results">
          {results.map((place) => (
            <li
              key={place.id}
              className="search-item"
              onClick={() => {
                const lat = parseFloat(place.y);
                const lng = parseFloat(place.x);
                onSelect({ lat, lng, place });
                onClose();
              }}
            >
              <strong>{place.place_name}</strong>
              <p>{place.address_name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddressSearchModal;