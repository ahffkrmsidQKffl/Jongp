package capstone.parkingmate.controller;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.service.ParkingLotService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/parking-lots")
public class ParkingLotController {

    private final ParkingLotService parkingLotService;

    // 주차장 마커
    @GetMapping()
    public ResponseEntity<ResponseData<List<ParkingLotRetrieveDTO>>> retrieve() {
        List<ParkingLotRetrieveDTO> parkingLots = parkingLotService.retrieve();

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "주차장 조회 성공", parkingLots));
    }


    // 현재 위치 기반 추천 주차장 리스트
    @PostMapping("/recommendations/nearby")
    public ResponseEntity<ResponseData<List<ParkingLotNearbyResponseDTO>>> recommendation_nearby(
            @RequestBody ParkingLotNearbyRequestDTO requestDTO, HttpSession session
    ) {
        Long user_id = (Long) session.getAttribute("user_id");
        //user_id null 값일 경우 에러 반환 코드 추가

        List<ParkingLotNearbyResponseDTO> recommendedLots = parkingLotService.recommendNearby(user_id, requestDTO);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "현재 위치 기반 추천 주차장 조회 성공", recommendedLots));
    }
    
    
    // 목적지 기반 추천 주차장 리스트
    @PostMapping("/recommendations/destination")
    public ResponseEntity<ResponseData<List<ParkingLotNearbyResponseDTO>>> recommendation_destination(
            @RequestBody ParkingLotNearbyRequestDTO requestDTO, HttpSession session
    ) {
        Long user_id = (Long) session.getAttribute("user_id");
        //user_id null 값일 경우 에러 반환 코드 추가

        List<ParkingLotNearbyResponseDTO> recommendedLots = parkingLotService.recommendNearby(user_id, requestDTO);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "목적지 기반 추천 주차장 조회 성공", recommendedLots));
    }
    
    // 주차장 상세 정보 조회
    @GetMapping("/{p_id}")
    public ResponseEntity<ResponseData<DetailResponseDTO>> detail(@PathVariable("p_id") String p_id) {

        DetailResponseDTO responseDTO = parkingLotService.detail(p_id);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "주차장 상세정보 조회 성공", responseDTO));
    }
    
    
    // 주차장 검색
    @GetMapping("/search")
    public ResponseEntity<ResponseData<List<SearchResponseDTO>>> search(@RequestParam("keyword") String keyword) {

        List<SearchResponseDTO> responseDTOS = parkingLotService.search(keyword);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "주차장 검색 성공", responseDTOS));
    }
}
