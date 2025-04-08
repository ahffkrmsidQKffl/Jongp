package capstone.parkingmate.controller;

import capstone.parkingmate.dto.DetailResponseDTO;
import capstone.parkingmate.dto.ResponseData;
import capstone.parkingmate.dto.SearchResponseDTO;
import capstone.parkingmate.service.ParkingLotService;
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
