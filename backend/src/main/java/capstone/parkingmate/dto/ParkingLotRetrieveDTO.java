package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParkingLotRetrieveDTO {
    private Long p_id;
    private String name;
    private double latitude;
    private double longitude;
}