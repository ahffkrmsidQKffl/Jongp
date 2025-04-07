import { useState } from "react";
import "./AddressSearchBar.css";

const AddressSearchBar = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false); // 검색 수행 여부

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearched(true); // 검색 시작

    const ps = new window.kakao.maps.services.Places();

    // 키워드 검색
    const keywordPromise = new Promise((resolve) => {
      ps.keywordSearch(query, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve(data);
        } else {
          resolve([]);
        }
      });
    });

    // 주소 검색
    const restPromise = fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: "KakaoAK 525b5c4f76e6b319ae26727a9535eec3"
      }
    })
      .then((res) => res.json())
      .then((data) =>
        (data.documents || []).map((doc) => ({
          id: doc.address_name,
          place_name: doc.address_name,
          address_name: doc.address_name,
          x: doc.x,
          y: doc.y,
        }))
      )
      .catch(() => []);

    const [keywordResults, addressResults] = await Promise.all([keywordPromise, restPromise]);

    const combined = [...addressResults, ...keywordResults];
    const unique = [];
    const seen = new Set();

    for (const place of combined) {
      const key = `${place.x}_${place.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(place);
      }
    }

    setResults(unique);
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
            <li
              key={`${place.x}_${place.y}`}
              onClick={() => {
                onSelect({
                  lat: parseFloat(place.y),
                  lng: parseFloat(place.x),
                  place,
                });
                setResults([]);
                setQuery("");
                setSearched(false);
              }}
            >
              <strong>{place.place_name}</strong>
              <p>{place.address_name}</p>
            </li>
          ))}
        </ul>
      )}

      {results.length === 0 && searched && (
        <div className="no-result-message">
          <p>
            검색 결과가 없습니다.<br />
            정확한 주소나 건물명을 입력해보세요.
          </p>
          <div className="address-example">
            <strong>예시)</strong><br />
            - 도로명 주소: 성남대로 1342<br />
            - 지번 주소: 복정동 620-2
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSearchBar;