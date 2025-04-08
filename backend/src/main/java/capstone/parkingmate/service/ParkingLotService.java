package capstone.parkingmate.service;

import capstone.parkingmate.dto.DetailResponseDTO;
import capstone.parkingmate.dto.SearchResponseDTO;
import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.ParkingLotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;

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

        return responseDTOS;
    }
}
