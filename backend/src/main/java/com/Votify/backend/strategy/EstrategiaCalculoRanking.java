package com.Votify.backend.strategy;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.EquipoRepository;

public abstract class EstrategiaCalculoRanking {

    protected static final double PRECISION_REDONDEO = 100.0;

    protected final EquipoRepository equipoRepository;

    protected EstrategiaCalculoRanking(EquipoRepository equipoRepository) {
        this.equipoRepository = equipoRepository;
    }

    public abstract List<Map<String, Object>> calcular(UUID eventoId, UUID votacionId);

    protected Map<String, Object> baseEntry(VotacionProyectoMO vp, long votantesActivos) {

        Map<String, Object> entry = new LinkedHashMap<>();

        entry.put("proyectoId", vp.getProyecto().getId());
        entry.put("proyectoNombre", vp.getProyecto().getNombre());
        entry.put("votacionProyectoId", vp.getId());

        EquipoMO equipo = equipoRepository.findByProyecto_Id(vp.getProyecto().getId());
        entry.put("equipoNombre", equipo != null ? equipo.getNombre() : null);

        entry.put("votantesActivos", votantesActivos);

        return entry;
    }

    protected double redondear(double valor) {
        return Math.round(valor * PRECISION_REDONDEO) / PRECISION_REDONDEO;
    }
}