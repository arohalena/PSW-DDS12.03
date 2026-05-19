package com.Votify.backend.dto;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public record MaterialRequest (
    UUID proyectoId,
    MultipartFile[] files
) {}
