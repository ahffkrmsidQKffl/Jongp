package capstone.parkingmate.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordDTO {

    private String current_password;
    private String new_password;

}
