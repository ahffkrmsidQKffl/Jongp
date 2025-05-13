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
  const [bookmarks, setBookmarks] = useState([]);        // 북마크 목록: {p_id, name, address, fee, avg_rating}[]
  const [searchResults, setSearchResults] = useState([]); // 검색 결과: parking-lots API 반환 형태
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // 북마크 목록을 서버에서 불러오는 함수
  const fetchBookmarks = async () => {
    try {
      const res = await apiRequest("/api/bookmarks", "GET", null, user?.email);
      setBookmarks(res.data);
    } catch (err) {
      console.error("북마크 조회 실패", err);
      toast.error("북마크를 불러오지 못했습니다.");
    }
  };

  // 초기 로드 및 user.email 변경 시 북마크 FETCH
  useEffect(() => {
    if (user?.email) fetchBookmarks();
  }, [user?.email]);

  // 검색
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const encoded = encodeURIComponent(searchTerm);
      const res = await apiRequest(`/api/parking-lots/search?keyword=${encoded}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("검색 실패", err);
      toast.error("검색 중 오류가 발생했습니다.");
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // 북마크 삭제
  const handleDelete = async (p_id) => {
    try {
      await apiRequest(`/api/bookmarks/${p_id}`, "DELETE", null, user?.email);
      toast.success("북마크가 삭제되었습니다.");
      await fetchBookmarks();
    } catch (err) {
      console.error("삭제 실패", err);
      toast.error(err.message || "삭제에 실패했습니다.");
    }
  };

  // 북마크 추가
  const handleAdd = async (lot) => {
    try {
      await apiRequest("/api/bookmarks", "POST", { p_id: lot.p_id }, user?.email);
      toast.success("북마크가 추가되었습니다.");
      await fetchBookmarks();
    } catch (err) {
      console.error("추가 실패", err);
      toast.error("추가에 실패했습니다.");
    }
  };

  // 클릭하면 홈으로 이동하며 p_id 전달
  const handleClickCard = (lot) => {
    navigate("/home", { state: { targetParkingId: lot.p_id } });
  };

  // 렌더링
  const renderCard = (lot, isSearch = false) => (
    <li
      key={lot.p_id}
      className="bookmark-card"
      onClick={() => !isSearch && handleClickCard(lot)}
    >
      <div className="card-header">
        <h3>{lot.name}</h3>
        {isSearch ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdd(lot);
            }}
            className="add-btn"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(lot.p_id);
            }}
            className="delete-btn"
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        )}
      </div>
      <p className="lot-address">{lot.address}</p>
      <div className="lot-info-group">
        <span>
          요금:{" "}
          {lot.fee != null
            ? `${lot.fee.toLocaleString()}원`
            : "정보 없음"}
        </span>
        <span>
          평점: {lot.avg_rating != null ? lot.avg_rating.toFixed(1) : "0.0"}
        </span>
      </div>
    </li>
  );

  // bookmarked list is just bookmarks[]
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
            .filter((lot) => !bookmarks.some((b) => b.p_id === lot.p_id))
            .map((lot) => renderCard(lot, true))}
        </ul>
      )}

      <hr />

      {bookmarks.length === 0 ? (
        <p className="no-bookmarks">북마크된 주차장이 없습니다.</p>
      ) : (
        <ul>{bookmarks.map((lot) => renderCard(lot))}</ul>
      )}
    </div>
  );
};

export default BookmarkList;