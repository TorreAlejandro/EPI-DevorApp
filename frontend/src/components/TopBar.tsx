import React from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu';

interface TopBarProps {
  /** Slot derecho opcional: botones de acción, avatar, etc. */
  rightSlot?: React.ReactNode;
  /** Slot izquierdo opcional, alternativo al menú */
  leftSlot?: React.ReactNode;
  /** Si es true, muestra el menú de navegación izquierdo */
  showMenu?: boolean;
}

/**
 * Barra superior persistente de la app.
 * Muestra el nombre centrado y controles laterales.
 */
const TopBar: React.FC<TopBarProps> = ({ rightSlot, leftSlot, showMenu }) => {
  const navigate = useNavigate();

  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        {/* Lado izquierdo: Menú o slot alternativo (botón volver) */}
        <div className="topbar-side" aria-hidden={!showMenu && !leftSlot}>
          {showMenu ? <SideMenu /> : leftSlot}
        </div>


        {/* Nombre centrado (siempre como botón a inicio) */}
        <button
          className="topbar-name topbar-home-btn"
          onClick={() => navigate('/home')}
          aria-label="Ir a Inicio"
        >
          DevorApp
        </button>

        {/* Acciones (futuro: avatar…) */}
        <div className="topbar-side topbar-actions">
          {rightSlot}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
