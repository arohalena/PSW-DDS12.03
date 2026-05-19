package com.Votify.backend.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.MaterialMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.repository.MaterialRespository;
import com.Votify.backend.repository.ProyectoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MaterialService extends GenericService<MaterialMO> {

    private final MaterialRespository materialRepository;
    private final ProyectoRepository proyectoRepository;

    @Value("${app.upload.base-dir:uploads/material}")
    private String uploadBaseDir;

    @Override
    protected JpaRepository<MaterialMO, UUID> getRepository(){
        return materialRepository;
    }

    public List<MaterialMO> findByProyectoId(UUID proyectoId) {
        return materialRepository.findByProyecto_Id(proyectoId);
    }

    public List<MaterialMO> subidaFicheros(UUID proyectoId, MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se recibieron archivos para subir.");
        }

        if (proyectoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proyecto es obligatorio para guardar material.");
        }

        ProyectoMO proyecto = proyectoRepository.findById(proyectoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado."));

        try {
            Path basePath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
            Files.createDirectories(basePath);

            List<MaterialMO> uploaded = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }

                String originalName = sanitizeFileName(
                    Optional.ofNullable(file.getOriginalFilename()).orElse("archivo")
                );
                String storedName = UUID.randomUUID() + "_" + originalName;
                Path destination = basePath.resolve(storedName).normalize();

                // Prevent path traversal by forcing destination to remain under the upload base folder.
                if (!destination.startsWith(basePath)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de destino invalida.");
                }

                file.transferTo(destination.toFile());

                String relativePath = basePath.relativize(destination)
                    .toString()
                    .replace('\\', '/');
                String extension = extractExtension(originalName);

                MaterialMO material = new MaterialMO();
                material.setProyecto(proyecto);
                material.setNombre(originalName);
                material.setRutaFichero(relativePath);
                material.setTipoMime(Optional.ofNullable(file.getContentType()).orElse(null));
                material.setExtension(extension);
                material.setTamanyo(file.getSize());

                MaterialMO saved = materialRepository.save(material);
                uploaded.add(saved);
                
            }

            return uploaded;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error al subir archivos: " + e.getMessage());
        }
    }

    public Resource cargarComoRecurso(UUID materialId) {
        MaterialMO material = findById(materialId);

        try {
            Path basePath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
            Path filePath = basePath.resolve(material.getRutaFichero()).normalize();

            if (!filePath.startsWith(basePath)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo invalida.");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado en almacenamiento.");
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo solicitado.");
        }
    }

    private String sanitizeFileName(String rawFileName) {
        String withoutPath = Paths.get(rawFileName).getFileName().toString();
        return withoutPath.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String extractExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(lastDot + 1).toLowerCase();
    }
}

