package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParkingLotAllRequestDTO {
    private double latitude;
    private double longitude;
    private int weekday;
    private int hour;
}
