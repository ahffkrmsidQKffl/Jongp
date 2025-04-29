package capstone.parkingmate.controller;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.service.RatingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ratings")
public class RatingController {

    private final RatingService ratingService;

    // 평점 기록 조회
    @GetMapping
    public ResponseEntity<ResponseData<?>> getRatings(HttpServletRequest request) {
        return ResponseEntity.ok(ratingService.getRatings(request));
    }

    // 평점 등록
    @PostMapping
    @Transactional
    public ResponseEntity<ResponseData<?>> addRating(@RequestBody RatingRequestDTO ratingRequestDTO, HttpServletRequest request) {
        return ResponseEntity.status(201).body(ratingService.addRating(ratingRequestDTO, request));
    }

    // 평점 수정
    @PatchMapping
    @Transactional
    public ResponseEntity<ResponseData<?>> updateRating(@RequestBody RatingUpdateRequestDTO ratingUpdateRequestDTO, HttpServletRequest request) {
        return ResponseEntity.ok(ratingService.updateRating(ratingUpdateRequestDTO, request));
    }

    // 평점 삭제
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ResponseData<?>> deleteRating(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(ratingService.deleteRating(id, request));
    }
}
