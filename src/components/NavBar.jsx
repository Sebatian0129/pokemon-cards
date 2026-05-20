function NavBar({ currentView, onViewChange }) {
  return (
    <nav className="navbar">
      <button
        className={`nav-tab ${currentView === 'search' ? 'active' : ''}`}
        onClick={() => onViewChange('search')}
      >
        Buscador
      </button>
      <button
        className={`nav-tab ${currentView === 'binder' ? 'active' : ''}`}
        onClick={() => onViewChange('binder')}
      >
        Mis Binders
      </button>
    </nav>
  );
}

export default NavBar;
