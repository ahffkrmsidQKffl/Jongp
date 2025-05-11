package capstone.parkingmate.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AiModuleCaller {

    private final ObjectMapper objectMapper = new ObjectMapper();

    //추후 ai 스크립트 경로로 수정
    private final String scriptPath;

    public AiModuleCaller(
            @Value("${ai.script.path:/home/t25115/Jongp/ai/src/score.py}") String scriptPath
    ) {
        // Normalize to absolute path
        this.scriptPath = Paths.get(scriptPath).toAbsolutePath().toString();
        System.out.println("scriptPath = " + scriptPath);
    }

    public List<Map<String, Object>> callAiModule(List<Map<String, Object>> candidates, double baseLat, double baseLon, int parkingDuration) {

        // 요청 데이터 준비
        Map<String, Object> payload = new HashMap<>();
        payload.put("candidates", candidates);
        payload.put("parking_duration", parkingDuration);
        payload.put("base_lat", baseLat);
        payload.put("base_lon", baseLon);

        System.out.println("payload = " + payload);

        ProcessBuilder builder = new ProcessBuilder("python3", "-u", scriptPath);
        builder.directory(new File("/home/t25115/Jongp/ai/src"));

        // 오류 포함 불러오기(무한대기 방지용)
        builder.redirectErrorStream(true);
        Process process = null;

        try {
            process = builder.start();

            // Write directly to the process's stdin and close to signal EOF
            try (OutputStream os = process.getOutputStream()) {
                objectMapper.writeValue(os, payload);
            }

            // Read combined stdout and stderr
            StringBuilder output = new StringBuilder();
            try (InputStream is = process.getInputStream();
                 BufferedReader reader = new BufferedReader(
                         new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("AI module exited with code {}. Output: {}", exitCode, output);
                throw new RuntimeException("AI module error, exit code: " + exitCode);
            }

            return objectMapper.readValue(
                    output.toString(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );

        } catch (IOException e) {
            log.error("I/O error during AI module call", e);
            throw new RuntimeException("AI 모듈 호출 실패: I/O error", e);
        } catch (InterruptedException e) {
            log.error("AI module call interrupted", e);
            Thread.currentThread().interrupt();
            throw new RuntimeException("AI 모듈 호출 실패: Interrupted", e);
        } finally {
            if (process != null) {
                process.destroyForcibly();
            }
        }
    }
}
