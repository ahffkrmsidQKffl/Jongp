package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParkingLotNearbyRequestDTO {
    private double latitude; //사용자 현재 위도
    private double longitude; // 사용자 현재 경도
    private int weekday; //사용자가 방문할 요일(0:월 ~ 6:일)
    private int hour; //사용자가 방문할 시간(0~23)
}
