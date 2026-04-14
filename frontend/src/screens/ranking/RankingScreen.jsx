import { useEffect, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { getEventos } from "../../services/eventoService";
import { getVotacionesByEvento } from "../../services/votacionService";
import { getRanking, getCriteriosByEvento } from "../../services/criterioService";
import "../../styles/ranking.css";

function RankingScreen() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [ranking, setRanking] = useState([]);
  const [criterios, setCriterios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEventos = async () => {
      try {

        const data = await getEventos();
        setEventos(data);

        if (data.length > 0) setEventoId(data[0].id);

      } catch (err){

        setError("No se pudieron cargar los eventos");

      } finally {

        setLoading(false);

      }
    };

    loadEventos();
  }, []);

  useEffect(() => {

    if (!eventoId) return;

    const loadRanking = async () => {
      try {

        setLoading(true);
        setError("");

        const [votaciones, criteriosData] = await Promise.all([

          getVotacionesByEvento(eventoId),
          getCriteriosByEvento(eventoId),

        ]);

        setCriterios(criteriosData);

        const votacion = votaciones.find((v) => v.tipo === "POPULAR");

        if(!votacion){

          setRanking([]);
          setLoading(false);

          return;

        }

        const data = await getRanking(eventoId, votacion.id);

        setRanking(data);

      } catch (err){

        setError(err.message);

      } finally{

        setLoading(false);

      }
    };

    loadRanking();
  }, [eventoId]);

  const getMedalIcon = (posicion) => {
    if (posicion === 1) return <Trophy size={24} className="gold" />;

    if (posicion === 2) return <Medal size={24} className="silver" />;

    if (posicion === 3) return <Award size={24} className="bronze" />;

    return <span className="position-number">{posicion}</span>;

  };

  if (loading && eventos.length === 0) {

    return <main className="ranking-page"><div className="feedback-card">Cargando...</div></main>;
    
  }

  return (
    <main className="ranking-page">
      <header className="ranking-header">
        <h1>Ranking de Proyectos</h1>
        <p>Resultados de la evaluación ponderada por criterios</p>
      </header>

      <section className="ranking-event-selector">
        <label>
          <span>Evento</span>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.nombre}</option>
            ))}
          </select>
        </label>
      </section>

      {error && <div className="feedback-card error-box">{error}</div>}

      {criterios.length === 0 && !loading && (
        <div className="feedback-card warning-box">
          No hay criterios de evaluación configurados para este evento. Ve a "Criterios" para configurarlos.
        </div>
      )}

      {ranking.length === 0 && criterios.length > 0 && !loading && (
        <div className="feedback-card warning-box">
          Aún no hay puntuaciones registradas para este evento.
        </div>
      )}

      {ranking.length > 0 && (
        <section className="ranking-table-card">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Proyecto</th>
                {criterios.map((c) => (
                  <th key={c.id}>{c.nombre} ({c.peso}%)</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry) => (
                <tr key={entry.proyectoId} className={`ranking-row pos-${entry.posicion}`}>
                  <td className="ranking-position">{getMedalIcon(entry.posicion)}</td>
                  <td className="ranking-proyecto">{entry.proyectoNombre}</td>
                  {entry.criterios.map((c) => (
                    <td key={c.criterioId} className="ranking-score">
                      {c.promedio}
                    </td>
                  ))}
                  <td className="ranking-total">{entry.puntuacionTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default RankingScreen;
