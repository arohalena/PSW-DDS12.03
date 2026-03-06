package com.Votify.backend.service;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public abstract class GenericService<T> {

    protected abstract JpaRepository<T, UUID> getRepository();

    public List<T> findAll(){

        return getRepository().findAll();

    }

    public T findById(UUID id){

        return getRepository().findById(id)
            .orElseThrow(() -> new RuntimeException(("No se ha encontrado la entidad deseada.")));
    }

    public T save(T entidad){

        return getRepository().save(entidad);

    }

    public void delete(UUID id){

        getRepository().deleteById(id);
        
    }
} 
