package capstone.parkingmate.repository;

import capstone.parkingmate.entity.ParkingLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ParkingLotRepository extends JpaRepository<ParkingLot, Long> {
    @Query(
            value = "SELECT * FROM parking_lot WHERE name LIKE %:keyword% OR address LIKE %:keyword%",
            nativeQuery = true
    )
    List<ParkingLot> findByKeyword(@Param("keyword") String keyword);
}
