package capstone.parkingmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "parking_lot_avg_rating")
public class ParkingLotAvgRating {

    // 평균평점 아이디
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ar_id;

    @Column(nullable = false)
    // 평균 평점
    private Double avg_score = 0.0;

    // 합산 평점
    @Column(nullable = false)
    private Double total_score = 0.0;

    // 평점 개수
    @Column(nullable = false)
    private Integer rating_count = 0;

    // 주차장
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "p_id", nullable = false)
    private ParkingLot parkingLot;
}
