package capstone.parkingmate.service;

import capstone.parkingmate.dto.SearchResponseDTO;
import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.entity.ParkingLotAvgRating;
import capstone.parkingmate.repository.ParkingLotAvgRatingRepository;
import capstone.parkingmate.repository.ParkingLotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;

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
