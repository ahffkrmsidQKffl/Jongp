import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../api/api";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as solidBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as regularBookmark } from "@fortawesome/free-regular-svg-icons";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import StarDisplay from "./StarDisplay";
import EditRatingModal from "./EditRatingModal";
import "./ParkingPopup.css";

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

const ParkingPopup = ({ parking, onClose }) => {
  const { user } = useContext(UserContext);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingId, setRatingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const p_id = parking.p_id || parking.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const bookmarks = await apiRequest("/api/bookmarks", "GET", null, user.email);
        setIsBookmarked(bookmarks.some((b) => b.p_id === p_id));
      } catch (err) {
        console.error("북마크 조회 실패", err);
      }

      try {
        const ratings = await apiRequest("/api/ratings", "GET", null, user.email);
        const myRating = ratings.find((r) => r.p_id === p_id && r.email === user.email);
        if (myRating) {
          setRating(myRating.score);
          setRatingId(myRating.rating_id);
        }
      } catch (err) {
        console.error("평점 조회 실패", err);
      }
    };

    fetchData();
  }, [user, p_id]);

  const toggleBookmark = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      if (isBookmarked) {
        await apiRequest(`/api/bookmarks/${p_id}`, "DELETE", null, user.email);
        setIsBookmarked(false);
      } else {
        await apiRequest("/api/bookmarks", "POST", { p_id }, user.email);
        setIsBookmarked(true);
      }
    } catch {
      toast.error("북마크 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRatingSave = async (newScore) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (ratingId) {
        await apiRequest("/api/ratings", "PATCH", {
          rating_id: ratingId,
          score: newScore,
        }, user.email);
        toast.success("평점이 수정되었습니다!");
      } else {
        const res = await apiRequest("/api/ratings", "POST", {
          p_id,
          score: newScore,
        }, user.email);
        setRatingId(res.rating_id);
        toast.success("평점이 등록되었습니다!");
      }
      setRating(newScore);
      setShowEditModal(false);
    } catch (err) {
      toast.error("평점 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectionClick = () => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(parking.name)},${parking.latitude},${parking.longitude}`;
    window.open(url, "_blank");
  };

  const factor = user?.preferred_factor?.toLowerCase();
  const score = factor ? parking[`ai_recommend_score_${factor}`] : 0;
  const scoreColor = getColorByScore(score);

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <div className="popup-top-icons">
          {factor && (
            <div className="score-badge" style={{ backgroundColor: scoreColor }}>
              {score}
            </div>
          )}
          <button className="bookmark-toggle" onClick={toggleBookmark}>
            <FontAwesomeIcon icon={isBookmarked ? solidBookmark : regularBookmark} />
          </button>
        </div>

        <h2 className="popup-title">{parking.name} 공영주차장</h2>
        <p className="popup-address">{parking.address}</p>

        <div className="info-box">
          <p><strong>요금</strong> {parking.fee.toLocaleString()}원</p>
          <p><strong>혼잡도</strong> {parking.real_time_congestion}</p>
        </div>

        <div className="rating-box">
          <div className="rating-display-block">
            <p><strong>주차장 평점</strong></p>
            <StarDisplay score={parking.avg_rating || 0} color="#f65a5a" />
          </div>

          <div className="rating-display-block">
            <p><strong>내 평점</strong></p>
            <div className="rating-editable" onClick={() => setShowEditModal(true)}>
              <StarDisplay score={rating || 0} color="gold" />
            </div>
          </div>
        </div>

        <div className="popup-buttons">
          <button className="popup-btn cancel" onClick={onClose}>닫기</button>
          <button className="popup-btn direction" onClick={handleDirectionClick}>길찾기</button>
        </div>
      </div>

      {showEditModal && (
        <EditRatingModal
          initialScore={rating}
          onSave={handleRatingSave}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default ParkingPopup;
