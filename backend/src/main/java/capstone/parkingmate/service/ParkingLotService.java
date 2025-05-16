package capstone.parkingmate.service;

import capstone.parkingmate.CongestionApiParser;
import capstone.parkingmate.dto.*;
import capstone.parkingmate.entity.ParkingLot;
import capstone.parkingmate.entity.User;
import capstone.parkingmate.enums.PreferredFactor;
import capstone.parkingmate.exception.CustomException;
import capstone.parkingmate.repository.ParkingLotRepository;
import capstone.parkingmate.repository.UserRepository;
import capstone.parkingmate.util.AiModuleCaller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;
    private final AiModuleCaller aiModuleCaller;
    private final UserRepository userRepository;

    //실시간 주차장 이름 정제용 함수
    private String normalizeToLocalName(String congestionName) {
        String raw = congestionName.trim();

        if (raw.equals("마포유수지(시)")) return "마포유수지";
        if (raw.equals("명일파출소 공영주차장(시)")) return "명일동";
        if (raw.equals("적선동 주차장(시)")) return "적선동";
        if (raw.equals("반포천 공영주차장(파미에)(시)")) return "파미에(반포천)";
        if (raw.equals("종묘주차장 공영주차장(시)")) return "종묘";
        return raw.replace(" 공영주차장(시)", "").trim();
    }

    // 주차장 전체 조회
    public List<ParkingLotRetrieveDTO> retrieve() {

        List<ParkingLot> datas = parkingLotRepository.findAll();

        List<ParkingLotRetrieveDTO> responseDTOS = new ArrayList<>();

        for(ParkingLot data : datas) {
            ParkingLotRetrieveDTO responseDTO = new ParkingLotRetrieveDTO();

            responseDTO.setP_id(data.getP_id());
            responseDTO.setName(data.getName());
            responseDTO.setLatitude(data.getLatitude());
            responseDTO.setLongitude(data.getLongitude());

            responseDTOS.add(responseDTO);
        }

        return responseDTOS;
    }

    // 전체 주차장 점수 조회
    public List<ParkingLotAllResponseDTO> all_parking_lot(Long user_id, ParkingLotAllRequestDTO requestDTO) {
        List<ParkingLot> parkingLots = parkingLotRepository.findAll();

        // 혼잡도 리스트 불러오기 및 이름 정제 후 p_id 부여
        List<CongestionDTO> realtimeList = CongestionApiParser.fetchCongestionData();
        Map<String, Integer> totalMap = loadTotalSpacesFromCsv(); // 노상주차장 보정용 csv
        Map<String, Long> nameToPid = parkingLots.stream()
                .collect(Collectors.toMap(ParkingLot::getName, ParkingLot::getP_id));
        for (CongestionDTO dto : realtimeList) {
            String originalName = dto.getName();
            String normalized = normalizeToLocalName(originalName);
            Long pid = nameToPid.get(normalized);

            if (pid != null) {
                dto.setP_id(pid);
            } else {
                System.out.println("[WARN] 혼잡도 이름 매핑 실패 → 원본: " + originalName + " / 정제 후: " + normalized);
            }
        }

        // ✅ 실시간 혼잡도 대상 p_id Set 생성
        Set<Long> realtimePidSet = realtimeList.stream()
                .map(CongestionDTO::getP_id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // AI 입력 구성
        List<Map<String, Object>> aiInput = parkingLots.stream()
                .map(lot -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("p_id", lot.getName());
                    map.put("review", lot.getAvgRating() != null ? lot.getAvgRating().getAvg_score() : 0.0);
                    map.put("weekday", requestDTO.getWeekday());
                    map.put("hour", requestDTO.getHour());

                    if (realtimePidSet.contains(lot.getP_id())) {
                        Optional<CongestionDTO> matched = realtimeList.stream()
                                .filter(dto -> lot.getP_id().equals(dto.getP_id()))
                                .findFirst();

                        matched.ifPresent(dto -> {
                            int total = dto.getTotal_spaces();
                            int current = dto.getCurrent_vehicles();

                            // ✅ 총 주차면수 보정 로직
                            if (total == 1) {
                                String lotName = lot.getName().trim();
                                total = totalMap.getOrDefault(lotName, total);
                            }

                            System.out.println(">> 혼잡도 계산: current=" + current + " / total=" + total);
                            if (total > 0) {
                                double congestion = Math.min(100.0, current * 100.0 / total) / 100.0; // 혼잡도를 0~1사이의 스케일된 값으로 전달
                                map.put("congestion", congestion);
                            }
                        });
                    }

                    return map;
                })
                .collect(Collectors.toList());

        int parkingDuration = 120;

        // ai 모듈 호출
        List<Map<String, Object>> aiResults = aiModuleCaller.callAiModule(aiInput, requestDTO.getLatitude(), requestDTO.getLongitude(), parkingDuration);

        // 사용자 선호 요소 호출
        User user = userRepository.findById(user_id)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        String preferred;
        if(user.getPreferred_factor().equals(PreferredFactor.FEE)) {
            preferred = "요금우선";
        } else if (user.getPreferred_factor().equals(PreferredFactor.DISTANCE)) {
            preferred = "거리우선";
        } else if (user.getPreferred_factor().equals(PreferredFactor.RATING)) {
            preferred = "리뷰우선";
        } else {
            preferred = "혼잡도우선";
        }

        List<ParkingLotAllResponseDTO> result = aiResults.stream()
                .map(entry -> {
                    ParkingLot data = parkingLotRepository.findByName((String) entry.get("주차장명"));
                    return ParkingLotAllResponseDTO.builder()
                            .p_id(data.getP_id())
                            .latitude(data.getLatitude())
                            .longitude(data.getLongitude())
                            .name((String) entry.get("주차장명"))
                            .score((Double) entry.get(preferred))
                            .build();
                })
                .collect(Collectors.toList());

        System.out.println("result = " + result);

        return result;
    }

    // 현재 위치 기반 추천 주차장
    public List<ParkingLotNearbyResponseDTO> recommendNearby(Long user_id, ParkingLotNearbyRequestDTO requestDTO) {

        double baseLat = requestDTO.getLatitude();
        double baseLon = requestDTO.getLongitude();

        // 후보 리스트 추출
        List<ParkingLot> nearbyLots = parkingLotRepository.findTop3ByNearest(requestDTO.getLatitude(), requestDTO.getLongitude());

        // 후보 리스트가 없을 경우 빈 리스트 반환
        if(nearbyLots.isEmpty()) {
            return Collections.emptyList();
        }

        // ai 모듈에 넘길 데이터 가공
        // 혼잡도 API 호출
        List<CongestionDTO> realtimeList = CongestionApiParser.fetchCongestionData();

        // 노상주차장 보정용 csv 코드
        Map<String, Integer> totalMap = loadTotalSpacesFromCsv();

        // 이름 → p_id 매핑용 Map 생성
        Map<String, Long> nameToPid = nearbyLots.stream()
                .collect(Collectors.toMap(ParkingLot::getName, ParkingLot::getP_id));

        // 혼잡도 DTO에 p_id 세팅
        for (CongestionDTO dto : realtimeList) {
            String originalName = dto.getName();
            String normalized = normalizeToLocalName(originalName);
            Long pid = nameToPid.get(normalized);

            if (pid != null) {
                dto.setP_id(pid);
            }

//            else {
//                System.out.println("[WARN] 혼잡도 이름 매핑 실패 → 원본: " + originalName + " / 정제 후: " + normalized);
//            }
        }

        Set<Long> realtimePidSet = realtimeList.stream()
                .map(CongestionDTO::getP_id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // AI 입력 구성
        List<Map<String, Object>> aiInput = nearbyLots.stream()
                .map(lot -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("p_id", lot.getName());
                    map.put("review", lot.getAvgRating() != null ? lot.getAvgRating().getAvg_score() : 0.0);
                    map.put("weekday", requestDTO.getWeekday());
                    map.put("hour", requestDTO.getHour());

                    if (realtimePidSet.contains(lot.getP_id())) {
                        Optional<CongestionDTO> matched = realtimeList.stream()
                                .filter(dto -> lot.getP_id().equals(dto.getP_id()))
                                .findFirst();

                        matched.ifPresent(dto -> {
                            int total = dto.getTotal_spaces();
                            int current = dto.getCurrent_vehicles();

                            // ✅ 총 주차면수 보정 로직
                            if (total == 1) {
                                String lotName = lot.getName().trim();
                                total = totalMap.getOrDefault(lotName, total);
                            }

                            System.out.println(">> 혼잡도 계산: current=" + current + " / total=" + total);
                            if (total > 0) {
                                double congestion = Math.min(100.0, current * 100.0 / total)/ 100.0; // 혼잡도를 0~1사이의 스케일된 값으로 전달
                                map.put("congestion", congestion);
                            }
                        });
                    }

                    return map;
                })
                .collect(Collectors.toList());

        int parkingDuration = 120;

        // ai 모듈 호출
        List<Map<String, Object>> aiResults = aiModuleCaller.callAiModule(aiInput, requestDTO.getLatitude(), requestDTO.getLongitude(),  parkingDuration);

        System.out.println(aiResults);

        // 사용자 선호 요소 호출
        User user = userRepository.findById(user_id)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        String preferred;
        if(user.getPreferred_factor().equals(PreferredFactor.FEE)) {
            preferred = "요금우선";
        } else if (user.getPreferred_factor().equals(PreferredFactor.DISTANCE)) {
            preferred = "거리우선";
        } else if (user.getPreferred_factor().equals(PreferredFactor.RATING)) {
            preferred = "리뷰우선";
        } else {
            preferred = "혼잡도우선";
        }

        List<ParkingLotNearbyResponseDTO> result = aiResults.stream()
                .map(entry -> {
                    String name = (String) entry.get("주차장명");
                    ParkingLot data = parkingLotRepository.findByName(name);

                    // 현재 위치 - 주차장 사이 거리
                    double rawDist = haversine(baseLat, baseLon,
                            data.getLatitude(), data.getLongitude());
                    // 소수점 첫째 자리까지 반올림
                    double dist = Math.round(rawDist * 10.0) / 10.0;

                    // Object 로 꺼내서 Number 로 변환
                    Object raw = entry.get(preferred);
                    double score = 0.0;
                    if (raw instanceof Number) {
                        score = ((Number) raw).doubleValue();
                    }

                    return ParkingLotNearbyResponseDTO.builder()
                            .p_id(data.getP_id())
                            .address(data.getAddress())
                            .fee(data.getFee())
                            .name(name)
                            .recommendationScore(score)
                            .distance(dist)
                            .extraFee(data.getExtraFee())
                            .build();
                })
                .sorted((a,b) -> Double.compare(b.getRecommendationScore(), a.getRecommendationScore())) // 추천점수가 높은 순서로 정렬
                .collect(Collectors.toList());

        System.out.println("result = " + result);

        return result;
    }

    //주차장 상세 정보 조회
    public DetailResponseDTO detail(String p_id) {

        // 1. 주차장 DB 정보 조회
        ParkingLot data = parkingLotRepository.findById(Long.valueOf(p_id))
                .orElseThrow(() -> new CustomException("주차장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 2. 기본 정보 세팅
        DetailResponseDTO responseDTO = new DetailResponseDTO();
        responseDTO.setP_id(data.getP_id());
        responseDTO.setName(data.getName());
        responseDTO.setAddress(data.getAddress());
        responseDTO.setFee(data.getFee());
        responseDTO.setLatitude(data.getLatitude());
        responseDTO.setLongitude(data.getLongitude());

        responseDTO.setExtraFee(data.getExtraFee());

        if (data.getAvgRating() == null) {
            responseDTO.setAvg_score(0.0);
        } else {
            responseDTO.setAvg_score(data.getAvgRating().getAvg_score());
        }

        // ✅ 3. 혼잡도 정보 - 실시간 API
        List<CongestionDTO> congestionList = CongestionApiParser.fetchCongestionData();
        String localName = data.getName().trim();

        Integer currentVehicles = null;
        Integer totalSpaces = null;

        for (CongestionDTO congestion : congestionList) {
            String normalized = normalizeToLocalName(congestion.getName());

            if (normalized.equals(localName)) {
                currentVehicles = congestion.getCurrent_vehicles();
                totalSpaces = congestion.getTotal_spaces();
                break;
            }
        }

        responseDTO.setCurrent_vehicles(currentVehicles != null ? currentVehicles : 0);

        // ✅ 보정 로직: 총 주차면수가 1이라면 → CSV 기반 보정값으로 덮어쓰기
        Map<String, Integer> totalMap = loadTotalSpacesFromCsv();
        if (totalSpaces == null || totalSpaces == 1) {
            totalSpaces = totalMap.getOrDefault(localName, 0);
        }
        responseDTO.setTotal_spaces(totalSpaces);

        log.info("200 : 정상 처리, 주차장 {} 상세정보 성공", p_id);
        return responseDTO;
    }

    // 주차장 검색
    public List<SearchResponseDTO> search(String keyword) {
        // 키워드 포함 주차장 데이터 가져오기
        List<ParkingLot> datas = parkingLotRepository.findByKeyword(keyword);
        List<SearchResponseDTO> responseDTOS = new ArrayList<>();

        // 이 방식 말고 레포에서 데이터 가져올 때 SearchResponseDTO 필드들로만 구성된 컬럼만 가져오는 방법도 고려해보기
        // 응답 객체 생성. 코드 개선하기!! 너무 지저분함. - 스트림 사용
        for(ParkingLot data : datas) {
            SearchResponseDTO responseDTO = new SearchResponseDTO();

            responseDTO.setP_id(data.getP_id());
            responseDTO.setName(data.getName());
            responseDTO.setAddress(data.getAddress());
            responseDTO.setFee(data.getFee());

            responseDTO.setExtraFee(data.getExtraFee());

            if(data.getAvgRating() == null) {
                responseDTO.setRating(0.0);
            } else {
                responseDTO.setRating(data.getAvgRating().getAvg_score());
            }
            responseDTOS.add(responseDTO);
        }

        // 로깅
        log.info("200 : 정상 처리, 주차장 검색 성공");

        return responseDTOS;
    }

    // CSV에서 주차장명 → 총 주차면수 매핑 정보를 읽어오는 메서드
    private Map<String, Integer> loadTotalSpacesFromCsv() {
        Map<String, Integer> result = new HashMap<>();
        try {
            // ✅ resources 폴더에 있는 파일 로드
            InputStream is = getClass().getClassLoader().getResourceAsStream("parking_capacity_grouped.csv");
            if (is == null) {
                throw new FileNotFoundException("CSV 파일을 찾을 수 없습니다.");
            }

            BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));

            String line;
            br.readLine(); // 헤더 건너뜀
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",", -1);
                if (parts.length >= 3) {
                    String name = parts[1].trim(); // 주차장명
                    int totalSpaces = (int) Double.parseDouble(parts[2].trim()); // 총 주차면수
                    result.put(name, totalSpaces);
                }
            }

        } catch (IOException e) {
            e.printStackTrace();
        }

        return result;
    }

    // 거리 계산 메서드
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0; // 지구 반지름 (km)
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double dphi = Math.toRadians(lat2 - lat1);
        double dlambda = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dphi/2)*Math.sin(dphi/2)
                + Math.cos(phi1)*Math.cos(phi2)
                * Math.sin(dlambda/2)*Math.sin(dlambda/2);
        return R * 2 * Math.asin(Math.sqrt(a));
    }

}
