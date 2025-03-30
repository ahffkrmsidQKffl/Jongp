package capstone.parkingmate.security;

import capstone.parkingmate.entity.User;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if(user == null) {
            throw new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        return new CustomUserDetails(user);
    }
}
