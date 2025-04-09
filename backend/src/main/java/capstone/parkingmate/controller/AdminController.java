package capstone.parkingmate.controller;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminController {

    private final AdminService adminService;

    // 회원 리스트 조회
    @GetMapping("/users")
    public ResponseEntity<ResponseData<List<UsersResponseDTO>>> retrieve_users() {

        List<UsersResponseDTO> responseDTOS = adminService.retrieve_users();

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "관리자용 사용자 목록 조회 성공", responseDTOS));
    }

    // 회원 삭제
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<ResponseData<?>> delete_user(@PathVariable("id") String id) {

        adminService.delete_user(id);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "사용자 삭제 성공"));
    }

    // 주차장 리스트 조회
    @GetMapping("/parking-lots")
    public ResponseEntity<ResponseData<List<ParkingLotResponseDTO>>> retrieve_parknigLots() {

        List<ParkingLotResponseDTO> responseDTOS = adminService.retrieve_parkingLots();

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "관리자용 주차장 리스트 조회 성공", responseDTOS));
    }

    // 주차장 정보 등록
    @PostMapping("/parking-lots")
    @Transactional
    public ResponseEntity<ResponseData<?>> register(@RequestBody ParkingLotRequestDTO requestDTO) {

        adminService.register(requestDTO);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.CREATED, "주차장 정보 등록 성공"));
    }

    // 주차장 정보 수정
    @PatchMapping("/parking-lots")
    @Transactional
    public ResponseEntity<ResponseData<?>> update(@RequestBody ParkingLotUpdateRequestDTO requestDTO) {

        adminService.update(requestDTO);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "주차장 정보 수정 성공"));
    }

    // 주차장 정보 삭제
    @DeleteMapping("/parking-lots/{id}")
    @Transactional
    public ResponseEntity<ResponseData<?>> delete_parkingLot(@PathVariable("id") String id) {

        adminService.delete_parkingLot(id);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "주차장 정보 삭제 성공"));
    }

    // 평점 리스트 조회
    @GetMapping("/ratings")
    public ResponseEntity<ResponseData<List<RatingResponseDTO>>> retrieve_ratings() {

        List<RatingResponseDTO> responseDTOS = adminService.retrieve_ratings();

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "관리자용 평점 리스트 조회 성공", responseDTOS));
    }

    // 평점 삭제
    @DeleteMapping("/ratings/{id}")
    @Transactional
    public ResponseEntity<ResponseData<?>> delete_rating(@PathVariable("id") String id) {

        adminService.delete_rating(id);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "평점 삭제 성공"));
    }
}
