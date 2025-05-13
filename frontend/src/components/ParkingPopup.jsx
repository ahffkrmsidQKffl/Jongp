import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../api/api";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as solidBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as regularBookmark } from "@fortawesome/free-regular-svg-icons";
import StarDisplay from "./StarDisplay";
import EditRatingModal from "./EditRatingModal";
import "./ParkingPopup.css";

const ParkingPopup = ({ parking, onClose }) => {
  const { user } = useContext(UserContext);
  // 로컬 상태로 parking 복제
  const [parkingDetail, setParkingDetail] = useState(parking);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingId, setRatingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const p_id = parkingDetail.p_id || parkingDetail.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // 북마크 상태
      try {
        const bookmarksRes = await apiRequest(
          "/api/bookmarks", "GET", null, user.email
        );
        setIsBookmarked(
          bookmarksRes.data.some((b) => b.p_id === p_id)
        );
      } catch (err) {
        console.error("북마크 조회 실패", err);
      }

      // 내 평점 조회 (p_name 매칭)
      try {
        const ratingsRes = await apiRequest(
          "/api/ratings", "GET", null, user.email
        );
        const myRating = ratingsRes.data.find(
          (r) => r.p_name === parkingDetail.name
        );
        if (myRating) {
          setRating(myRating.score);
          setRatingId(myRating.rating_id);
        }
      } catch (err) {
        console.error("평점 조회 실패", err);
      }
    };
    fetchData();
  }, [user, p_id, parkingDetail.name]);

  // 북마크 토글
  const toggleBookmark = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    try {
      if (isBookmarked) {
        await apiRequest(
          `/api/bookmarks/${p_id}`, "DELETE", null, user.email
        );
        setIsBookmarked(false);
      } else {
        await apiRequest(
          "/api/bookmarks", "POST", { p_id }, user.email
        );
        setIsBookmarked(true);
      }
    } catch {
      toast.error("북마크 처리 중 오류가 발생했습니다.");
    }
  };

  // 평점 저장
  const handleRatingSave = async (newScore) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 등록 또는 수정
      if (ratingId) {
        // PATCH 요청에서 필드는 `rating`으로 전달해야 합니다
        await apiRequest(
          "/api/ratings", "PATCH", { rating_id: ratingId, rating: newScore }, user.email
        );
        toast.success("평점이 수정되었습니다!");
      } else {
        await apiRequest(
          "/api/ratings", "POST", { p_id, score: newScore }, user.email
        );
        toast.success("평점이 등록되었습니다!");
      }

      // 서버에서 최신 avg_rating 재조회
      const lotRes = await apiRequest(`/api/parking-lots/${p_id}`);
      const data = lotRes.data;
      setParkingDetail((prev) => ({
        ...prev,
        avg_rating: data.avg_score ?? data.avg_rating,
      }));

      // 내 평점도 갱신
      const updatedRatings = await apiRequest(
        "/api/ratings", "GET", null, user.email
      );
      const myRating = updatedRatings.data.find(
        (r) => r.p_name === parkingDetail.name
      );
      if (myRating) {
        setRating(myRating.score);
        setRatingId(myRating.rating_id);
      }

      setShowEditModal(false);
    } catch (err) {
      toast.error("평점 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 길찾기
  const handleDirectionClick = () => {
    const url =
      `https://map.kakao.com/link/to/${encodeURIComponent(
        parkingDetail.name
      )},${parkingDetail.latitude},${parkingDetail.longitude}`;
    window.open(url, "_blank");
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <div className="popup-top-icons">
          <button onClick={toggleBookmark} className="bookmark-toggle">
            <FontAwesomeIcon
              icon={isBookmarked ? solidBookmark : regularBookmark}
            />
          </button>
        </div>

        <h2 className="popup-title">
          {parkingDetail.name} 공영주차장
        </h2>
        <p className="popup-address">{parkingDetail.address}</p>

        <div className="info-box">
          <p>
            <strong>요금</strong>{' '}
            {parkingDetail.fee != null
              ? `${parkingDetail.fee.toLocaleString()}원`
              : "정보 없음"}
          </p>
          <p>
            <strong>주차 현황</strong>{' '}
            {parkingDetail.total_spaces != null &&
            parkingDetail.current_vehicles != null
              ? `총 ${parkingDetail.total_spaces.toLocaleString()}대 중 ${parkingDetail.current_vehicles.toLocaleString()}대 사용 중`
              : "정보 없음"}
          </p>
        </div>

        <div className="rating-box">
          <div className="rating-display-block">
            <p><strong>주차장 평점</strong></p>
            <StarDisplay
              score={parkingDetail.avg_rating || 0}
              color="#f65a5a"
            />
          </div>

          <div className="rating-display-block">
            <p><strong>내 평점</strong></p>
            <div
              className="rating-editable"
              onClick={() => setShowEditModal(true)}
            >
              <StarDisplay score={rating || 0} color="gold" />
            </div>
          </div>
        </div>

        <div className="popup-buttons">
          <button className="popup-btn cancel" onClick={onClose}>
            닫기
          </button>
          <button
            className="popup-btn direction"
            onClick={handleDirectionClick}
          >
            길찾기
          </button>
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
