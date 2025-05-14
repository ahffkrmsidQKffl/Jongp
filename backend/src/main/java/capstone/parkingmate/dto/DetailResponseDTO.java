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
    
    private Integer extraFee; // 추가 요금

    private Integer total_spaces;        // 총 주차면 수
    private Integer current_vehicles;    // 현재 주차 차량 수
}
