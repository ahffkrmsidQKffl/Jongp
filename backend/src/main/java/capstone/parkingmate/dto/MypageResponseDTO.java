package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MypageResponseDTO {

    private String email;
    private String nickname;
    private String preferred_factor;
}
