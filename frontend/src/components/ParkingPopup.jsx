import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../api/api";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as solidBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as regularBookmark } from "@fortawesome/free-regular-svg-icons";
import "./ParkingPopup.css";

const ParkingPopup = ({ parking, onClose }) => {
  const { user } = useContext(UserContext);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingId, setRatingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const p_id = parking.p_id || parking.id;

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await apiRequest("/api/bookmarks");
        const isMarked = res.some((b) => b.p_id === p_id);
        setIsBookmarked(isMarked);
      } catch (err) {
        console.error("북마크 조회 실패", err);
      }
    };

    const fetchRatings = async () => {
      try {
        const res = await apiRequest("/api/ratings");
        const myRating = res.find((r) => r.p_id === p_id && r.email === user.email);
        if (myRating) {
          setRating(myRating.score);
          setRatingId(myRating.rating_id);
        }
      } catch (err) {
        console.error("평점 조회 실패", err);
      }
    };

    if (user) {
      fetchBookmarks();
      fetchRatings();
    }
  }, [user, p_id]);

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await apiRequest(`/api/bookmarks/${p_id}`, "DELETE");
        setIsBookmarked(false);
      } else {
        await apiRequest("/api/bookmarks", "POST", { p_id });
        setIsBookmarked(true);
      }
    } catch {
      toast.error("북마크 처리 중 오류가 발생했습니다.");
    }
  };

  const handleDirectionClick = () => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(parking.name)},${parking.latitude},${parking.longitude}`;
    window.open(url, "_blank");
  };

  const handleRatingSubmit = async () => {
    if (!rating || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (ratingId) {
        await apiRequest("/api/ratings", "PATCH", {
          rating_id: ratingId,
          score: rating,
        });
        toast.success("평점이 수정되었습니다!");
      } else {
        await apiRequest("/api/ratings", "POST", {
          p_id,
          score: rating,
        });
        toast.success("평점이 등록되었습니다!");
      }
    } catch {
      toast.error("평점 등록 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const factor = user?.preferred_factor?.toLowerCase();
  const score = factor ? parking[`ai_recommend_score_${factor}`] : 0;

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <button className="bookmark-toggle" onClick={toggleBookmark}>
          <FontAwesomeIcon icon={isBookmarked ? solidBookmark : regularBookmark} />
        </button>
        <h2>{parking.name} 공영주차장</h2>
        <p className="popup-address">{parking.address}</p>
        <div className="popup-info">
          <p><strong>요금</strong> {parking.fee.toLocaleString()}원</p>
          <p><strong>평점</strong> {parking.avg_rating?.toFixed(1)} / 5</p>
          <p><strong>혼잡도</strong> {parking.real_time_congestion}</p>
          {factor && (
            <p><strong>AI 추천 점수</strong> ({user.preferred_factor} 기준): <strong>{score}</strong></p>
          )}
        </div>

        <div className="rating-section">
          <p style={{ marginBottom: 6 }}>평점을 선택해주세요:</p>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star ${rating >= star ? "selected" : ""}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
          <button
            className="rating-submit"
            onClick={handleRatingSubmit}
            disabled={isSubmitting || !rating}
          >
            {ratingId ? "수정" : "등록"}
          </button>
        </div>

        <div className="popup-buttons">
          <button className="popup-btn cancel" onClick={onClose}>닫기</button>
          <button className="popup-btn direction" onClick={handleDirectionClick}>길찾기</button>
        </div>
      </div>
    </div>
  );
};

export default ParkingPopup;
