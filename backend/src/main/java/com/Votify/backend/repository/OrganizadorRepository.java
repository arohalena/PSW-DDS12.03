package com.Votify.backend.repository;

import com.Votify.backend.model.Organizador;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface OrganizadorRepository extends JpaRepository<Organizador, UUID> {

    boolean existsByEmail(String email);
    
}