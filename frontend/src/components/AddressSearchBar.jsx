import { useState } from "react";
import "./AddressSearchBar.css";

const AddressSearchBar = ({ onSelect }) => {
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
    <div className="address-search-bar">
      <div className="search-bar-top">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="주소 또는 장소명을 입력하세요"
        />
        <button onClick={handleSearch}>검색</button>
      </div>
      {results.length > 0 && (
        <ul className="search-result-list">
          {results.map((place) => (
            <li key={place.id} onClick={() => {
              onSelect({ lat: parseFloat(place.y), lng: parseFloat(place.x), place });
              setResults([]); // 리스트 닫기
              setQuery("");   // 입력창도 초기화
            }}
          >
            <strong>{place.place_name}</strong>
            <p>{place.address_name}</p>
          </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearchBar;