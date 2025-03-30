package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SearchResponseDTO {

    private Long p_id;
    private String name;
    private String address;
    private Double rating;
    private Integer fee;
}
