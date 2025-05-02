package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CongestionDTO {
    private String name;
    private int total_spaces;     // TPKCT
    private int current_vehicles; // NOW_PRK_VHCL_CNT

    public CongestionDTO(String name, int total, int current) {
        this.name = name;
        this.total_spaces = total;
        this.current_vehicles = current;
    }
}