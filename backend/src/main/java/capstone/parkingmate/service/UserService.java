package capstone.parkingmate.service;

import capstone.parkingmate.dto.*;
import capstone.parkingmate.entity.User;
import capstone.parkingmate.enums.PreferredFactor;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 회원가입
    public void register(UserDTO userDTO) {

        // 이메일 중복 여부 확인
        if(userRepository.existsByEmail(userDTO.getEmail())) {
            //로깅
            log.error("409 : 중복 리소스 에러, 사용자 {} 이메일은 이미 존재합니다.", userDTO.getEmail());

            //409 CONFLICT(중복 리소스) 에러 응답
            throw new CustomException("이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT);

        }

        // 사용자 엔티티 생성
        User user = new User();
        user.setEmail(userDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setNickname(userDTO.getNickname());
        user.setPreferred_factor(PreferredFactor.valueOf(userDTO.getPreferred_factor()));

        // 사용자 디비 저장
        userRepository.save(user);

        // 로깅
        log.info("200 : 정상 처리, 사용자 {} 회원가입 완료", userDTO.getEmail());
    }

    // 로그인
    public void login(LoginDTO loginDTO, HttpServletRequest request) {

        User user = userRepository.findByEmail(loginDTO.getEmail());

        // 이메일 존재 여부 확인
        if(!userRepository.existsByEmail(loginDTO.getEmail())) {
            // 로깅
            log.error("404 : 리소스 없음, 사용자 {} 이메일은 가입되지 않은 이메일입니다.", loginDTO.getEmail());

            // 404 NOTFOUND 에러 응답
            throw new CustomException("가입되지 않은 이메일입니다.", HttpStatus.NOT_FOUND);
        }

        // 비밀번호 일치 여부 확인
        if(!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            // 401 UNAUTHORIZED 에러 응답
            throw new CustomException("비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED);
        }

        // 로그인 처리
        HttpSession session = request.getSession(true);
        session.setAttribute("user_id", user.getUser_id());

        // 로깅
        log.info("200 : 정상 처리, 사용자 {} 로그인 성공", user.getEmail());
    }

    // 비밀번호 재설정
    public void password(PasswordDTO passwordDTO, HttpServletRequest request) {

        // 세션 정보 가져오기
        HttpSession session = request.getSession(false);

        // 세션 정보가 없거나 사용자를 찾을 수 없을 경우
        if(session == null || session.getAttribute("user_id") == null) {
            // 404 NOTFOUND 에러 응답
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        // 사용자 데이터 가져오기
        Long user_id = (Long) session.getAttribute("user_id");
        User user = userRepository.findById(user_id)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND) );

        // 현재 비밀번호 일치 여부
        if(!passwordEncoder.matches(passwordDTO.getCurrent_password(), user.getPassword())) {
            // 401 UNAUTHORIZED 에러 응답
            throw new CustomException("현재 비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED);
        }

        // 비밀번호 변경
        user.setPassword(passwordEncoder.encode(passwordDTO.getNew_password()));

        // 변경된 사용자 정보 저장
        userRepository.save(user);

        // 로깅
        log.info("200 : 정상 처리, 사용자 {} 비밀번호 재설정 성공", user.getEmail());

    }

    // 회원탈퇴
    public void delete(HttpServletRequest request) {

        // 세션 정보 가져오기
        HttpSession session = request.getSession(false);

        // 세션 정보가 없거나 사용자를 찾을 수 없을 경우
        if(session == null || session.getAttribute("user_id") == null) {
            // 404 NOTFOUND 에러 응답
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        // 사용자 데이터 가져오기
        Long user_id = (Long) session.getAttribute("user_id");
        User user = userRepository.findById(user_id)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 사용자 데이터 삭제
        userRepository.delete(user);

        // 로깅
        log.info("200 : 정상 처리, 사용자 {} 탈퇴 성공", user.getEmail());

        // 세션 무효화
        session.invalidate();
    }

    // 마이페이지 조회
    public MypageResponseDTO mypage(HttpServletRequest request) {

        // 세션 정보 가져오기
        HttpSession session = request.getSession(false);

        // 세션 정보가 없거나 사용자를 찾을 수 없을 경우
        if(session == null || session.getAttribute("user_id") == null) {
            // 404 NOTFOUND 에러 응답
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        // 사용자 데이터 가져오기
        Long user_id = (Long) session.getAttribute("user_id");
        User user = userRepository.findById(user_id)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // response 객체 생성
        MypageResponseDTO responseDTO = new MypageResponseDTO();

        responseDTO.setEmail(user.getEmail());
        responseDTO.setNickname(user.getNickname());
        responseDTO.setPreferred_factor(String.valueOf(user.getPreferred_factor()));

        // 로깅
        log.info("200 : 사용자 {} 마이페이지 조회 성공", user.getEmail());

        return responseDTO;
    }

    // 마이페이지 수정
    public void mypage_update(MypageRequestDTO mypageRequestDTO, HttpServletRequest request) {

        // 세션 정보 가져오기
        HttpSession session = request.getSession(false);

        // 세션 정보가 없거나 사용자를 찾을 수 없을 경우
        if(session == null || session.getAttribute("user_id") == null) {
            // 404 NOTFOUND 에러 응답
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        // 사용자 데이터 가져오기
        Long user_id = (Long) session.getAttribute("user_id");
        User user = userRepository.findById(user_id)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 정보 수정
        user.setNickname(mypageRequestDTO.getNickname());
        user.setPreferred_factor(PreferredFactor.valueOf(mypageRequestDTO.getPreferred_factor()));

        // 수정된 사용자 데이터 저장
        userRepository.save(user);

        // 로깅
        log.info("200 : 사용자 {} 마이페이지 수정 성공", user.getEmail());
    }
}
