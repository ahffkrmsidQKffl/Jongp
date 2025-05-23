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

export default function ParkingPopup({ parking, onClose }) {
  const { user } = useContext(UserContext);

  // ① 로컬 복제된 parking 정보
  const [parkingDetail, setParkingDetail] = useState(parking);

  // ② 북마크 상태
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);

  // ③ 평점 상태
  const [rating, setRating] = useState(0);
  const [ratingId, setRatingId] = useState(null);

  // 로딩/모달 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const p_id = parkingDetail.p_id || parkingDetail.id;

  // ── 북마크 & 내 평점 메타데이터 조회 함수 ──
  const fetchMeta = async () => {
    if (!user) return;
    // 1) 북마크 조회해서 bookmarkId 가져오기
    try {
      const res = await apiRequest("/api/bookmarks", "GET", null, user.email);
      const bm = res.data.find((b) => b.p_id === p_id);
      if (bm) {
        setIsBookmarked(true);
        setBookmarkId(bm.bookmarkId);
      } else {
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    } catch (err) {
      console.error("북마크 조회 실패", err);
    }
    // 2) 내 평점 조회
    try {
      const ratingsRes = await apiRequest("/api/ratings", "GET", null, user.email);
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

  // 컴포넌트 마운트 및 p_id/parkingDetail.name 변경 시 메타 다시 가져오기
  useEffect(() => {
    fetchMeta();
  }, [user, p_id, parkingDetail.name]);

  // ── 북마크 토글 ──
  const toggleBookmark = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    try {
      if (isBookmarked) {
        // 삭제
        await apiRequest(
          `/api/bookmarks/${bookmarkId}`,
          "DELETE",
          null,
          user.email
        );
      } else {
        // 등록
        await apiRequest("/api/bookmarks", "POST", { p_id }, user.email);
      }
      await fetchMeta(); // 메타 재조회
    } catch {
      toast.error("북마크 처리 중 오류가 발생했습니다.");
    }
  };

  // ── 평점 저장 (기존 로직) ──
  const handleRatingSave = async (newScore) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (ratingId) {
        // 수정
        await apiRequest(
          "/api/ratings",
          "PATCH",
          { rating_id: ratingId, rating: newScore },
          user.email
        );
        toast.success("평점이 수정되었습니다!");
      } else {
        // 신규 등록
        await apiRequest(
          "/api/ratings",
          "POST",
          { p_id, score: newScore },
          user.email
        );
        toast.success("평점이 등록되었습니다!");
      }
      // 평균 평점 갱신
      const lotRes = await apiRequest(`/api/parking-lots/${p_id}`);
      const data = lotRes.data;
      setParkingDetail((prev) => ({
        ...prev,
        avg_rating: data.avg_score ?? data.avg_rating,
      }));
      // 내 평점도 갱신
      const updatedRatings = await apiRequest(
        "/api/ratings",
        "GET",
        null,
        user.email
      );
      const myRating = updatedRatings.data.find(
        (r) => r.p_name === parkingDetail.name
      );
      if (myRating) {
        setRating(myRating.score);
        setRatingId(myRating.rating_id);
      }
      setShowEditModal(false);
    } catch {
      toast.error("평점 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 길찾기 ──
  const handleDirectionClick = () => {
    const { latitude, longitude, name } = parkingDetail;

    // 🔧 1) 실제 모바일 터치 디바이스 감지
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isRealMobile = isTouch && (isAndroid || isIOS);

    // 🔧 2) 웹 길찾기 URL (페일백용)
    const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
      name
    )},${latitude},${longitude}`;

    if (isRealMobile && isAndroid) {
      // Android: Intent + 브라우저 페일백, 새 탭
      const intentUrl = `intent://route?ep=${latitude},${longitude}&by=CAR#Intent;scheme=kakaomap;package=com.kakao.talk;S.browser_fallback_url=${encodeURIComponent(
        webUrl
      )};end`;
      window.open(intentUrl, "_blank");
    } else if (isRealMobile && isIOS) {
      // ─────────────────────────────────────────
      // 🔧 iOS: Scheme 호출 + 복수 이벤트로 진짜 앱 전환 감지 + 조건부 페일백

      // 1) 전환 감지 플래그 & 핸들러
      let didSwitch = false;                                        // 🔧 수정됨
      const onSwitch = () => { didSwitch = true; };                 // 🔧 수정됨
      document.addEventListener("visibilitychange", onSwitch);      // 🔧 수정됨
      window.addEventListener("pagehide", onSwitch);                // 🔧 수정됨
      window.addEventListener("blur", onSwitch);                    // 🔧 수정됨

      // 2) 커스텀 스킴 호출 (같은 탭)
      window.location.href = `kakaomap://route?ep=${latitude},${longitude}&by=CAR`; // 🔧 수정됨

      // 3) 1초 뒤, 앱 전환이 없었다면 웹 길찾기로
      setTimeout(() => {
        if (!didSwitch) {
          window.open(webUrl, "_blank");                            // 🔧 수정됨
        }
        // 이벤트 리스너 정리
        document.removeEventListener("visibilitychange", onSwitch); // 🔧 수정됨
        window.removeEventListener("pagehide", onSwitch);           // 🔧 수정됨
        window.removeEventListener("blur", onSwitch);               // 🔧 수정됨
      }, 1000);                                                      // 🔧 수정됨: 타이머 1초로
      // ─────────────────────────────────────────
    } else {
      // PC/에뮬레이터: 새 탭으로 웹 길찾기
      window.open(webUrl, "_blank");
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <div className="popup-top-icons">
          <button className="bookmark-toggle" onClick={toggleBookmark}>
            <FontAwesomeIcon
              icon={isBookmarked ? solidBookmark : regularBookmark}
            />
          </button>
        </div>

        <h2 className="popup-title">{parkingDetail.name} 공영주차장</h2>
        <p className="popup-address">{parkingDetail.address}</p>

        <div className="info-box">
          <p>
            <strong>요금</strong>{" "}
            {parkingDetail.fee != null
              ? `5분당 ${parkingDetail.fee.toLocaleString()}원`
              : "정보 없음"}
          </p>
          <p>
            <strong>주차 현황</strong>{" "}
            {parkingDetail.total_spaces != null &&
            parkingDetail.current_vehicles != null
              ? `총 ${parkingDetail.total_spaces.toLocaleString()}대 중 ${parkingDetail.current_vehicles.toLocaleString()}대 사용 중`
              : "정보 없음"}
          </p>
        </div>

        <div className="rating-box">
          <div className="rating-display-block">
            <p>
              <strong>주차장 평점</strong>
            </p>
            <StarDisplay
              score={parkingDetail.avg_rating || 0}
              color="#f65a5a"
            />
          </div>
          <div className="rating-display-block">
            <p>
              <strong>내 평점</strong>
            </p>
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
}
