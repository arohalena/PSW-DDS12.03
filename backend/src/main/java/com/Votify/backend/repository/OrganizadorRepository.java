package com.Votify.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.OrganizadorMO;

public interface OrganizadorRepository extends JpaRepository<OrganizadorMO, UUID> {

    boolean existsByEmail(String email);
    
}