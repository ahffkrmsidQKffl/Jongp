package capstone.parkingmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.HttpStatus;

@Data
@AllArgsConstructor
@Builder
public class ResponseData<T> {
    private int status;
    private String message;
    private T data;

    public ResponseData(final HttpStatus status, final String message) {
        this.status = status.value();
        this.message = message;
        this.data = null;
    }

    // 객체 없이 응답할 때
    public static<T> ResponseData<T> res(final HttpStatus status, final String message) {
        return res(status, message, null);
    }

    // 객체 포함 응답할 때
    public static<T> ResponseData<T> res(final HttpStatus status, final String message, final T t) {
        return ResponseData.<T>builder()
                .data(t)
                .status(status.value())
                .message(message)
                .build();
    }
}
