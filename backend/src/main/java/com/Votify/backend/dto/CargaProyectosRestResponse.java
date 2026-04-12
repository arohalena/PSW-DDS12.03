package com.Votify.backend.dto;

import java.util.List;

import com.Votify.backend.model.ProyectoMO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class CargaProyectosRestResponse {
	public String message;
	public List<ProyectoMO> proyectos;
}
