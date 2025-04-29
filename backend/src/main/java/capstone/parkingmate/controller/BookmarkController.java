package capstone.parkingmate.controller;

import capstone.parkingmate.dto.BookmarkRequestDTO;
import capstone.parkingmate.dto.ResponseData;
import capstone.parkingmate.service.BookmarkService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bookmarks")
public class BookmarkController {
    private final BookmarkService bookmarkService;

    // 북마크 조회
    @GetMapping
    public ResponseEntity<ResponseData<?>> getBookmarks(HttpServletRequest request) {
        return ResponseEntity.ok(bookmarkService.getBookmarks(request));
    }

    // 북마크 등록
    @PostMapping
    @Transactional
    public ResponseEntity<ResponseData<?>> addBookmark(@RequestBody BookmarkRequestDTO bookmarkRequestDTO, HttpServletRequest request) {
        return ResponseEntity.status(201).body(bookmarkService.addBookmark(bookmarkRequestDTO, request));
    }

    // 북마크 삭제
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ResponseData<?>> deleteBookmark(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(bookmarkService.deleteBookmark(id, request));
    }
}
