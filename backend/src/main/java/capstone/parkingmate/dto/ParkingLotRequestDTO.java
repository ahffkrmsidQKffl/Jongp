package capstone.parkingmate.dto;

import lombok.Getter;

@Getter
public class ParkingLotRequestDTO {
    private String name;
    private String address;
    private int fee;
    private double latitude;
    private double longitude;

    private int extraFee;
}
