package capstone.parkingmate.repository;

import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.entity.ParkingLotAvgRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface ParkingLotAvgRatingRepository extends JpaRepository<ParkingLotAvgRating, Long> {
    @Query("SELECT r FROM ParkingLotAvgRating r WHERE r.parkingLot.p_id = :pId")
    Optional<ParkingLotAvgRating> findByParkingLotPId(@Param("pId") Long pId);


}
