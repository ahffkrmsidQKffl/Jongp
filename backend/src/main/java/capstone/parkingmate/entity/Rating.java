package capstone.parkingmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "rating")
public class Rating {

    // 평점 아이디
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rating_id;

    // 평점
    @Column(nullable = false)
    private Double score;

    // 평점 작성일
    private LocalDateTime created_at = LocalDateTime.now();

    // 평점 작성 사용자
    @ManyToOne(fetch = FetchType.LAZY) // 지연 로딩: 필요할 때만 User 객체 가져옴
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 평점을 남긴 주차장
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "p_id", nullable = false)
    private ParkingLot parkingLot;

}
