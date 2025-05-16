package capstone.parkingmate.repository;

import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.entity.ParkingLotAvgRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface ParkingLotAvgRatingRepository extends JpaRepository<ParkingLotAvgRating, Long> {
    Optional<ParkingLotAvgRating> findByParkingLotPId;


}
