package capstone.parkingmate.service;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.entity.Rating;
import capstone.parkingmate.entity.User;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.ParkingLotRepository;
import capstone.parkingmate.repository.RatingRepository;
import capstone.parkingmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final RatingRepository ratingRepository;

    // 사용자 리스트 조회
    public List<UsersResponseDTO> retrieve_users() {
        List<User> datas = userRepository.findAll();

        List<UsersResponseDTO> responseDTOS = new ArrayList<>();

        // 스트림 사용으로 변경하기
        for(User data : datas) {
            UsersResponseDTO responseDTO = new UsersResponseDTO();

            responseDTO.setUser_id(data.getUser_id());
            responseDTO.setEmail(data.getEmail());
            responseDTO.setNickname(data.getNickname());
            responseDTO.setPreferred_factor(data.getPreferred_factor());
            responseDTO.setCreated_at(data.getCreated_at());
            
            responseDTOS.add(responseDTO);
        }

        // 로깅
        log.info("200 : 정상 처리, 관리자용 주차장 목록 조회 성공");

        return responseDTOS;
    }

    // 사용자 정보 삭제
    public void delete_user(String user_id) {

        User data = userRepository.findById(Long.valueOf(user_id))
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        userRepository.delete(data);

        // 로깅
        log.info("200 : 정상 처리, 사용자 삭제 성공");
    }


    // 주차장 리스트 조회
    public List<ParkingLotResponseDTO> retrieve_parkingLots() {
        List<ParkingLot> datas = parkingLotRepository.findAll();

        List<ParkingLotResponseDTO> responseDTOS = new ArrayList<>();

        // 스트림 사용으로 변경하기
        for(ParkingLot data : datas) {
            ParkingLotResponseDTO responseDTO = new ParkingLotResponseDTO();

            responseDTO.setP_id(data.getP_id());
            responseDTO.setName(data.getName());
            responseDTO.setAddress(data.getAddress());
            responseDTO.setFee(data.getFee());
            responseDTO.setLatitude(data.getLatitude());
            responseDTO.setLongitude(data.getLongitude());
            if(data.getAvgRating() == null) {
                responseDTO.setAvg_rating(0.0);
            } else {
                responseDTO.setAvg_rating(data.getAvgRating().getAvg_score());
            }

            responseDTOS.add(responseDTO);
        }

        // 로깅
        log.info("200 : 정상 처리, 관리자용 주차장 목록 조회 성공");

        return responseDTOS;
    }


    // 주차장 정보 등록
    public void register(ParkingLotRequestDTO requestDTO) {

        // 주차장 중복 여부 확인
        if(parkingLotRepository.existsByName(requestDTO.getName())) {
            //로깅
            log.error("409 : 중복 리소스 에러, {} 은 이미 존재합니다.", requestDTO.getName());

            //409 CONFLICT(중복 리소스) 에러 응답
            throw new CustomException("이미 등록된 주차장입니다.", HttpStatus.CONFLICT);

        }

        // 주차장 엔티티 생성
        ParkingLot parkingLot = new ParkingLot();
        parkingLot.setName(requestDTO.getName());
        parkingLot.setAddress(requestDTO.getAddress());
        parkingLot.setFee(requestDTO.getFee());
        parkingLot.setLatitude(requestDTO.getLatitude());
        parkingLot.setLongitude(requestDTO.getLongitude());

        // 사용자 디비 저장
        parkingLotRepository.save(parkingLot);

        // 로깅
        log.info("201 : 정상 처리, {} 정보 등록 완료", requestDTO.getName());
    }


    // 주차장 정보 수정
    public void update(ParkingLotUpdateRequestDTO updateRequestDTO) {
        
        // 주차장 데이터 가져오기
        ParkingLot data = parkingLotRepository.findById(updateRequestDTO.getP_id())
                .orElseThrow(() -> new CustomException("주차장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        
        
        // 정보 수정
        data.setName(updateRequestDTO.getName());
        data.setAddress(updateRequestDTO.getAddress());
        data.setFee(updateRequestDTO.getFee());
        data.setLatitude(updateRequestDTO.getLatitude());
        data.setLongitude(updateRequestDTO.getLongitude());
        
        // 데이터 저장
        parkingLotRepository.save(data);
        
        // 로깅
        log.info("200 : 정상 처리, {} 정보 수정 완료", updateRequestDTO.getName());
    }


    // 주차장 정보 삭제
    public void delete_parkingLot(String p_id) {
        ParkingLot data = parkingLotRepository.findById(Long.valueOf(p_id))
                .orElseThrow(() -> new CustomException("주차장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        parkingLotRepository.delete(data);

        // 로깅
        log.info("200 : 정상 처리, {} 정보 삭제 성공", data.getName());
    }


    // 평점 리스트 조회
    public List<RatingResponseDTO> retrieve_ratings() {
        List<Rating> datas = ratingRepository.findAll();

        List<RatingResponseDTO> responseDTOS = new ArrayList<>();

        // 스트림 사용으로 변경하기
        for(Rating data : datas) {
            RatingResponseDTO responseDTO = new RatingResponseDTO();

            responseDTO.setRating_id(data.getRating_id());
            responseDTO.setUser_name(data.getUser().getNickname());
            responseDTO.setP_name(data.getParkingLot().getName());
            responseDTO.setCreated_at(data.getCreated_at());
            responseDTO.setScore(data.getScore());

            responseDTOS.add(responseDTO);
        }

        // 로깅
        log.info("200 : 정상 처리, 관리자용 평점 목록 조회 성공");

        return responseDTOS;
    }

    // 평점 삭제
    public void delete_rating(String rating_id) {
        Rating data = ratingRepository.findById(Long.valueOf(rating_id))
                .orElseThrow(() -> new CustomException("평점 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        ratingRepository.delete(data);

        // 로깅
        log.info("200 : 정상 처리, 평점 {} 삭제 성공", data.getRating_id());
    }
}
