package capstone.parkingmate.exception;

import capstone.parkingmate.dto.ResponseData;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ResponseData<?>> handleCustomException(CustomException ex) {
        return ResponseEntity
                .status(ex.getStatus())
                .body(ResponseData.res(ex.getStatus() , ex.getMessage()));
    }
}