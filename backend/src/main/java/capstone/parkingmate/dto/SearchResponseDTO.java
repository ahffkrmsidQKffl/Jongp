package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SearchResponseDTO {

    // 이 객체 안에 리스트를 넣을지
    // 이 객체를 리스트로 만들어 응답할지 고민. <- 우선 이 방법 사용

    private Long p_id;
    private String name;
    private String address;
    private Double rating;
    private Integer fee;
    private Integer extraFee;
}
