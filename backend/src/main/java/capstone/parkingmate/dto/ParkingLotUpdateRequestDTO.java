package capstone.parkingmate.dto;

import lombok.Getter;

@Getter
public class ParkingLotUpdateRequestDTO {
    private long p_id;
    private String name;
    private String address;
    private int fee;

    private int extraFee;

    private double latitude;
    private double longitude;
}
