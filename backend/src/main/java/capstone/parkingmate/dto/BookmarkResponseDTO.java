package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookmarkResponseDTO {
    private Long p_id;      // 주차장 ID
    private String name;    // 주차장 이름
    private String address; // 주차장 주소
    private Integer fee;    // 주차장 요금
    private Double avg_rating; // 주차장 평균 평점
}
