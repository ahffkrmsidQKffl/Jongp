package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DetailResponseDTO {
    private String name;
    private Long p_id;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer fee;
    private Double avg_score;
}