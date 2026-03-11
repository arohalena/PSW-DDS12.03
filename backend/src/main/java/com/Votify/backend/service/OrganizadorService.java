package com.Votify.backend.service;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.OrganizadorMO;
import com.Votify.backend.repository.OrganizadorRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class OrganizadorService extends GenericService<OrganizadorMO>{

    private final OrganizadorRepository organizadorRepository;

    @Override
    protected JpaRepository<OrganizadorMO, UUID> getRepository(){

        return organizadorRepository;

    }
}