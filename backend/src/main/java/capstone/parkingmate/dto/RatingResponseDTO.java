package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RatingResponseDTO {
    private long rating_id;
    private String user_name;
    private String p_name;
    private double score;
    private LocalDateTime created_at;
}
