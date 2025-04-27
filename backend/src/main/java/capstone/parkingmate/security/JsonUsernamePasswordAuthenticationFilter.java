package capstone.parkingmate.security;

import capstone.parkingmate.dto.ResponseData;
import capstone.parkingmate.entity.User;
import capstone.parkingmate.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
public class JsonUsernamePasswordAuthenticationFilter extends AbstractAuthenticationProcessingFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserRepository userRepository;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public JsonUsernamePasswordAuthenticationFilter(AuthenticationManager authenticationManager, UserRepository userRepository) {
        super("/api/users/login"); // 로그인 엔드포인트 지정
        this.userRepository = userRepository;
        setAuthenticationManager(authenticationManager);
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException, IOException, ServletException {

        if (!request.getContentType().equals("application/json")) {
            throw new IllegalArgumentException("지원되지 않는 요청 형식입니다.");
        }

        Map<String, String> requestBody = objectMapper.readValue(request.getInputStream(), Map.class);
        String email = requestBody.get("email");
        String password = requestBody.get("password");

        log.info("로그인 시도 - 이메일: {}", email);

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(email, password);

        return getAuthenticationManager().authenticate(authToken);
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain chain, Authentication authResult)
            throws IOException, ServletException {

        log.info("200 : 정상처리, 사용자 {} 로그인 성공", authResult.getName());

        // 사용자 데이터 가져오기
        User user = userRepository.findByEmail(authResult.getName());

        // 로그인 처리
        HttpSession session = request.getSession(true);
        session.setAttribute("user_id", user.getUser_id());

        // 관리자 여부 확인
        boolean admin = authResult.getName().equals("admin");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("status", 200);
        responseData.put("message", "로그인 성공");

        Map<String, Object> data = new HashMap<>();
        data.put("admin", admin);

        responseData.put("data", data);

        // SecurityContext 생성 및 저장
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authResult);
        SecurityContextHolder.setContext(securityContext);

        // SecurityContext를 세션에 저장
        securityContextRepository.saveContext(securityContext, request, response);

        // 한글 깨지지 않도록 인코딩 설정
        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        response.setStatus(HttpServletResponse.SC_OK);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed)
            throws IOException, ServletException {

        log.info("401 : 인증 실패, 로그인 실패: {}", failed.getMessage());

        // 한글 깨지지 않도록 인코딩 설정
        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("{\"status\": 401,\"message\": \"로그인 실패\",\"data\": null}");
        response.getWriter().flush();
    }
}
