package capstone.parkingmate.controller;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<ResponseData<?>> register(@RequestBody UserDTO userDTO) {

        userService.register(userDTO);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.CREATED, "회원 가입 성공"));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<ResponseData<?>> login(@RequestBody LoginDTO loginDTO, HttpServletRequest request) {

        userService.login(loginDTO, request);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "로그인 성공"));
    }

    // 비밀번호 재설정
    @PatchMapping("/password")
    public ResponseEntity<ResponseData<?>> password(@RequestBody PasswordDTO passwordDTO, HttpServletRequest request) {

        userService.password(passwordDTO, request);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "비밀번호 재설정 성공"));
    }

    // 회원탈퇴
    @DeleteMapping()
    public ResponseEntity<?> delete(HttpServletRequest request) {

        userService.delete(request);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "회원탈퇴 성공"));
    }

    // 마이페이지 조회
    @GetMapping("/mypage")
    public ResponseEntity<ResponseData<MypageResponseDTO>> mypage(HttpServletRequest request) {

        MypageResponseDTO responseDTO = userService.mypage(request);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "마이페이지 조회 성공", responseDTO));
    }

    // 마이페이지 수정
    @PatchMapping("/mypage")
    public ResponseEntity<ResponseData<?>> mypage_update(@RequestBody MypageRequestDTO mypageRequestDTO, HttpServletRequest request) {

        userService.mypage_update(mypageRequestDTO, request);

        return ResponseEntity.ok(ResponseData.res(HttpStatus.OK, "마이페이지 수정 성공"));
    }
}
