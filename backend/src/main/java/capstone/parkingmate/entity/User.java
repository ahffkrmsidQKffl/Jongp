package capstone.parkingmate.entity;

import capstone.parkingmate.enums.PreferredFactor;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long user_id;

    // 이메일. 공백 불가능. 중복 불가능
    @Column(nullable = false, unique = true)
    private String email;

    // 비밀번호. 공백 불가능.
    @Column(nullable = false)
    private String password;
    
    // 닉네임. 공백 불가능, 중복 가능
    @Column(nullable = false)
    private String nickname;

    // 사용자 선호 변수
    @Enumerated(EnumType.STRING)
    private PreferredFactor preferred_factor;

    // 사용자 계정 생성일
    private LocalDateTime created_at = LocalDateTime.now();
    
    // 사용자 계정 수정일
    private LocalDateTime updated_at = LocalDateTime.now();

    // 사용자의 북마크 목록
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Bookmark> bookmarks;

    // 사용자의 평점 목록
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Rating> ratings;

    // 엔티티가 처음 저장될 때 실행
    @PrePersist
    protected void onCreate() {
        this.created_at = LocalDateTime.now();
        this.updated_at = LocalDateTime.now();
    }

    // 엔티티가 수정될 때 실행
    @PreUpdate
    protected void onUpdate() {
        this.updated_at = LocalDateTime.now();
    }
}
