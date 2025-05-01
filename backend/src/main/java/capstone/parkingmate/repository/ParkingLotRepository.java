package capstone.parkingmate.repository;

import capstone.parkingmate.entity.ParkingLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingLotRepository extends JpaRepository<ParkingLot, Long> {

    ParkingLot findByName(String name);

    // 쿼리문 개선하기!!
    @Query(
            value = "SELECT * FROM parking_lot WHERE name LIKE %:keyword% OR address LIKE %:keyword%",
            nativeQuery = true
    )
    List<ParkingLot> findByKeyword(@Param("keyword") String keyword);

    boolean existsByName(String name);

    @Query(value= """
            SELECT *
            FROM parking_lot
            WHERE ST_Distance_Sphere(
            point(longitude, latitude), point(:lon, :lat)
            ) <= :radius
""",
            nativeQuery = true
    )
    List<ParkingLot> findWithinRadius(@Param("lat") double lat, @Param("lon") double lon, @Param("radius") double radiusMeters);

    @Query(value = """
            SELECT *
            FROM parking_lot
            ORDER BY ST_Distance_Sphere(
              point(longitude, latitude),
              point(:lon, :lat)
            ) ASC
            LIMIT 3
            """, nativeQuery = true)
    List<ParkingLot> findTop3ByNearest(
            @Param("lat") double latitude,
            @Param("lon") double longitude
    );
}
