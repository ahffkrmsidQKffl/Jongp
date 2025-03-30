package capstone.parkingmate.controller;

import capstone.parkingmate.dto.ResponseData;
import capstone.parkingmate.dto.SearchResponseDTO;
import capstone.parkingmate.service.ParkingLotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/parking-lots")
public class ParkingLotController {

    private final ParkingLotService parkingLotService;

    
    // 주차장 검색
    @GetMapping("/search")
    public ResponseEntity<ResponseData<List<SearchResponseDTO>>> search(@RequestParam("keyword") String keyword) {

        List<SearchResponseDTO> responseDTOS = parkingLotService.search(keyword);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "주차장 검색 성공", responseDTOS));
    }
}
