import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { esOrganizador } from "../../services/sessionService";
import {
  getVotacionesByEvento,
  abrirVotacion,
  pausarVotacion,
  reanudarVotacion,
  cerrarVotacion,
} from "../../services/votacionService";
import "../../styles/voting.css";

function EditVotingScreen() {
  const { eventoId, votingId } = useParams();
  const navigate = useNavigate();
  const puedeGestionar = esOrganizador();

  const [votacion, setVotacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const todas = await getVotacionesByEvento(eventoId);
        const encontrada = todas.find((v) => String(v.id) === String(votingId));
        if (!encontrada) throw new Error("No se ha encontrado la votación.");
        setVotacion(encontrada);
      } catch (err) {
        setError(err.message || "No se pudo cargar la votación.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventoId, votingId]);

  async function handleControl(accion) {
    try {
      setError("");
      setSuccess("");
      const fnMap = {
        abrir: abrirVotacion,
        pausar: pausarVotacion,
        reanudar: reanudarVotacion,
        cerrar: cerrarVotacion,
      };
      const actualizada = await fnMap[accion](votacion.id);
      setVotacion(actualizada);
      setSuccess(
        `Votación ${
          accion === "abrir" ? "abierta" :
          accion === "pausar" ? "pausada" :
          accion === "reanudar" ? "reanudada" : "cerrada"
        } correctamente.`
      );
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado de la votación.");
    }
  }

  if (loading) {
    return (
      <main className="voting-panel-page">
        <div className="feedback-card">Cargando votación...</div>
      </main>
    );
  }

  if (!votacion) {
    return (
      <main className="voting-panel-page">
        <div className="feedback-card error-box">{error || "Votación no encontrada."}</div>
      </main>
    );
  }

  const formatear = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
  const estado = votacion.estadoActual || "—";

  return (
    <main className="voting-panel-page">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate(`/eventos/${eventoId}/votaciones/crear`)}
      >
        <ArrowLeft size={16} />
        Volver a votaciones
      </button>

      <header className="voting-panel-header">
        <div>
          <h1>Editar votación</h1>
          <p>{votacion.tipo} + {votacion.modalidad}</p>
        </div>
      </header>

      <section className="detail-main-card">
        <div><strong>Estado:</strong> {estado}</div>
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Franja:</strong> {formatear(votacion.inicio)} → {formatear(votacion.fin)}
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Máx. selecciones:</strong> {votacion.maxSelecciones ?? "—"}
        </div>

        {error && <div className="feedback-card error-box" style={{ marginTop: "1rem" }}>{error}</div>}
        {success && <div className="feedback-card success-box" style={{ marginTop: "1rem" }}>{success}</div>}

        {puedeGestionar && (
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {estado === "PENDIENTE" && (
              <button className="primary-btn" onClick={() => handleControl("abrir")}>Abrir ahora</button>
            )}
            {estado === "ABIERTA" && (
              <button className="secondary-btn" onClick={() => handleControl("pausar")}>Pausar</button>
            )}
            {estado === "PAUSADA" && (
              <button className="primary-btn" onClick={() => handleControl("reanudar")}>Reanudar</button>
            )}
            {estado !== "CERRADA" && (
              <button className="secondary-btn" onClick={() => handleControl("cerrar")}>Cerrar</button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default EditVotingScreen;