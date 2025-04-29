package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RatingResponseDTO {
    private Long rating_id;           // 주차장 평점 ID
    private String user_name;       // 사용자 닉네임
    private String p_name;         // 주차장 이름
    private Double score;        // 평점 점수
    private LocalDateTime created_at;   // 생성 시간
}
