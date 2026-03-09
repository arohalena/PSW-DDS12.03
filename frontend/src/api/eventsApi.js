import axios from "axios";

const API = "http://localhost:8080/api/eventos";

export const getEventos = () => axios.get(API);

export const createEvento = (data) => axios.post(API, data);