package com.Votify.backend.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.PlantillaSugerenciaDTO;
import com.Votify.backend.dto.SugerenciaCriterioDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SugerenciaCriterioService {

    private static final String MENSAJE_IA_NO_DISPONIBLE =
        "Ahora mismo no se puede utilizar la generación por IA. Puedes usar una plantilla de criterios o configurarlos manualmente.";

    private static final Map<String, PlantillaSugerenciaDTO> PLANTILLAS = new LinkedHashMap<>();
    private static final List<ReglaDeteccion> REGLAS = new ArrayList<>();

    private static final Map<String, String> DEFAULT_POR_TIPO_EVENTO = Map.of(
        "HACKATHON", "hackathon",
        "FERIA_INOVACION", "hackathon"
    );

    private static final String PLANTILLA_FALLBACK = "hackathon";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String geminiApiKey;
    private final String geminiModel;
    private final String geminiGenerateUrl;

    public SugerenciaCriterioService(
            ObjectMapper objectMapper,
            @Value("${gemini.api-key:}") String geminiApiKey,
            @Value("${gemini.model:gemini-2.5-flash}") String geminiModel,
            @Value("${gemini.generate-url:https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent}") String geminiGenerateUrl) {

        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.geminiApiKey = geminiApiKey;
        this.geminiModel = geminiModel;
        this.geminiGenerateUrl = geminiGenerateUrl;
    }

    static {
        plantilla("hackathon", "Hackathon",
            criterio("Innovación", "Originalidad y creatividad de la solución", 35),
            criterio("Impacto Social", "Beneficio para la comunidad o sociedad", 25),
            criterio("Viabilidad Técnica", "Factibilidad de implementación", 25),
            criterio("Presentación", "Calidad del pitch y demo", 15)
        );

        plantilla("ia", "IA",
            criterio("Innovación", "Originalidad del enfoque de IA", 30),
            criterio("Calidad del Modelo", "Rendimiento, precisión y robustez", 30),
            criterio("Aplicabilidad", "Caso de uso real y utilidad", 20),
            criterio("Ética y Datos", "Tratamiento responsable de datos y sesgos", 20)
        );

        plantilla("sostenibilidad", "Sostenibilidad",
            criterio("Impacto Ambiental", "Contribución a la sostenibilidad", 35),
            criterio("Viabilidad", "Factibilidad económica y técnica", 25),
            criterio("Innovación", "Originalidad de la solución", 20),
            criterio("Escalabilidad", "Potencial de crecimiento", 20)
        );

        plantilla("startup", "Startup",
            criterio("Modelo de Negocio", "Claridad y solidez del modelo", 30),
            criterio("Mercado", "Tamaño y oportunidad de mercado", 25),
            criterio("Innovación", "Diferenciación frente a la competencia", 20),
            criterio("Equipo y Ejecución", "Capacidad del equipo para ejecutar", 25)
        );

        plantilla("academico", "Academico",
            criterio("Rigor Metodológico", "Solidez del método y análisis", 35),
            criterio("Originalidad", "Aportación novedosa al área", 25),
            criterio("Claridad", "Calidad de la exposición y redacción", 20),
            criterio("Resultados", "Calidad y relevancia de los resultados", 20)
        );

        regla("hackathon", "hack");
        regla("ia", "\\b(ia|ai|inteligencia artificial|machine learning|ml)\\b");
        regla("sostenibilidad", "sosten|ambiental|ecolog|verde");
        regla("startup", "startup|emprend|negocio");
        regla("academico", "academ|investig|tesis|tfg|tfm");
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

    public PlantillaSugerenciaDTO sugerirConIA(
            String descripcion,
            String tipoEvento,
            String eventoNombre,
            String modalidad) {

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                MENSAJE_IA_NO_DISPONIBLE
            );
        }

        String descripcionLimpia = descripcion == null || descripcion.isBlank()
            ? "Evento sin descripción adicional."
            : descripcion.trim();
        String evento = eventoNombre == null || eventoNombre.isBlank()
            ? "Evento de Votify"
            : eventoNombre.trim();
        String modalidadVotacion = modalidad == null || modalidad.isBlank()
            ? "MULTICRITERIO_PONDERADA"
            : modalidad.trim();

        try {
            String responseBody = callGemini(evento, descripcionLimpia, tipoEvento, modalidadVotacion);
            PlantillaSugerenciaDTO sugerencia = parseAISuggestion(responseBody);

            return new PlantillaSugerenciaDTO(
                "ia",
                "IA generativa",
                normalizarCriterios(sugerencia.criterios())
            );
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                MENSAJE_IA_NO_DISPONIBLE
            );
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                MENSAJE_IA_NO_DISPONIBLE
            );
        }
    }

    private String callGemini(
            String eventoNombre,
            String descripcion,
            String tipoEvento,
            String modalidad) throws IOException, InterruptedException {

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("contents", List.of(Map.of(
            "role", "user",
            "parts", List.of(Map.of(
                "text",
                """
                Eres un asistente experto en diseño de rúbricas de evaluación para eventos universitarios.
                Devuelve criterios concretos, medibles y adecuados para evaluar proyectos en una votación.
                Los pesos deben sumar exactamente 100. Usa español claro y profesional.

                Responde SOLO con JSON válido con esta forma:
                {"criterios":[{"nombre":"...", "descripcion":"...", "peso":25}]}

            Genera entre 4 y 6 criterios de evaluación para esta votación.

            Nombre del evento: %s
            Tipo de evento: %s
            Modalidad de votación: %s
            Descripción del evento o de lo que se quiere evaluar: %s

            Cada criterio debe incluir nombre corto, descripción de una frase y peso entero.
            """.formatted(eventoNombre, tipoEvento, modalidad, descripcion)
            ))
        )));
        requestBody.put("generationConfig", Map.of(
            "temperature", 0.4,
            "maxOutputTokens", 900,
            "responseMimeType", "application/json"
        ));

        String model = URLEncoder.encode(geminiModel, StandardCharsets.UTF_8);
        String endpoint = geminiGenerateUrl.replace("{model}", model);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .timeout(Duration.ofSeconds(25))
            .header("x-goog-api-key", geminiApiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                MENSAJE_IA_NO_DISPONIBLE
            );
        }

        return response.body();
    }

    private Map<String, Object> jsonSchemaFormat() {
        Map<String, Object> criterioSchema = new LinkedHashMap<>();
        criterioSchema.put("type", "object");
        criterioSchema.put("additionalProperties", false);
        criterioSchema.put("required", List.of("nombre", "descripcion", "peso"));
        criterioSchema.put("properties", Map.of(
            "nombre", Map.of("type", "string"),
            "descripcion", Map.of("type", "string"),
            "peso", Map.of("type", "integer", "minimum", 1, "maximum", 100)
        ));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("required", List.of("criterios"));
        schema.put("properties", Map.of(
            "criterios", Map.of(
                "type", "array",
                "minItems", 4,
                "maxItems", 6,
                "items", criterioSchema
            )
        ));

        Map<String, Object> format = new LinkedHashMap<>();
        format.putAll(schema);

        return format;
    }

    private PlantillaSugerenciaDTO parseAISuggestion(String responseBody) throws JsonProcessingException {
    JsonNode response = objectMapper.readTree(responseBody);
    String outputText = response
        .path("candidates")
        .path(0)
        .path("content")
        .path("parts")
        .path(0)
        .path("text")
        .asText("");

    if (outputText.isBlank()) {
        throw new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "La IA no devolvió criterios."
        );
    }

    String jsonLimpio = outputText
        .replaceAll("(?s)```json\\s*", "")
        .replaceAll("(?s)```\\s*", "")
        .trim();

    JsonNode content = objectMapper.readTree(jsonLimpio); // ← usa jsonLimpio, no outputText
    List<SugerenciaCriterioDTO> criterios = new ArrayList<>();

    for (JsonNode criterio : content.path("criterios")) {
        criterios.add(new SugerenciaCriterioDTO(
            criterio.path("nombre").asText(),
            criterio.path("descripcion").asText(),
            criterio.path("peso").asInt()
        ));
    }

    if (criterios.isEmpty()) {
        throw new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "La IA no devolvió criterios válidos."
        );
    }

    return new PlantillaSugerenciaDTO("ia", "IA generativa", criterios);
}

    private List<SugerenciaCriterioDTO> normalizarCriterios(List<SugerenciaCriterioDTO> criterios) {
        List<SugerenciaCriterioDTO> validos = criterios.stream()
            .filter(c -> c.nombre() != null && !c.nombre().isBlank())
            .limit(6)
            .toList();

        if (validos.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "La IA no devolvió criterios válidos."
            );
        }

        int total = validos.stream().mapToInt(c -> Math.max(c.peso(), 1)).sum();
        int acumulado = 0;
        List<SugerenciaCriterioDTO> normalizados = new ArrayList<>();

        for (int i = 0; i < validos.size(); i++) {
            SugerenciaCriterioDTO criterio = validos.get(i);
            int peso = i == validos.size() - 1
                ? 100 - acumulado
                : Math.max(1, Math.round((Math.max(criterio.peso(), 1) * 100f) / total));

            acumulado += peso;
            normalizados.add(new SugerenciaCriterioDTO(
                criterio.nombre().trim(),
                criterio.descripcion() == null || criterio.descripcion().isBlank()
                    ? "Criterio sugerido por IA."
                    : criterio.descripcion().trim(),
                peso
            ));
        }

        return normalizados;
    }

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
