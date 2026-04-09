import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../controllers/hooks/useLogout';
import { authService } from '../models/api/authService';
import { historialService } from '../models/api/historialService';
import { savedForLaterService } from '../models/api/savedForLaterService';
import { valoracionesService } from '../models/api/valoracionesService';
import type { ValoracionPublica } from '../models/api/valoracionesService';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { submitLogout } = useLogout(() => navigate('/login'));
    
    const [username, setUsername] = useState('');
    const [preferredLocation, setPreferredLocation] = useState('');
    const [currentLocation, setCurrentLocation] = useState('');
    const [locationMode, setLocationMode] = useState<'current' | 'preferred'>('current');
    
    const [populares, setPopulares] = useState<any[]>([]);
    const [loadingPopulares, setLoadingPopulares] = useState(true);
    const [errorPopulares, setErrorPopulares] = useState<string | null>(null);

    const [expandedRestaurantId, setExpandedRestaurantId] = useState<string | null>(null);
    const [resenasPorRestaurante, setResenasPorRestaurante] = useState<Record<string, ValoracionPublica[]>>({});
    const [loadingResenas, setLoadingResenas] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await authService.getMe();
                setUsername(user.username || 'Usuario');
                if (user.ubicacion) setPreferredLocation(user.ubicacion);
            } catch (err) {}
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (locationMode === 'current') {
            if ("geolocation" in navigator) {
                setLoadingPopulares(true);
                navigator.geolocation.getCurrentPosition(async (position) => {
                    try {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
                        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
                        const data = await res.json();
                        let foundLoc = `${lat},${lng}`;
                        if (data.results && data.results.length > 0) {
                            foundLoc = data.results[0].formatted_address;
                        }
                        setCurrentLocation(foundLoc);
                        fetchPopulares(foundLoc);
                    } catch (err) {
                        setErrorPopulares('Error al obtener la dirección actual.');
                        setLoadingPopulares(false);
                    }
                }, () => {
                    setErrorPopulares('📍 No se puede acceder a la ubicación.');
                    setLoadingPopulares(false);
                });
            } else {
                setErrorPopulares('Geolocalización no soportada en este navegador.');
                setLoadingPopulares(false);
            }
        } else {
            if (preferredLocation) {
                fetchPopulares(preferredLocation);
            } else {
                setErrorPopulares('No tienes una ubicación preferida configurada.');
                setPopulares([]);
                setLoadingPopulares(false);
            }
        }
    }, [locationMode, preferredLocation]);

    const fetchPopulares = async (loc: string) => {
        setLoadingPopulares(true);
        setErrorPopulares(null);
        try {
            const data = await historialService.getPopulares(loc, 5);
            setPopulares(data);
        } catch (err: any) {
            setErrorPopulares(err.message || 'Error al cargar populares.');
        } finally {
            setLoadingPopulares(false);
        }
    };

    const handleExpandRestaurant = async (placeId: string) => {
        const newId = expandedRestaurantId === placeId ? null : placeId;
        setExpandedRestaurantId(newId);

        if (newId && !resenasPorRestaurante[newId]) {
            setLoadingResenas(prev => ({ ...prev, [newId]: true }));
            try {
                const resenas = await valoracionesService.obtenerResenasRestaurante(newId);
                setResenasPorRestaurante(prev => ({ ...prev, [newId]: resenas }));
            } catch (err) {
                setResenasPorRestaurante(prev => ({ ...prev, [newId]: [] }));
            } finally {
                setLoadingResenas(prev => ({ ...prev, [newId]: false }));
            }
        }
    };

    const handleMeGusta = async (placeId: string, valoracionId: number) => {
        const resenaActual = (resenasPorRestaurante[placeId] || []).find(r => r.id === valoracionId);
        if (!resenaActual) return;
        const yaDabaLike = resenaActual.ha_dado_me_gusta;

        setResenasPorRestaurante(prev => ({
            ...prev,
            [placeId]: (prev[placeId] || []).map(r =>
                r.id === valoracionId 
                    ? { ...r, ha_dado_me_gusta: !yaDabaLike, me_gustas: !yaDabaLike ? r.me_gustas + 1 : Math.max(0, r.me_gustas - 1) } 
                    : r
            )
        }));

        try {
            const updated = await valoracionesService.darMeGusta(valoracionId);
            setResenasPorRestaurante(prev => ({
                ...prev, [placeId]: (prev[placeId] || []).map(r => r.id === updated.id ? updated : r)
            }));
        } catch {}
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
            {/* Nav Bar */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={() => navigate('/home')}>
                        DevorApp
                    </div>
                    {[
                        { path: '/recommend-restaurants', label: 'Recomendador' },
                        { path: '/history', label: 'Historial' },
                        { path: '/favorites', label: 'Favoritos' },
                        { path: '/saved-for-later', label: 'Guardados' },
                        { path: '/mis-valoraciones', label: 'Valoraciones' }
                    ].map(link => (
                        <span key={link.path} onClick={() => navigate(link.path)} style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)', opacity: 0.8 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
                            {link.label}
                        </span>
                    ))}
                </div>
                <button onClick={submitLogout} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    Cerrar Sesión
                </button>
            </nav>

            {/* Hero Section */}
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'radial-gradient(ellipse at top, rgba(124,109,250,0.1) 0%, transparent 70%)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>¡Hola, {username}! 👋</h1>
                <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Descubre nuevos lugares increíbles basados en lo que la comunidad adora cerca de ti.
                </p>
            </div>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '0 2rem 4rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Populares cerca de ti</h2>
                    
                    {/* Location Toggle Pill */}
                    <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: '99px', padding: '0.25rem' }}>
                        <button 
                            onClick={() => setLocationMode('current')}
                            style={{ 
                                background: locationMode === 'current' ? 'var(--accent)' : 'transparent', 
                                color: locationMode === 'current' ? 'white' : 'var(--muted)', 
                                border: 'none', padding: '0.5rem 1rem', borderRadius: '99px', 
                                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
                            }}>
                            📍 Actual
                        </button>
                        <button 
                            onClick={() => setLocationMode('preferred')}
                            style={{ 
                                background: locationMode === 'preferred' ? 'var(--accent)' : 'transparent', 
                                color: locationMode === 'preferred' ? 'white' : 'var(--muted)', 
                                border: 'none', padding: '0.5rem 1rem', borderRadius: '99px', 
                                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
                            }}>
                            🏠 Preferida
                        </button>
                    </div>
                </div>

                {loadingPopulares ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                        <div className="btn-primary loading" style={{ background: 'transparent', width: '40px', height: '40px', margin: '0 auto', boxShadow: 'none' }}></div>
                        <p style={{ marginTop: '1rem' }}>Buscando los mejores sitios en tu zona...</p>
                    </div>
                ) : errorPopulares ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
                        <p style={{ color: 'var(--error)' }}>{errorPopulares}</p>
                        {locationMode === 'current' && (
                            <button onClick={() => setLocationMode('preferred')} style={{ marginTop: '1rem', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                                Usar ubicación preferida
                            </button>
                        )}
                    </div>
                ) : populares.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                        No se encontraron restaurantes populares cerca de esta ubicación.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {populares.map((place: any) => (
                            <div key={place.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <div 
                                    onClick={() => handleExpandRestaurant(place.id)}
                                    style={{ display: 'flex', alignItems: 'center', padding: '1.5rem', gap: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {place.main_photo ? (
                                            <img src={place.main_photo} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '2rem' }}>🍴</span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{place.name}</span>
                                            {place.visit_count && (
                                                <span style={{ background: 'rgba(124,109,250,0.15)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                                                    🔥 {place.visit_count} vistas
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i} style={{ color: i < Math.floor(place.rating || 0) ? '#ffb400' : 'var(--muted)', fontSize: '0.9rem', opacity: i < Math.floor(place.rating || 0) ? 1 : 0.3 }}>★</span>
                                            ))}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '0.4rem' }}>
                                                {place.rating} ({place.user_ratings_total})
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent2)', fontWeight: 500 }}>
                                            {place.types && place.types.length > 0 ? place.types[0].replaceAll('_', ' ').replaceAll(/\b\w/g, (l: any) => l.toUpperCase()) : 'Restaurante'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{place.address}</div>
                                    </div>
                                    <div style={{ color: 'var(--muted)', fontSize: '1.2rem', opacity: 0.5, transform: expandedRestaurantId === place.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }}>›</div>
                                </div>

                                {/* Expanded Content */}
                                {expandedRestaurantId === place.id && (
                                    <div style={{ padding: '1.5rem', background: 'rgba(var(--accent-rgb), 0.03)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeSlideIn 0.3s ease' }}>
                                        {place.summary && (
                                            <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.6', padding: '1rem', borderLeft: '3px solid var(--accent)', background: 'var(--surface2)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                                                <span style={{ fontSize: '1.2rem', marginRight: '0.5rem', verticalAlign: 'middle' }}>💬</span>
                                                {place.summary}
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                                            {place.opening_hours && place.opening_hours.length > 0 && (
                                                <div style={{ background: 'var(--surface2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: 700, marginBottom: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>🕒 Horario de apertura</div>
                                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                        {place.opening_hours.slice(0, 7).map((day: string, idx: number) => {
                                                            const parts = day.split(': ');
                                                            return (
                                                                <li key={idx} style={{ fontSize: '0.8rem', opacity: 0.8, padding: '0.4rem 0', borderBottom: idx < place.opening_hours.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ fontWeight: 700 }}>{parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase() : ''} :</span>
                                                                    <span style={{ textAlign: 'right' }}>{parts[1] || ''}</span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>📍 Enlaces de interés</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    {place.google_maps_uri && (
                                                        <a href={place.google_maps_uri} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.8rem', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'all 0.2s ease' }}><span>🗺️</span> Google Maps</a>
                                                    )}
                                                    {place.website_uri && (
                                                        <a href={place.website_uri} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.8rem', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'all 0.2s ease' }}><span>🌐</span> Sitio Web</a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <button onClick={async (e) => { e.stopPropagation(); try { await historialService.addToHistorial(place.id); alert(`¡Has seleccionado ${place.name}! 🍽️`); navigate('/home'); } catch (err: any) { alert("Error: " + err.message); } }} className="btn-primary" style={{ padding: '1.2rem', boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)', fontWeight: 700, textTransform: 'uppercase' }}>
                                                SELECCIONAR ESTE RESTAURANTE
                                            </button>
                                            <button onClick={async (e) => { e.stopPropagation(); try { await savedForLaterService.saveForLater({ place_id: place.id, name: place.name, rating: place.rating || 0, user_ratings_total: place.user_ratings_total || 0, types: place.types || [], address: place.address || '', main_photo: place.main_photo, summary: place.summary, opening_hours: place.opening_hours, google_maps_uri: place.google_maps_uri, website_uri: place.website_uri }); alert(`¡Guardado ${place.name}! ⏰`); } catch (err: any) { alert(err.message); } }} type="button" style={{ padding: '1rem', fontWeight: 600, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                                                ⏰ Guardar para más tarde
                                            </button>
                                        </div>

                                        {/* Review Section */}
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                                <span>💬</span><span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Reseñas de la comunidad</span>
                                                {resenasPorRestaurante[place.id] && <span style={{ background: 'rgba(124,109,250,0.15)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '99px' }}>{resenasPorRestaurante[place.id].length}</span>}
                                            </div>
                                            {loadingResenas[place.id] ? (
                                                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>Cargando reseñas...</div>
                                            ) : !resenasPorRestaurante[place.id] || resenasPorRestaurante[place.id].length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', fontSize: '0.875rem', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>😶 Aún no hay reseñas para este restaurante.</div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {resenasPorRestaurante[place.id].map(resena => (
                                                        <div key={resena.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                                                                    {resena.username.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{resena.username}</span>
                                                            </div>
                                                            {resena.comentario && <p style={{ fontSize: '0.85rem', margin: 0, fontStyle: 'italic', opacity: 0.85 }}>"{resena.comentario}"</p>}
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                <button onClick={(e) => { e.stopPropagation(); handleMeGusta(place.id, resena.id); }} style={{ background: 'none', border: resena.ha_dado_me_gusta ? '1px solid #f472b6' : '1px solid var(--border)', borderRadius: '99px', padding: '0.3rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: resena.ha_dado_me_gusta ? '#f472b6' : 'var(--muted)' }}>
                                                                    <span>{resena.ha_dado_me_gusta ? '❤️' : '🤍'}</span><span>{resena.me_gustas}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default HomePage;

