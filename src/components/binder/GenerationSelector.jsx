import { useState } from 'react';

export const GENERATIONS = [
  { id: 1, name: 'Kanto',  label: 'Gen I',    total: 151, minId: 1,   maxId: 151,  color: '#e05252' },
  { id: 2, name: 'Johto',  label: 'Gen II',   total: 100, minId: 152, maxId: 251,  color: '#e07c30' },
  { id: 3, name: 'Hoenn',  label: 'Gen III',  total: 135, minId: 252, maxId: 386,  color: '#3aaa6a' },
  { id: 4, name: 'Sinnoh', label: 'Gen IV',   total: 107, minId: 387, maxId: 493,  color: '#4a80d4' },
  { id: 5, name: 'Unova',  label: 'Gen V',    total: 156, minId: 494, maxId: 649,  color: '#7c5cbf' },
  { id: 6, name: 'Kalos',  label: 'Gen VI',   total: 72,  minId: 650, maxId: 721,  color: '#d44090' },
  { id: 7, name: 'Alola',  label: 'Gen VII',  total: 88,  minId: 722, maxId: 809,  color: '#18a8c4' },
  { id: 8, name: 'Galar',  label: 'Gen VIII', total: 96,  minId: 810, maxId: 905,  color: '#2a9e74' },
  { id: 9, name: 'Paldea', label: 'Gen IX',   total: 120, minId: 906, maxId: 1025, color: '#9444cc' },
];

function GenerationSelector({ ownedCards, onSelect }) {
  const [customColors, setCustomColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('binder_colors') ?? '{}');
    } catch {
      return {};
    }
  });

  function handleColorChange(genId, color) {
    const next = { ...customColors, [genId]: color };
    setCustomColors(next);
    localStorage.setItem('binder_colors', JSON.stringify(next));
  }

  function getProgress(gen) {
    const uniqueIds = new Set(
      Object.values(ownedCards)
        .filter((v) => v.pokemonId >= gen.minId && v.pokemonId <= gen.maxId)
        .map((v) => v.pokemonId)
    );
    return uniqueIds.size;
  }

  return (
    <div className="gen-selector">
      <h2 className="gen-selector-title">Mis Binders</h2>
      <p className="gen-selector-subtitle">Selecciona una generación para ver y registrar tus cartas</p>
      <div className="gen-grid">
        {GENERATIONS.map((gen) => {
          const color = customColors[gen.id] ?? gen.color;
          const progress = getProgress(gen);
          const pct = Math.round((progress / gen.total) * 100);
          return (
            <div
              key={gen.id}
              className="binder-card"
              style={{ '--gen-color': color }}
              onClick={() => onSelect({ ...gen, color })}
            >
              <div className="binder-tab" />
              <div className="binder-stitch" />

              <div className="binder-cover">
                <div className="binder-cover-top">
                  <span className="binder-gen-label">{gen.label}</span>
                  {pct > 0 && <span className="binder-pct-badge">{pct}%</span>}
                </div>

                <h3 className="binder-gen-name">{gen.name}</h3>

                <div className="binder-cover-bottom">
                  <div className="binder-progress-track">
                    <div className="binder-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="binder-progress-label">{progress} / {gen.total} Pokémon</p>
                </div>
              </div>

              {/* Selector de color — stopPropagation evita abrir el binder al hacer clic */}
              <label
                className="color-picker-btn"
                title="Cambiar color del binder"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(gen.id, e.target.value)}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GenerationSelector;
