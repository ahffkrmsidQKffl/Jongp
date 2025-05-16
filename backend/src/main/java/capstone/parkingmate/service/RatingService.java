package capstone.parkingmate.service;

import capstone.parkingmate.dto.RatingRequestDTO;
import capstone.parkingmate.dto.RatingResponseDTO;
import capstone.parkingmate.dto.RatingUpdateRequestDTO;
import capstone.parkingmate.dto.ResponseData;
import capstone.parkingmate.entity.ParkingLotAvgRating;
import capstone.parkingmate.entity.Rating;
import capstone.parkingmate.entity.User;
import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.ParkingLotAvgRatingRepository;
import capstone.parkingmate.repository.ParkingLotRepository;
import capstone.parkingmate.repository.RatingRepository;
import capstone.parkingmate.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final UserService userService;
    private final AdminService adminService;                         // ← 추가
    private final ParkingLotAvgRatingRepository avgRatingRepository; // ← 추가

    // 평점 조회
    @Transactional(readOnly = true)
    public ResponseData<?> getRatings(HttpServletRequest request) {
        // 1. 세션에서 user_id 가져오기
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
        Long userId = (Long) session.getAttribute("user_id");

        // 2. 유저 엔티티 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 3. 사용자가 작성한 평점들 가져오기
        List<Rating> ratings = user.getRatings();  // ★ User 엔티티 안에 있는 ratings 리스트 사용

        // 4. 평점 리스트를 DTO로 변환
        List<RatingResponseDTO> responseList = ratings.stream()
                .map(rating -> {
                    RatingResponseDTO dto = new RatingResponseDTO();
                    dto.setRating_id(rating.getRating_id());
                    dto.setUser_name(user.getNickname());
                    dto.setP_name(rating.getParkingLot().getName()); // 주차장 이름
                    dto.setScore(rating.getScore());
                    dto.setCreated_at(rating.getCreated_at());
                    return dto;
                })
                .toList();

        // 5. 성공 응답 반환
        return ResponseData.res(HttpStatus.OK, "평점 기록 조회 성공", responseList);
    }

    // 평점 등록
    @Transactional
    public ResponseData<?> addRating(RatingRequestDTO ratingRequestDTO, HttpServletRequest request) {
        // 1. 세션에서 user_id 가져오기
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
        Long userId = (Long) session.getAttribute("user_id");

        // 2. User와 ParkingLot 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        ParkingLot parkingLot = parkingLotRepository.findById(ratingRequestDTO.getP_id())
                .orElseThrow(() -> new CustomException("주차장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 3. 새로운 평점 객체 생성
        Rating rating = new Rating();
        rating.setParkingLot(parkingLot);
        rating.setUser(user);
        rating.setScore(ratingRequestDTO.getScore());

        // 4. 저장
        ratingRepository.save(rating);

        // 전체 평점 목록 조회 → 해당 주차장 평점만 필터
        List<RatingResponseDTO> all = adminService.retrieve_ratings();
        List<RatingResponseDTO> mine = all.stream()
                .filter(r -> r.getP_name().equals(parkingLot.getName()))
                .toList();

        // rating_count, avg_score 재계산
        int newCount = mine.size();
        double sum = mine.stream().mapToDouble(RatingResponseDTO::getScore).sum();
        double newAvg = sum / newCount;

        // ParkingLotAvgRating 업데이트
        ParkingLotAvgRating avg = avgRatingRepository.findByParkingLot(parkingLot)
                .orElseGet(() -> {
                    ParkingLotAvgRating p = new ParkingLotAvgRating();
                    p.setParkingLot(parkingLot);
                    return p;
                });
        avg.setRating_count(newCount);
        avg.setAvg_score(newAvg);
        avgRatingRepository.save(avg);

        // 성공 응답 반환
        return ResponseData.res(HttpStatus.CREATED, "평점 등록 성공");
    }

    // 평점 수정
    @Transactional
    public ResponseData<?> updateRating(RatingUpdateRequestDTO ratingUpdateRequestDTO, HttpServletRequest request) {
        // 1. 세션에서 user_id 가져오기
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
        Long userId = (Long) session.getAttribute("user_id");

        // 2. 평점 조회
        Rating rating = ratingRepository.findById(ratingUpdateRequestDTO.getRating_id())
                .orElseThrow(() -> new CustomException("평점을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 3. 본인 작성 평점인지 확인
        if (!rating.getUser().getUser_id().equals(userId)) {
            throw new CustomException("본인이 작성한 평점만 수정할 수 있습니다.", HttpStatus.FORBIDDEN);
        }

        // 4. 평점 점수 수정
        rating.setScore(ratingUpdateRequestDTO.getRating());

        ratingRepository.save(rating);

        // 전체 평점 목록 조회 → 해당 주차장 평점만 필터
        ParkingLot parkingLot = rating.getParkingLot();
        List<RatingResponseDTO> all = adminService.retrieve_ratings();
        List<RatingResponseDTO> mine = all.stream()
                .filter(r -> r.getP_name().equals(parkingLot.getName()))
                .toList();

        // rating_count(변동 없음), avg_score 재계산
        int newCount = mine.size();
        double sum = mine.stream().mapToDouble(RatingResponseDTO::getScore).sum();
        double newAvg = sum / newCount;

        // ParkingLotAvgRating 업데이트
        ParkingLotAvgRating avg = avgRatingRepository.findByParkingLot(parkingLot)
                .orElseThrow(() -> new CustomException("평점 통계 정보를 찾을 수 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR));
        avg.setRating_count(newCount);
        avg.setAvg_score(newAvg);
        avgRatingRepository.save(avg);

        // 성공 응답 반환
        return ResponseData.res(HttpStatus.OK, "평점 수정 성공");
    }

    // 평점 삭제
    @Transactional
    public ResponseData<?> deleteRating(Long ratingId, HttpServletRequest request) {
        // 1. 세션에서 user_id 가져오기
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
        Long userId = (Long) session.getAttribute("user_id");

        // 2. 삭제할 평점 조회
        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new CustomException("평점을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 3. 본인 작성 평점인지 확인
        if (!rating.getUser().getUser_id().equals(userId)) {
            throw new CustomException("본인이 작성한 평점만 삭제할 수 있습니다.", HttpStatus.FORBIDDEN);
        }

        ParkingLot lot = rating.getParkingLot();

        // 4. 평점 삭제
        ratingRepository.delete(rating);

        // 전체 평점 목록 조회 → 해당 주차장 평점만 필터
        List<RatingResponseDTO> all = adminService.retrieve_ratings();
        List<RatingResponseDTO> mine = all.stream()
                .filter(r -> r.getP_name().equals(parkingLot.getName()))
                .toList();

        // rating_count, avg_score 재계산 (0개인 경우 avg=0)
        int newCount = mine.size();
        double newAvg = newCount == 0
                ? 0.0
                : mine.stream().mapToDouble(RatingResponseDTO::getScore).sum() / newCount;

        // ParkingLotAvgRating 업데이트
        ParkingLotAvgRating avg = avgRatingRepository.findByParkingLot(parkingLot)
                .orElseThrow(() -> new CustomException("평점 통계 정보를 찾을 수 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR));
        avg.setRating_count(newCount);
        avg.setAvg_score(newAvg);
        avgRatingRepository.save(avg);

        // 성공 응답 반환
        return ResponseData.res(HttpStatus.OK, "평점 삭제 성공");
    }
}

