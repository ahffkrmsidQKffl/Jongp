package capstone.parkingmate.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ParkingLotNearbyResponseDTO {

    private String name;
    private double recommendationScore;
}
