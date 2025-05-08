package capstone.parkingmate.config;

import capstone.parkingmate.handler.CustomAccessDeniedHandler;
import capstone.parkingmate.handler.CustomAuthenticationEntryPoint;
import capstone.parkingmate.repository.UserRepository;
import capstone.parkingmate.security.CustomUserDetailsService;
import capstone.parkingmate.security.JsonUsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;

    // 세션을 통한 SecurityContext 유지
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(authProvider);
    }

    //시큐리티 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception{

        JsonUsernamePasswordAuthenticationFilter jsonAuthFilter = new JsonUsernamePasswordAuthenticationFilter(authenticationManager(), userRepository);

        // JSON 로그인 필터 추가
        http.addFilterBefore(jsonAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        // CSRF 비활성화
        http.csrf(csrf -> csrf.disable());

        // HTTP 요청 권한 관련
        http.authorizeHttpRequests(auth -> auth
                // 🔓 여기에 정적 리소스 접근 허용 추가
                .requestMatchers(
                        "/",
                        "/index.html",
                        "/vite.svg",
                        "/seoul-outline.geojson",
                        "/mockServiceWorker.js",
                        "/assets/**",
                        "/favicon.ico"
                ).permitAll()

                // 🔓 이미 허용한 API들
                .requestMatchers("/api/users/register", "/api/users/login", "/api/users/logout").permitAll()

                // 🔐 나머지 모든 요청은 인증 필요
                .anyRequest().authenticated()
        );

        // HTTP Basic 인증 방식 비활성화
        http.httpBasic(httpBasic -> httpBasic.disable());

        // 폼 로그인 비활성화 -> REST API 사용
        http.formLogin(form -> form.disable());

        // 시큐리티 로그아웃
        http.logout(logout -> logout
                // 로그아웃 URL
                .logoutUrl("/api/users/logout")
                
                // 로그아웃 기능 수행 로직
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");

                    // 로깅
                    log.info("200 : 로그아웃 성공");
                    
                    // 로그아웃 응답 객체 작성
                    response.getWriter().write("{\"status\": 200, \"message\": \"로그아웃 성공\", \"data\": null}");
                    response.setStatus(HttpServletResponse.SC_OK);
                })
                // 세션 무효화
                .invalidateHttpSession(true)
                // 쿠키 삭제
                .deleteCookies("JSESSIONID")
        );

        // 사용자가 하나의 세션만 유지하도록 설정
        http.sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) // 세션이 필요할 때만 생성. 순서 바뀌면 에러남
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
        ).securityContext(securityContext -> securityContext
                .securityContextRepository(securityContextRepository())
        );

        // 예외 처리
        http.exceptionHandling(handler -> handler
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
        );

        return http.build();
    }
    
    // 비밀번호 암호화
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
