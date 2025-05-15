package capstone.parkingmate.repository;

import capstone.parkingmate.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    @Query("""
           SELECT COALESCE(AVG(r.score),0), COUNT(r)
           FROM Rating r
           WHERE r.parkingLot.p_id = :pId
           """)
    Object[] findAvgAndCountByParkingLot(@Param("pId") Long pId);
}
