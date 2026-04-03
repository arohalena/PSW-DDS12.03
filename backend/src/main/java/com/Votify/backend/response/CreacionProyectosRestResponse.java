package com.Votify.backend.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class CreacionProyectosRestResponse {
	private Integer ResultCode;
	public String message;
	
}
