package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.command.CommandInvoker;
import com.Votify.backend.command.VotifyCommandFactory;
import com.Votify.backend.dto.CrearVotacionRequest;
import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.VotacionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/votaciones")
@RequiredArgsConstructor
public class VotacionController extends GenericController<VotacionMO> {

    private final VotacionService votacionService;
    private final CriterioEvaluacionService criterioEvaluacionService;
    private final CommandInvoker commandInvoker;
    private final VotifyCommandFactory commandFactory;

    @Override
    protected GenericService<VotacionMO> getService() {
        return votacionService;
    }

    @GetMapping("/evento/{eventoId}")
    public List<VotacionMO> findByEvento_Id(@PathVariable UUID eventoId) {
        return votacionService.findByEvento_Id(eventoId);
    }

    @GetMapping("/{votacionId}/criterios")
    public List<CriterioEvaluacionMO> getCriterios(@PathVariable UUID votacionId) {
        VotacionMO votacion = votacionService.findById(votacionId);
        return criterioEvaluacionService.findByEventoId(votacion.getEvento().getId());
    }

    @PostMapping
    public VotacionMO create(@RequestBody CrearVotacionRequest request) {
        return votacionService.crear(request);
    }

    @PostMapping("/{id}/abrir")
    public VotacionMO abrir(@PathVariable UUID id) {

        return votacionService.abrir(id);

    }

    @PostMapping("/{id}/pausar")
    public VotacionMO pausar(@PathVariable UUID id) {

        return votacionService.pausar(id);

    }

    @PostMapping("/{id}/reanudar")
    public VotacionMO reanudar(@PathVariable UUID id) {

        return votacionService.reanudar(id);

    }

    @PostMapping("/{id}/cerrar")
    public VotacionMO cerrar(@PathVariable UUID id) {

        return commandInvoker.execute(commandFactory.cerrarVotacion(id));
        
    }

    @PostMapping("/{id}/publicar-resultados")
    public VotacionMO publicarResultados(@PathVariable UUID id) {

        return commandInvoker.execute(commandFactory.publicarResultados(id));

    }

    @PostMapping("/{id}/retirar-resultados")
    public VotacionMO retirarPublicacionResultados(@PathVariable UUID id) {

        return commandInvoker.execute(commandFactory.retirarPublicacionResultados(id));

    }
}
