function UserFilters({ search, setSearch, selectedRole, setSelectedRole }) {
  return (
    <section className="filters-bar">
      <input
        className="search-input"
        type="text"
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="role-select"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="TODOS">Todos los roles</option>
        <option value="ORGANIZADOR">Organizador</option>
        <option value="JURADO">Jurado</option>
        <option value="COMPETIDOR">Competidor</option>
        <option value="PUBLICO">Público</option>
        <option value="ESPECTADOR">Espectador</option>
      </select>

      
    </section>
  );
}

export default UserFilters;