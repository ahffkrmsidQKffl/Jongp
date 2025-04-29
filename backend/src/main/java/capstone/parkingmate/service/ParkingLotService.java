package capstone.parkingmate.service;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.entity.User;
import capstone.parkingmate.enums.PreferredFactor;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.ParkingLotRepository;
import capstone.parkingmate.repository.UserRepository;
import capstone.parkingmate.util.AiModuleCaller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;
    private final AiModuleCaller aiModuleCaller;
    private final UserRepository userRepository;

    // 현재 위치 기반 추천 주차장
    public List<ParkingLotNearbyResponseDTO> recommendNearby(Long user_id, ParkingLotNearbyRequestDTO requestDTO) {

        // 후보 리스트 추출
        List<ParkingLot> nearbyLots = parkingLotRepository.findWithinRadius(requestDTO.getLatitude(), requestDTO.getLongitude(), 500.0);

        // 후보 리스트가 없을 경우 빈 리스트 반환
        if(nearbyLots.isEmpty()) {
            return Collections.emptyList();
        }
        
        // ai 모듈에 넘길 데이터 가공
        List<Map<String, Object>> aiInput = nearbyLots.stream()
                .map(lot -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("p_id", lot.getName());
                    map.put("review", lot.getAvgRating() != null ? lot.getAvgRating().getAvg_score() : 0.0);
                    map.put("weekday", requestDTO.getWeekday());
                    map.put("hour", requestDTO.getHour());
                    return map;
                })
                .collect(Collectors.toList());

        System.out.println("aiInput = " + aiInput);

        // ai 모듈 호출
        List<Map<String, Object>> aiResults = aiModuleCaller.callAiModule(aiInput, requestDTO.getLatitude(), requestDTO.getLongitude());

        // 사용자 선호 요소 호출
        User user = userRepository.findById(user_id)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        String preferred;
        if(user.getPreferred_factor().equals(PreferredFactor.FEE)) {
            preferred = "요금우선";
        } else if (user.getPreferred_factor().equals(PreferredFactor.DISTANCE)) {
            preferred = "거리우선";
        } else if (user.getPreferred_factor().equals(PreferredFactor.RATING)) {
            preferred = "리뷰우선";
        } else {
            preferred = "혼잡도우선";
        }

        List<ParkingLotNearbyResponseDTO> result = aiResults.stream()
                .map(entry -> ParkingLotNearbyResponseDTO.builder()
                        .name((String) entry.get("주차장명"))
                        .recommendationScore((Double) entry.get(preferred))
                        .build())
                .sorted((a,b) -> Double.compare(b.getRecommendationScore(), a.getRecommendationScore())) // 추천점수가 높은 순서로 정렬
                .collect(Collectors.toList());

        System.out.println("result = " + result);

        return result;
    }

    // 주차장 상세정보
    public DetailResponseDTO detail(String p_id) {

        // 주차장 데이터 가져오기
        ParkingLot data = parkingLotRepository.findById(Long.valueOf(p_id))
                .orElseThrow(() -> new CustomException("주차장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND) );
        
        // 응답 객체 생성
        DetailResponseDTO responseDTO = new DetailResponseDTO();
        responseDTO.setP_id(data.getP_id());
        responseDTO.setName(data.getName());
        responseDTO.setAddress(data.getAddress());
        responseDTO.setFee(data.getFee());
        responseDTO.setLatitude(data.getLatitude());
        responseDTO.setLongitude(data.getLongitude());
        if(data.getAvgRating() == null) {
            responseDTO.setAvg_score(0.0);
        } else {
            responseDTO.setAvg_score(data.getAvgRating().getAvg_score());
        }

        // 로깅
        log.info("200 : 정상 처리, 주차장 {} 상세정보 성공", p_id);
        
        return responseDTO;
    }

    // 주차장 검색
    public List<SearchResponseDTO> search(String keyword) {
        // 키워드 포함 주차장 데이터 가져오기
        List<ParkingLot> datas = parkingLotRepository.findByKeyword(keyword);
        List<SearchResponseDTO> responseDTOS = new ArrayList<>();

        // 이 방식 말고 레포에서 데이터 가져올 때 SearchResponseDTO 필드들로만 구성된 컬럼만 가져오는 방법도 고려해보기
        // 응답 객체 생성. 코드 개선하기!! 너무 지저분함. - 스트림 사용
        for(ParkingLot data : datas) {
            SearchResponseDTO responseDTO = new SearchResponseDTO();

            responseDTO.setP_id(data.getP_id());
            responseDTO.setName(data.getName());
            responseDTO.setAddress(data.getAddress());
            responseDTO.setFee(data.getFee());
            if(data.getAvgRating() == null) {
                responseDTO.setRating(0.0);
            } else {
                responseDTO.setRating(data.getAvgRating().getAvg_score());
            }
            responseDTOS.add(responseDTO);
        }

        // 로깅
        log.info("200 : 정상 처리, 주차장 검색 성공");

        return responseDTOS;
    }
}
