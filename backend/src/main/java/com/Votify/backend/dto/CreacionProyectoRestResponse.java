package com.Votify.backend.dto;


import com.Votify.backend.model.ProyectoMO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class CreacionProyectoRestResponse {
	public String message;
	public ProyectoMO proyecto;
}
