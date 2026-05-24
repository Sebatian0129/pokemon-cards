function NavBar({ currentView, onViewChange, onShareClick }) {
  return (
    <nav className="navbar">
      <button
        className={`nav-tab ${currentView === 'search' ? 'active' : ''}`}
        onClick={() => onViewChange('search')}
        title="Buscador"
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span className="nav-label">Buscador</span>
      </button>
      <button
        className={`nav-tab ${currentView === 'binder' ? 'active' : ''}`}
        onClick={() => onViewChange('binder')}
        title="Mis Binders"
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span className="nav-label">Mis Binders</span>
      </button>
      <button
        className="nav-tab share-btn"
        onClick={onShareClick}
        title="Sincronizar"
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span className="nav-label">Sincronizar</span>
      </button>
    </nav>
  );
}

export default NavBar;
