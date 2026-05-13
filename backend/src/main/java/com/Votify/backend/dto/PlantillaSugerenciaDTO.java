package com.Votify.backend.dto;

import java.util.List;

public record PlantillaSugerenciaDTO(

    String key,
    String label,
    List<SugerenciaCriterioDTO> criterios

) { }
