package capstone.parkingmate.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
@Data
@AllArgsConstructor
public class AIRequestDTO {
    private String name;
    private double avgRating;
    private int weekday;
    private int hour;
}
