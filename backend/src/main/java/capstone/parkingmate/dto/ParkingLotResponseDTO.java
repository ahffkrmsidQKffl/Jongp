package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParkingLotResponseDTO {
    private long p_id;
    private String name;
    private String address;
    private int fee;

    private int extraFee;

    private double latitude;
    private double longitude;
    private double avg_rating;
}
