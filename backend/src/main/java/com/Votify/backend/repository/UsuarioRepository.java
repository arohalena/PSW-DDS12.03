package com.Votify.backend.repository;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.UsuarioMO;


@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioMO, UUID> {

    Optional<UsuarioMO> findByEmail(String email);
    Optional<UsuarioMO> findByEmailIgnoreCase(String email);
    boolean existsByRol(RolMO rol);

}
