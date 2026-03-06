package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.Votify.backend.service.GenericService;

public abstract class GenericController<T>{

    protected abstract GenericService<T> getService();

    @GetMapping 
    public List<T> getAll(){

        return getService().findAll();

    }

    @GetMapping("/{id}")
    public T getById(@PathVariable UUID id){

        return getService().findById(id);

    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id){

        getService().delete(id);

    }

}