package com.Votify.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "material_proyecto")
public class MaterialMO extends ModeloBaseMO {

	@ManyToOne
	@JoinColumn(name = "proyecto_id", nullable = false)
	private ProyectoMO proyecto;

	@Column(nullable = false)
	private String nombre;

	@Column(name = "ruta_fichero", nullable = false)
	private String rutaFichero;

	@Column(name = "tipo_mime")
	private String tipoMime;

	@Column(length = 20)
	private String extension;

	@Column
	private Long tamanyo;
}
