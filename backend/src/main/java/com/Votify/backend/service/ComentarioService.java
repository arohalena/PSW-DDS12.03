package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.ComentarioRequest;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ComentarioService extends GenericService<ComentarioMO>{

    private final ComentarioRepository comentarioRepository;
    private final CompetidorRepository competidorRepository;
    private final CompetidorEventoRepository competidorEventoRepository;
    private final ProyectoService proyectoService;

    @Override
    protected JpaRepository<ComentarioMO, UUID> getRepository(){

        return comentarioRepository;

    }

    public ComentarioMO crear(ComentarioRequest request){

        CompetidorMO competidor = buscarCompetidorPorUsuario(request.usuarioId());
        ProyectoMO proyecto = proyectoService.findById(request.proyectoId());

        validarVinculacionConEvento(competidor, proyecto);

        return comentarioRepository.save(buildComentario(proyecto, request.texto()));

    }

    public List<ComentarioMO> findByVotacionProyecto(UUID votacionProyectoId){

        return comentarioRepository.findByVotacionProyecto_Id(votacionProyectoId);
        
    }

    public List<ComentarioMO> findByProyecto(UUID proyectoId){

        return comentarioRepository.findByProyecto_Id(proyectoId);
        
    }

    private CompetidorMO buscarCompetidorPorUsuario(UUID usuarioId){

        return competidorRepository.findByUsuarioId(usuarioId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.FORBIDDEN, "No eres un competidor registrado."
            ));

    }

    private void validarVinculacionConEvento(CompetidorMO competidor, ProyectoMO proyecto){

        UUID eventoId = proyecto.getEvento().getId();

        boolean vinculado = competidorEventoRepository
            .existsByCompetidorIdAndEventoId(competidor.getId(), eventoId);

        if (!vinculado){
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "No estás vinculado al evento de este proyecto."
            );
        }

    }

    private ComentarioMO buildComentario(ProyectoMO proyecto, String texto){

        ComentarioMO comentario = new ComentarioMO();
        comentario.setProyecto(proyecto);
        comentario.setTexto(texto);
        comentario.setAnonTokenHash(UUID.randomUUID().toString());

        return comentario;

    }

    public void guardarComentarioGlobal(VotacionProyectoMO vp, String anonTokenHash, String texto) {
        if (vp == null || vp.getVotacion() == null) return;
        if (!vp.getVotacion().isComentariosActivos()) return;
        if (texto == null || texto.isBlank()) return;

        ComentarioMO comentario = new ComentarioMO();
        comentario.setAnonTokenHash(anonTokenHash);
        comentario.setVotacionProyecto(vp);
        comentario.setProyecto(vp.getProyecto());
        comentario.setTexto(texto.trim());
        comentarioRepository.save(comentario);
    }
    
}
