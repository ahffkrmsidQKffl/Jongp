package capstone.parkingmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "parking_lot")
public class ParkingLot {

    // 주차장 아이디
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long p_id;

    // 주차장 이름
    @Column(nullable = false)
    private String name;

    // 주차장 주소
    @Column(nullable = false)
    private String address;

    // 주차장 위도
    @Column(nullable = false)
    private Double latitude;

    // 주차장 경도
    @Column(nullable = false)
    private Double longitude;

    // 기본 요금
    @Column
    private Integer fee;

    // 추가 요금
    @Column(name="extra_fee", nullable = false)
    private Integer extraFee = 0;

    // 북마크 관계
    @OneToMany(mappedBy = "parkingLot", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Bookmark> bookmarks;

    // 평점 관계
    @OneToMany(mappedBy = "parkingLot", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Rating> ratings;

    // 평균 평점 관계
    @OneToOne(mappedBy = "parkingLot", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ParkingLotAvgRating avgRating;
}
