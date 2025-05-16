package capstone.parkingmate.service;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.entity.*;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.*;
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
    private final ParkingLotAvgRatingRepository avgRatingRepository;
    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final UserService userService;

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

        // 2) AvgRating 갱신
        ParkingLotAvgRating avg = avgRatingRepository.findByParkingLot(parkingLot)
                .orElseGet(() -> {
                    ParkingLotAvgRating n = new ParkingLotAvgRating();
                    n.setParkingLot(parkingLot);
                    return n;
                });
        avg.setTotal_score(avg.getTotal_score() + dto.getScore());
        avg.setRating_count(avg.getRating_count() + 1);
        avg.setAvg_score(avg.getTotal_score() / avg.getRating_count());
        avgRatingRepository.save(avg);

        // 5. 성공 응답 반환
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

        double oldScore = rating.getScore();
        double newScore = ratingUpdateRequestDTO.getRating();

        // 4. 평점 점수 수정
        rating.setScore(newScore);

        // 2) AvgRating 갱신
        ParkingLot lot = rating.getParkingLot();
        ParkingLotAvgRating avg = avgRatingRepository.findByParkingLot(lot)
                .orElseThrow(() -> new CustomException("평점 통계 정보를 찾을 수 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR));

        avg.setTotal_score(avg.getTotal_score() - oldScore + newScore);
        // rating_count는 변동 없음
        avg.setAvg_score(avg.getTotal_score() / avg.getRating_count());
        avgRatingRepository.save(avg);

        // 6. 성공 응답 반환
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

        double score = rating.getScore();
        ParkingLot lot = rating.getParkingLot();

        // 1) AvgRating 갱신
        ParkingLotAvgRating avg = avgRatingRepository.findByParkingLot(lot)
                .orElseThrow(() -> new CustomException("평점 통계 정보를 찾을 수 없습니다.", HttpStatus.INTERNAL_SERVER_ERROR));

        avg.setTotal_score(avg.getTotal_score() - score);
        avg.setRating_count(avg.getRating_count() - 1);
        if (avg.getRating_count() > 0) {
            avg.setAvg_score(avg.getTotal_score() / avg.getRating_count());
        } else {
            avg.setAvg_score(0.0);
        }
        avgRatingRepository.save(avg);

        // 4. 평점 삭제
        ratingRepository.delete(rating);

        // 5. 성공 응답 반환
        return ResponseData.res(HttpStatus.OK, "평점 삭제 성공");
    }
}

