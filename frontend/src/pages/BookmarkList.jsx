import { useEffect, useState, useContext } from "react";
import { apiRequest } from "../api/api";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt, faPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "./BookmarkList.css";

const BookmarkList = () => {
  const { user } = useContext(UserContext);
  const [bookmarks, setBookmarks] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [bm, lots] = await Promise.all([
        apiRequest("/api/bookmarks", "GET", null, user?.email),
        apiRequest("/api/parking-lots"),
      ]);
      setBookmarks(bm);
      setParkingLots(lots);
    };
    fetchData();
  }, []);

  const getLotDetails = (p_id) => parkingLots.find((lot) => lot.p_id === p_id);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const encoded = encodeURIComponent(searchTerm);
      const result = await apiRequest(`/api/parking-lots/search?keyword=${encoded}`);
      setSearchResults(result);
    } catch (err) {
      console.error("검색 실패", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleDelete = async (p_id) => {
    try {
      await apiRequest(`/api/bookmarks/${p_id}`, "DELETE", null, user?.email);
      setBookmarks((prev) => prev.filter((lot) => lot.p_id !== p_id));
      toast.success("북마크가 삭제되었습니다.");
    } catch {
      toast.error("삭제 실패");
    }
  };

  const handleAdd = async (lot) => {
    try {
      await apiRequest("/api/bookmarks", "POST", { p_id: lot.p_id }, user?.email);
      setBookmarks((prev) => [...prev, { p_id: lot.p_id }]);
      toast.success("북마크가 추가되었습니다.");
    } catch {
      toast.error("추가 실패");
    }
  };

  const handleClickCard = (lot) => {
    sessionStorage.setItem("targetParking", JSON.stringify(lot));
    navigate("/home");
  };

  const isBookmarked = (p_id) => bookmarks.some((b) => b.p_id === p_id);

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

  const renderCard = (lot, isSearch = false) => {
    const scoreKey = `ai_recommend_score_${user.preferred_factor?.toLowerCase()}`;
    const score = lot[scoreKey] || 0;
    const scoreColor = getColorByScore(score);

    return (
      <li key={lot.p_id} className="bookmark-card" onClick={() => !isSearch && handleClickCard(lot)}>
        <div className="card-header">
          <h3>{lot.name}</h3>
          {isSearch ? (
            <button onClick={(e) => { e.stopPropagation(); handleAdd(lot); }} className="add-btn">
              <FontAwesomeIcon icon={faPlus} />
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(lot.p_id); }} className="delete-btn">
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          )}
        </div>
        <p className="lot-address">{lot.address}</p>
        <div className="lot-info-group">
          <span>요금: {lot.fee.toLocaleString()}원</span>
          <span>혼잡도: {lot.real_time_congestion}</span>
          <span>평점: {lot.avg_rating?.toFixed(1) || "0.0"}</span>
        </div>
      </li>
    );
  };

  const mergedBookmarks = bookmarks
    .map((b) => getLotDetails(b.p_id))
    .filter(Boolean); // undefined 제거

  return (
    <div className="bookmark-list-container">
      <h2>내 북마크</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="주차장 검색 후 추가"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSearch} className="search-button">
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      {searchResults.length > 0 && (
        <ul className="search-results">
          {searchResults
            .filter((lot) => !isBookmarked(lot.p_id))
            .map((lot) => renderCard(lot, true))}
        </ul>
      )}

      <hr />

      {mergedBookmarks.length === 0 ? (
        <p className="no-bookmarks">북마크된 주차장이 없습니다.</p>
      ) : (
        <ul>
          {mergedBookmarks.map((lot) => renderCard(lot))}
        </ul>
      )}
    </div>
  );
};

export default BookmarkList;
