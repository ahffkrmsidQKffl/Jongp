package capstone.parkingmate.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ParkingLotAllResponseDTO {
    private Long p_id;
    private String name;
    private double score;
    private double latitude;
    private double longitude;
}
