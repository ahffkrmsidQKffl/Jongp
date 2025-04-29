package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RatingUpdateRequestDTO {
    private Long rating_id; // 수정할 평점 ID
    private Double rating;   // 수정할 평점 점수
}
