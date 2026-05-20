package com.Votify.backend.strategy;

import org.springframework.stereotype.Component;

import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@Component
public class EstrategiaRankingMulticriterioPonderada extends EstrategiaRankingMulticriterio {

    public EstrategiaRankingMulticriterioPonderada(EquipoRepository equipoRepository,
                                                   CriterioEvaluacionRepository criterioRepository,
                                                   PuntuacionCriterioRepository puntuacionRepository,
                                                   VotacionProyectoRepository votacionProyectoRepository,
                                                   VotoRepository votoRepository) {
        super(equipoRepository, criterioRepository, puntuacionRepository,
              votacionProyectoRepository, votoRepository);
    }

    @Override
    protected boolean esPonderada() {
        return true;
    }
}