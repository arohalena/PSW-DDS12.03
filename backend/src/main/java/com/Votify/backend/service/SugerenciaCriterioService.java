package com.Votify.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.Votify.backend.dto.PlantillaSugerenciaDTO;
import com.Votify.backend.dto.SugerenciaCriterioDTO;

@Service
public class SugerenciaCriterioService {

    private static final Map<String, PlantillaSugerenciaDTO> PLANTILLAS = new LinkedHashMap<>();
    private static final List<ReglaDeteccion> REGLAS = new ArrayList<>();

    private static final Map<String, String> DEFAULT_POR_TIPO_EVENTO = Map.of(
        "HACKATHON",       "hackathon",
        "FERIA_INOVACION", "hackathon"
    );

    private static final String PLANTILLA_FALLBACK = "hackathon";

    static {
        plantilla("hackathon", "Hackathon",
            criterio("Innovación",         "Originalidad y creatividad de la solución", 35),
            criterio("Impacto Social",     "Beneficio para la comunidad o sociedad",    25),
            criterio("Viabilidad Técnica", "Factibilidad de implementación",            25),
            criterio("Presentación",       "Calidad del pitch y demo",                  15)
        );

        plantilla("ia", "IA",
            criterio("Innovación",         "Originalidad del enfoque de IA",            30),
            criterio("Calidad del Modelo", "Rendimiento, precisión y robustez",         30),
            criterio("Aplicabilidad",      "Caso de uso real y utilidad",               20),
            criterio("Ética y Datos",      "Tratamiento responsable de datos y sesgos", 20)
        );

        plantilla("sostenibilidad", "Sostenibilidad",
            criterio("Impacto Ambiental",  "Contribución a la sostenibilidad", 35),
            criterio("Viabilidad",         "Factibilidad económica y técnica", 25),
            criterio("Innovación",         "Originalidad de la solución",      20),
            criterio("Escalabilidad",      "Potencial de crecimiento",         20)
        );

        plantilla("startup", "Startup",
            criterio("Modelo de Negocio",  "Claridad y solidez del modelo",          30),
            criterio("Mercado",            "Tamaño y oportunidad de mercado",        25),
            criterio("Innovación",         "Diferenciación frente a la competencia", 20),
            criterio("Equipo y Ejecución", "Capacidad del equipo para ejecutar",     25)
        );

        plantilla("academico", "Academico",
            criterio("Rigor Metodológico", "Solidez del método y análisis",          35),
            criterio("Originalidad",       "Aportación novedosa al área",            25),
            criterio("Claridad",           "Calidad de la exposición y redacción",   20),
            criterio("Resultados",         "Calidad y relevancia de los resultados", 20)
        );

        regla("hackathon",      "hack");
        regla("ia",             "\\b(ia|ai|inteligencia artificial|machine learning|ml)\\b");
        regla("sostenibilidad", "sosten|ambiental|ecolog|verde");
        regla("startup",        "startup|emprend|negocio");
        regla("academico",      "academ|investig|tesis|tfg|tfm");
    }

    public List<PlantillaSugerenciaDTO> listarPlantillas() {

        return List.copyOf(PLANTILLAS.values());

    }

    public PlantillaSugerenciaDTO sugerir(String descripcion, String tipoEvento) {

        String texto = descripcion == null ? "" : descripcion.toLowerCase();

        return REGLAS.stream()
            .filter(r -> r.coincide(texto))
            .findFirst()
            .map(r -> PLANTILLAS.get(r.plantillaKey()))
            .orElseGet(() -> PLANTILLAS.get(
                DEFAULT_POR_TIPO_EVENTO.getOrDefault(tipoEvento, PLANTILLA_FALLBACK)
            ));
    }

    // --- helpers de declaración ---

    private static SugerenciaCriterioDTO criterio(String nombre, String descripcion, int peso) {

        return new SugerenciaCriterioDTO(nombre, descripcion, peso);

    }

    private static void plantilla(String key, String label, SugerenciaCriterioDTO... criterios) {

        PLANTILLAS.put(key, new PlantillaSugerenciaDTO(key, label, List.of(criterios)));

    }

    private static void regla(String plantillaKey, String patron) {

        REGLAS.add(new ReglaDeteccion(plantillaKey, Pattern.compile(patron)));

    }

    private record ReglaDeteccion(String plantillaKey, Pattern patron) {

        boolean coincide(String texto) {

            return patron.matcher(texto).find();

        }
    }
}