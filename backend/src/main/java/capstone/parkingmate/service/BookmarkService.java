package capstone.parkingmate.service;

import capstone.parkingmate.dto.BookmarkRequestDTO;
import capstone.parkingmate.dto.BookmarkResponseDTO;
import capstone.parkingmate.dto.ResponseData;
import capstone.parkingmate.entity.Bookmark;
import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.entity.User;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.BookmarkRepository;
import capstone.parkingmate.repository.ParkingLotRepository;
import capstone.parkingmate.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;

    // 북마크 조회
    @Transactional(readOnly = true)
    public ResponseData<?> getBookmarks(HttpServletRequest request) {
        // 1. 세션에서 user_id 가져오기
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
        Long userId = (Long) session.getAttribute("user_id");

        // 2. User 엔티티 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 북마크 리스트 가져오기
        List<Bookmark> bookmarks = user.getBookmarks();

        // 3. 엔티티 -> DTO 변환
        List<BookmarkResponseDTO> bookmarkDTOs = bookmarks.stream()
                .map(bookmark -> {
                    BookmarkResponseDTO dto = new BookmarkResponseDTO();
                    dto.setP_id(bookmark.getParkingLot().getP_id());
                    dto.setName(bookmark.getParkingLot().getName());
                    dto.setAddress(bookmark.getParkingLot().getAddress());
                    dto.setFee(bookmark.getParkingLot().getFee());
                    return dto;
                })
                .toList();

        // 4. 응답 반환
        return ResponseData.res(HttpStatus.OK, "북마크 조회 성공", bookmarkDTOs);
    }

    // 북마크 등록
    @Transactional
    public ResponseData<?> addBookmark(BookmarkRequestDTO bookmarkRequestDTO, HttpServletRequest request) {
        // 1. 세션에서 user_id 가져오기
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
        Long userId = (Long) session.getAttribute("user_id");

        // 2. 사용자와 주차장 찾기
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        ParkingLot parkingLot = parkingLotRepository.findById(bookmarkRequestDTO.getP_id())
                .orElseThrow(() -> new CustomException("주차장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 3. 이미 등록된 북마크인지 확인
        boolean alreadyExists = user.getBookmarks().stream()
                .anyMatch(b -> b.getParkingLot().getP_id().equals(parkingLot.getP_id()));

        if (alreadyExists) {
            throw new CustomException("이미 북마크에 등록된 주차장입니다.", HttpStatus.CONFLICT);
        }

        // 4. 북마크 저장
        Bookmark bookmark = new Bookmark();
        bookmark.setUser(user);
        bookmark.setParkingLot(parkingLot);
        bookmarkRepository.save(bookmark);

        // 5. 응답 반환
        return ResponseData.res(HttpStatus.CREATED, "북마크 등록 성공");
    }

    // 북마크 삭제
    @Transactional
    public ResponseData<?> deleteBookmark(Long id, HttpServletRequest request) {
        // 1. 세션에서 user_id 가져오기
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
        Long userId = (Long) session.getAttribute("user_id");

        // 2. 북마크 조회
        Bookmark bookmark = bookmarkRepository.findById(id)
                .orElseThrow(() -> new CustomException("북마크를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 3. 본인이 등록한 북마크인지 확인
        if (!bookmark.getUser().getUser_id().equals(userId)) {
            throw new CustomException("본인이 등록한 북마크만 삭제할 수 있습니다.", HttpStatus.FORBIDDEN);
        }

        // 4. 삭제
        bookmarkRepository.delete(bookmark);

        // 5. 응답 반환
        return ResponseData.res(HttpStatus.OK, "북마크 삭제 성공");
    }
}
