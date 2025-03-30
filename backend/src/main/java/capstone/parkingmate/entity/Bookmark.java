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
@Table(name = "bookmark")
public class Bookmark {

    // 북마크 아이디
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookmark_id;

    // 북마크 생성일
    private LocalDateTime created_at = LocalDateTime.now();

    // 북마크 등록한 사용자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 북마크 등록 주차장
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "p_id", nullable = false)
    private ParkingLot parkingLot;
}
