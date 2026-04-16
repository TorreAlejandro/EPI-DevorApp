import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Navigation, Star, Flame,
  Clock, Globe, Map, Bookmark, ChevronRight,
  Heart, AlertCircle, UtensilsCrossed, Loader2,
} from 'lucide-react';
import { useLogout } from '../controllers/hooks/useLogout';
import { authService } from '../models/api/authService';
import { historialService } from '../models/api/historialService';
import { savedForLaterService } from '../models/api/savedForLaterService';
import { valoracionesService } from '../models/api/valoracionesService';
import type { ValoracionPublica } from '../models/api/valoracionesService';
import TopBar from '../components/TopBar';

/* ─── Star rating ─────────────────────────────────── */
const StarRating: React.FC<{ rating: number; total?: number }> = ({ rating, total }) => (
  <div className="star-rating" aria-label={`Valoración: ${rating} de 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        aria-hidden="true"
        fill={i < Math.round(rating) ? '#ffb400' : 'none'}
        stroke={i < Math.round(rating) ? '#ffb400' : 'var(--muted)'}
        strokeWidth={1.5}
        style={{ opacity: i < Math.round(rating) ? 1 : 0.35 }}
      />
    ))}
    <span className="star-rating-value">{rating}</span>
    {total != null && <span className="star-rating-total">({total})</span>}
  </div>
);

/* ─── Restaurant card (horizontal) ──────────────────── */
interface RestaurantCardProps {
  place: any;
  expanded: boolean;
  onToggle: () => void;
  resenas: ValoracionPublica[] | undefined;
  loadingResenas: boolean;
  onMeGusta: (valoracionId: number) => void;
  onSelect: () => void;
  onSave: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  place, expanded, onToggle, resenas, loadingResenas, onMeGusta, onSelect, onSave,
}) => {
  const typeLabel = place.types?.[0]
    ?.replaceAll('_', ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? 'Restaurante';

  return (
    <article className="restaurant-card">
      {/* ── Summary row ── */}
      <button
        className="restaurant-card-row"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`restaurant-detail-${place.id}`}
      >
        {/* Thumbnail */}
        <div className="restaurant-thumb" aria-hidden="true">
          {place.main_photo
            ? <img src={place.main_photo} alt={place.name} className="restaurant-thumb-img" />
            : <UtensilsCrossed size={28} strokeWidth={1.5} style={{ color: 'var(--muted)' }} />}
        </div>

        {/* Info */}
        <div className="restaurant-info">
          <div className="restaurant-name-row">
            <span className="restaurant-name">{place.name}</span>
            {place.visit_count > 0 && (
              <span className="restaurant-badge">
                <Flame size={11} aria-hidden="true" />
                {place.visit_count}
              </span>
            )}
          </div>
          <StarRating rating={place.rating ?? 0} total={place.user_ratings_total} />
          <div className="restaurant-meta">
            <span className="restaurant-type">{typeLabel}</span>
            {place.address && (
              <span className="restaurant-address">
                <MapPin size={12} aria-hidden="true" />
                {place.address}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          size={18}
          aria-hidden="true"
          className={`restaurant-chevron${expanded ? ' expanded' : ''}`}
        />
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div
          id={`restaurant-detail-${place.id}`}
          className="restaurant-detail"
        >
          {/* AI summary */}
          {place.summary && (
            <div className="restaurant-summary">
              <p>{place.summary}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="restaurant-detail-grid">
            {/* Opening hours */}
            {place.opening_hours?.length > 0 && (
              <div className="detail-block">
                <div className="detail-block-title">
                  <Clock size={14} aria-hidden="true" />
                  Horario
                </div>
                <ul className="hours-list">
                  {place.opening_hours.slice(0, 7).map((day: string, idx: number) => {
                    const [label, hours] = day.split(': ');
                    return (
                      <li key={idx} className="hours-item">
                        <span className="hours-day">{label}</span>
                        <span className="hours-time">{hours ?? '—'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Links */}
            <div className="detail-block">
              <div className="detail-block-title">
                <MapPin size={14} aria-hidden="true" />
                Enlaces
              </div>
              <div className="detail-links">
                {place.google_maps_uri && (
                  <a href={place.google_maps_uri} target="_blank" rel="noopener noreferrer" className="detail-link">
                    <Map size={15} aria-hidden="true" />
                    Google Maps
                  </a>
                )}
                {place.website_uri && (
                  <a href={place.website_uri} target="_blank" rel="noopener noreferrer" className="detail-link">
                    <Globe size={15} aria-hidden="true" />
                    Sitio web
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="restaurant-actions">
            <button className="btn-primary" onClick={onSelect}>
              Seleccionar restaurante
            </button>
            <button className="btn-social" onClick={onSave}>
              <Bookmark size={17} aria-hidden="true" />
              Guardar para más tarde
            </button>
          </div>

          {/* Reviews */}
          <div className="reviews-section">
            <div className="reviews-header">
              <span className="reviews-title">Reseñas de la comunidad</span>
              {resenas && resenas.length > 0 && (
                <span className="reviews-count">{resenas.length}</span>
              )}
            </div>

            {loadingResenas ? (
              <div className="reviews-loading">
                <Loader2 size={18} className="spin-icon" aria-hidden="true" />
                Cargando reseñas…
              </div>
            ) : !resenas || resenas.length === 0 ? (
              <div className="reviews-empty">Aún no hay reseñas para este restaurante.</div>
            ) : (
              <div className="reviews-list">
                {resenas.map((resena) => (
                  <div key={resena.id} className="review-card">
                    <div className="review-avatar" aria-hidden="true">
                      {resena.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="review-body">
                      <span className="review-username">{resena.username}</span>
                      {resena.comentario && (
                        <p className="review-comment">"{resena.comentario}"</p>
                      )}
                    </div>
                    <button
                      className={`review-like-btn${resena.ha_dado_me_gusta ? ' liked' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onMeGusta(resena.id); }}
                      aria-label={resena.ha_dado_me_gusta ? 'Quitar me gusta' : 'Dar me gusta'}
                      aria-pressed={resena.ha_dado_me_gusta}
                    >
                      <Heart
                        size={15}
                        fill={resena.ha_dado_me_gusta ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                      <span>{resena.me_gustas}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

/* ─── HomePage ───────────────────────────────────── */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { submitLogout } = useLogout(() => navigate('/login'));

  const [nombre, setNombre] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [locationMode, setLocationMode] = useState<'current' | 'preferred'>('current');

  const [populares, setPopulares] = useState<any[]>([]);
  const [loadingPopulares, setLoadingPopulares] = useState(true);
  const [errorPopulares, setErrorPopulares] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resenasPor, setResenasPor] = useState<Record<string, ValoracionPublica[]>>({});
  const [loadingResenasPor, setLoadingResenasPor] = useState<Record<string, boolean>>({});

  /* ── Fetch user ── */
  useEffect(() => {
    authService.getMe()
      .then(u => {
        setNombre(u.nombre || u.username || 'Usuario');
        if (u.ubicacion) setPreferredLocation(u.ubicacion);
      })
      .catch(() => {});
  }, []);

  /* ── Fetch populares ── */
  useEffect(() => {
    let active = true;

    const doFetch = async (loc: string) => {
      if (!active) return;
      setLoadingPopulares(true);
      setErrorPopulares(null);
      try {
        const data = await historialService.getPopulares(loc, 5);
        if (active) {
          setPopulares(data);
          setLoadingPopulares(false);
        }
      } catch (e: any) {
        if (active) {
          setErrorPopulares(e.message ?? 'Error al cargar populares.');
          setLoadingPopulares(false);
        }
      }
    };

    if (locationMode === 'current') {
      if (!('geolocation' in navigator)) {
        if (active) {
          setErrorPopulares('Geolocalización no soportada en este navegador.');
          setLoadingPopulares(false);
        }
        return;
      }
      if (active) setLoadingPopulares(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!active) return;
          try {
            const { latitude: lat, longitude: lng } = pos.coords;
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_API_KEY}&language=es`
            );
            const raw = await res.json();
            const loc = raw.results?.[0]?.formatted_address ?? `${lat},${lng}`;
            if (active) await doFetch(loc);
          } catch {
            if (active) {
              setErrorPopulares('Error al obtener la dirección actual.');
              setLoadingPopulares(false);
            }
          }
        },
        () => {
          if (active) {
            setErrorPopulares('No se puede acceder a la ubicación. Activa los permisos o usa tu ubicación preferida.');
            setLoadingPopulares(false);
          }
        }
      );
    } else {
      if (!preferredLocation) {
        if (active) {
          setErrorPopulares('No tienes una ubicación preferida configurada.');
          setPopulares([]);
          setLoadingPopulares(false);
        }
        return;
      }
      doFetch(preferredLocation);
    }

    return () => {
      active = false;
    };
  }, [locationMode, preferredLocation]);

  /* ── Toggle expand + lazy-load reviews ── */
  const handleToggle = async (placeId: string) => {
    const next = expandedId === placeId ? null : placeId;
    setExpandedId(next);
    if (next && !resenasPor[next]) {
      setLoadingResenasPor(p => ({ ...p, [next]: true }));
      try {
        const r = await valoracionesService.obtenerResenasRestaurante(next);
        setResenasPor(p => ({ ...p, [next]: r }));
      } catch {
        setResenasPor(p => ({ ...p, [next]: [] }));
      } finally {
        setLoadingResenasPor(p => ({ ...p, [next]: false }));
      }
    }
  };

  /* ── Like toggle ── */
  const handleMeGusta = async (placeId: string, valoracionId: number) => {
    const resena = resenasPor[placeId]?.find(r => r.id === valoracionId);
    if (!resena) return;
    const liked = resena.ha_dado_me_gusta;
    setResenasPor(p => ({
      ...p,
      [placeId]: p[placeId].map(r =>
        r.id === valoracionId
          ? { ...r, ha_dado_me_gusta: !liked, me_gustas: liked ? Math.max(0, r.me_gustas - 1) : r.me_gustas + 1 }
          : r
      ),
    }));
    try {
      const updated = await valoracionesService.darMeGusta(valoracionId);
      setResenasPor(p => ({ ...p, [placeId]: p[placeId].map(r => r.id === updated.id ? updated : r) }));
    } catch {}
  };

  /* ── Actions ── */
  const handleSelect = async (place: any) => {
    try {
      await historialService.addToHistorial(place.id);
      navigate('/home');
    } catch (e: any) {
      alert('Error al seleccionar el restaurante: ' + e.message);
    }
  };

  const handleSave = async (place: any) => {
    try {
      await savedForLaterService.saveForLater({
        place_id: place.id, name: place.name,
        rating: place.rating ?? 0, user_ratings_total: place.user_ratings_total ?? 0,
        types: place.types ?? [], address: place.address ?? '',
        main_photo: place.main_photo, summary: place.summary,
        opening_hours: place.opening_hours,
        google_maps_uri: place.google_maps_uri,
        website_uri: place.website_uri,
      });
      alert(`${place.name} guardado para más tarde.`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  /* ── Render ── */
  return (
    <div className="page-screen">
      <TopBar showMenu={true} />

      <main className="home-body">

        {/* ══ Hero ══ */}
        <section className="home-hero" aria-label="Bienvenida">
          <p className="home-hero-sub">Bienvenido, <strong>{nombre}</strong></p>
          <h1 className="home-hero-title">¿Qué quieres comer hoy?</h1>
          <button
            id="go-recommend-btn"
            className="btn-primary home-search-btn"
            onClick={() => navigate('/recommend-restaurants')}
          >
            <Search size={18} aria-hidden="true" />
            Buscar restaurantes
          </button>
        </section>

        {/* ══ Populares ══ */}
        <section className="home-populares" aria-label="Restaurantes populares">
          <div className="home-section-header">
            <h2 className="home-section-title">Populares cerca de ti</h2>

            {/* Location toggle */}
            <div className="location-toggle" role="group" aria-label="Modo de ubicación">
              <button
                id="location-current-btn"
                className={`location-toggle-btn${locationMode === 'current' ? ' active' : ''}`}
                onClick={() => setLocationMode('current')}
                aria-pressed={locationMode === 'current'}
              >
                <Navigation size={13} aria-hidden="true" />
                Actual
              </button>
              <button
                id="location-preferred-btn"
                className={`location-toggle-btn${locationMode === 'preferred' ? ' active' : ''}`}
                onClick={() => setLocationMode('preferred')}
                aria-pressed={locationMode === 'preferred'}
              >
                <MapPin size={13} aria-hidden="true" />
                Preferida
              </button>
            </div>
          </div>

          {/* States */}
          {loadingPopulares ? (
            <div className="home-state-box">
              <Loader2 size={32} className="spin-icon" aria-hidden="true" style={{ color: 'var(--accent)' }} />
              <p>Buscando los mejores sitios en tu zona…</p>
            </div>
          ) : errorPopulares ? (
            <div className="home-state-box home-state-error">
              <AlertCircle size={28} aria-hidden="true" />
              <p>{errorPopulares}</p>
              {locationMode === 'current' && (
                <button
                  className="btn-social"
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => setLocationMode('preferred')}
                >
                  Usar ubicación preferida
                </button>
              )}
            </div>
          ) : populares.length === 0 ? (
            <div className="home-state-box">
              <UtensilsCrossed size={28} aria-hidden="true" style={{ color: 'var(--muted)' }} />
              <p>No se encontraron restaurantes populares cerca.</p>
            </div>
          ) : (
            <div className="restaurant-list">
              {populares.map((place: any) => (
                <RestaurantCard
                  key={place.id}
                  place={place}
                  expanded={expandedId === place.id}
                  onToggle={() => handleToggle(place.id)}
                  resenas={resenasPor[place.id]}
                  loadingResenas={!!loadingResenasPor[place.id]}
                  onMeGusta={(vid) => handleMeGusta(place.id, vid)}
                  onSelect={() => handleSelect(place)}
                  onSave={() => handleSave(place)}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default HomePage;
