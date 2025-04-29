package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RatingRequestDTO {
    private Long p_id;    // 주차장 ID
    private Double score; // 평점 점수
}
