package capstone.parkingmate.dto;

import capstone.parkingmate.enums.PreferredFactor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UsersResponseDTO {

    private long user_id;
    private String email;
    private String nickname;
    private LocalDateTime created_at;
    private PreferredFactor preferred_factor;
}