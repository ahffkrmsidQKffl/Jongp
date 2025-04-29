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

    // 평점 수정일
    private LocalDateTime updated_at = LocalDateTime.now();

    // 평점 작성 사용자
    @ManyToOne(fetch = FetchType.LAZY) // 지연 로딩: 필요할 때만 User 객체 가져옴
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 평점을 남긴 주차장
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "p_id", nullable = false)
    private ParkingLot parkingLot;

    // 엔티티가 처음 저장될 때 작성일과 수정일을 현재 시간으로 설정
    @PrePersist
    protected void onCreate() {
        this.created_at = LocalDateTime.now();
        this.updated_at = LocalDateTime.now();
    }

    // 엔티티가 업데이트될 때 수정일을 현재 시간으로 갱신
    @PreUpdate
    protected void onUpdate() {
        this.updated_at = LocalDateTime.now();
    }

}
