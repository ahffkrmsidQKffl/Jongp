import { useContext, useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { UserContext } from "../context/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import EditRatingModal from "../components/EditRatingModal";
import StarDisplay from "../components/StarDisplay";
import "./BookmarkList.css";

export default function Ratings() {
  const { user } = useContext(UserContext);
  const [ratings, setRatings] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    const fetchData = async () => {
      try {
        const [ratingsRes, lotsRes] = await Promise.all([
          apiRequest("/api/ratings", "GET", null, user.email),
          apiRequest("/api/parking-lots")
        ]);
        const mapped = ratingsRes.data.map((r) => ({
          ...r,
          p_id: r.p_id ?? null,
          p_name: r.p_name
        }));
        setRatings(mapped);
        setParkingLots(lotsRes.data);
      } catch (err) {
        console.error("평점 정보를 불러오는 중 오류", err);
        toast.error("평점 정보를 불러오지 못했습니다.");
      }
    };
    fetchData();
  }, [user?.email]);

  const getLotDetails = (p_id, p_name) => {
    if (p_id != null) {
      return parkingLots.find((lot) => lot.p_id === p_id);
    }
    return parkingLots.find((lot) => lot.name === p_name);
  };

  const handleDelete = async (rating_id) => {
    try {
      await apiRequest(
        `/api/ratings/${rating_id}`, "DELETE", null, user.email
      );
      setRatings((prev) => prev.filter((r) => r.rating_id !== rating_id));
      toast.success("평점이 삭제되었습니다.");
    } catch {
      toast.error("평점 삭제에 실패했습니다.");
    }
  };

  const handleUpdate = async (newScore) => {
    try {
      await apiRequest(
        "/api/ratings",
        "PATCH",
        { rating_id: selectedRating.rating_id, rating: newScore },
        user.email
      );
      setRatings((prev) =>
        prev.map((r) =>
          r.rating_id === selectedRating.rating_id
            ? { ...r, score: newScore }
            : r
        )
      );
      toast.success("평점이 수정되었습니다.");
      setShowEditModal(false);
    } catch {
      toast.error("평점 수정에 실패했습니다.");
    }
  };

  return (
    <div className="bookmark-list-container">
      <h2>내 평점 관리</h2>

      {ratings.length === 0 ? (
        <p className="no-bookmarks">등록된 평점이 없습니다.</p>
      ) : (
        <ul>
          {ratings.map((r) => {
            const lot = getLotDetails(r.p_id, r.p_name);
            if (!lot) return null;

            return (
              <li key={r.rating_id} className="bookmark-card">
                <div className="card-header">
                  <h3>{lot.name}</h3>
                  <div>
                    <button
                      className="add-btn"
                      onClick={() => { setSelectedRating(r); setShowEditModal(true); }}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(r.rating_id)}
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </div>
                </div>
                <p>{lot.address}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap" }}>
                  <StarDisplay score={r.score} />
                  <span style={{ fontSize: 14, fontWeight: "bold", color: "#444", marginLeft: 12 }}>
                    {r.score.toFixed(1)}점
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showEditModal && selectedRating && (
        <EditRatingModal
          initialScore={selectedRating.score}
          onCancel={() => setShowEditModal(false)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}