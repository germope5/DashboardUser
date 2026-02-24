
import React, { useState, useEffect, useMemo, useCallback } from 'react';

//Definición de tipos/ interfaces
interface User {
  id: number;
  name: string;
  email: string;
  //Agregar más según las necesidades del proyecto

}

interface UserDashboardProps {
  initialCounter?: number; 
}


const UserDashboard: React.FC<UserDashboardProps> = ({ initialCounter = 0}) =>
{
  const [filter, setFilter] = useState<string>('');
  const [counter, setCounter] = useState<number>(initialCounter);
  const [fullData, setFullData] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // PROBLEMA 1: Fetching en useEffect sin control de dependencias
  useEffect(() => {
    console.log('Fetching data...');
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(response => response.json())
      .then(data => {
        setFullData(data); 
    
    });
    /* En este caso tenemos 2 opciones, la primera es que si el fetch no depende de ninguna prop o estado
    dejaremos el array vacío, la segunda opción es que si el fetch depende de alguna prop, la tenemos
    que colocar en el array. Como no me fue especificado ningún estado o propiedad, dejaría el array vació.
    Nunca se deben incluir en el array de dependencias estados que se actualizan 
    dentro del efecto (como users o fullData), porque eso genera loops.
    */  
  }, [/*fullData  [COMENTAMOS EL CONTENIDO DEL ARRAY]*/]); // <-- ¡Esto causa un loop infinito! setFullData cambia fullData, lo que dispara el efecto de nuevo.
 
 
 
  /*
  La mejor alternativa es usar AbortController (para evitar memory leaks).
  Debemos:
  - Incluir el manejo de errores.
  - Abarcar las fugas de memoria.
  - Prescindir de estados redundantes.
  
[VERSIÓN MEJORADA PROBLEMA 1.]
  */
useEffect(() => {
  const abortController = new AbortController();
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://jsonplaceholder.typicode.com/users', {
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: User[] = await response.json();
      setFullData(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
  // Cleanup: abortar fetch si el componente se desmonta
  return () => abortController.abort();
}, []); //  Array vacío - solo se ejecuta al montar






  // PROBLEMA 2: useEffect que se actualiza en cada render
  //useEffect(() => {
    //console.log('Filtrando usuarios...');
    //if (fullData) {
      //const filtered = (fullData as Array<{ name: string }>).filter((user) =>
       // user.name.toLowerCase().includes(filter.toLowerCase())
      //);
      //setUsers(filtered as typeof users);
    //}
  //}, [filter, fullData, /*users [COMENTARÉ ESTA VARIABLE]*/]); // <-- 'users' en dependencias + setUsers = Loop
  /* En este caso , creo que lo más conveniente es quitar el estado "users", ya que eso
  mismo genere los loop dentro del hook useEffect. Los estados que se actualizan dentro del effecto
  no deben ir en el array de dependencias. 
   */
  
  /*
  [VERSIÓN MEJORADA DEL PROBLEMA 2.]
  Críticas constructivas:
  - El filtrado no debería estar en un useEffect, porqué es lógica derivada.
  - Se tiene un antipatrón, users dependente completamente de fullData y filter.
  - Tratar de realizar renders innecesarios (Se hicieron 2 renders).
  Se optará por adaptar el problema para mantener users como un estado separado.
  */
// PROBLEMA 2 RESUELTO: Datos derivados con useMemo (sin useEffect)
const filteredUsers = useMemo<User[]>(() => {
  console.log('Calculando filtro...');
  if (!fullData.length) return [];
  
  return fullData.filter(user =>
    user.name.toLowerCase().includes(filter.toLowerCase())
  );
}, [fullData, filter]); // Solo se recalcula cuando cambian fullData o filter



  
  // PROBLEMA 3: Función creada en cada render, pasada a componente hijo (si lo hubiera)
  /* const handleResetFilter = () => {
    console.log('Reseteando filtro');
    setFilter('');
    if (fullData) {
      setUsers(fullData);
    }
  };
 */
// PROBLEMA 3 RESUELTO: useCallback para función estable
const handleResetFilter = useCallback(() => {
  console.log('Reseteando filtro');
  setFilter('');
}, []); //  No depende de nada, función estable






  // PROBLEMA 4: Función pesada que se recalcula en cada render
  /* const getTotalNameLength = () => {
    console.log('Calculando longitud total...');
    // @ts-ignore: El arreglo `users` contiene objetos con `name` en tiempo de ejecución
    return users.reduce((acc, user) => acc + user.name.length, 0);
  }; */

  // PROBLEMA 4 RESUELTO: useMemo para cálculo costoso
  const totalNameLength = useMemo<number>(() => {
    console.log('Calculando longitud total...');
    return filteredUsers.reduce((acc, user) => acc + user.name.length, 0);
  }, [filteredUsers]); // Solo recalcula cuando cambian los usuarios filtrados



  
  // Handlers adicionales con tipos explícitos
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  const handleIncrementCounter = useCallback(() => {
    setCounter(prev => prev + 1);
  }, []);

  const totalUsers = fullData.length;
  const visibleUsers = filteredUsers.length;
  const isFilterActive = filter.trim().length > 0;

  // Renderizado condicional para estados de carga/error
  if (loading) {
    const skeletonItems = Array.from({ length: 6 }, (_, i) => i);

    return (
      <div className="dashboard">
        <div className="dashboard__container">
          <header className="dashboard__header">
            <h1 className="dashboard__title">Dashboard de usuarios</h1>
            <p className="dashboard__subtitle">
              Administra y explora tu directorio de usuarios con un layout SaaS limpio, accesible y responsive.
            </p>
          </header>

          <section className="dashboard__metrics" aria-label="Métricas">
            <div className="card metric">
              <div className="metric__label">Contador</div>
              <div className="metric__value">{counter}</div>
              <div className="metric__hint">Acción rápida para validar interacción</div>
            </div>
            <div className="card metric">
              <div className="metric__label">Usuarios</div>
              <div className="metric__value">—</div>
              <div className="metric__hint">Cargando datos…</div>
            </div>
            <div className="card metric">
              <div className="metric__label">Total caracteres (nombres)</div>
              <div className="metric__value">—</div>
              <div className="metric__hint">Se calcula sobre resultados visibles</div>
            </div>
          </section>

          <section className="card dashboard__controls" aria-label="Filtros">
            <div className="card__header">
              <h2 className="card__title">Filtros</h2>
              <p className="card__subtitle">Refina resultados por nombre.</p>
            </div>
            <div className="card__body">
              <div className="filters">
                <div className="filters__field">
                  <label className="filters__label" htmlFor="user-filter">
                    Buscar por nombre
                  </label>
                  <input
                    id="user-filter"
                    className="input"
                    type="search"
                    placeholder="Ej. Leanne"
                    value={filter}
                    onChange={handleFilterChange}
                    aria-label="Filtrar usuarios por nombre"
                    disabled
                  />
                </div>

                <button className="button button--ghost" onClick={handleResetFilter} type="button" disabled>
                  Reset
                </button>

                <button className="button button--primary" onClick={handleIncrementCounter} type="button">
                  +1 contador
                </button>
              </div>
            </div>
          </section>

          <section className="card" aria-label="Usuarios" aria-busy="true">
            <div className="card__header">
              <h2 className="card__title">Usuarios</h2>
              <p className="card__subtitle">Cargando listado…</p>
            </div>

            <div role="status" aria-live="polite">
              <div className="user-list">
                {skeletonItems.map((i) => (
                  <div className="skeleton-row" key={i}>
                    <div className="skeleton skeleton-circle" aria-hidden="true" />
                    <div className="skeleton-lines" aria-hidden="true">
                      <div className="skeleton skeleton-line" />
                      <div className="skeleton skeleton-line skeleton-line--short" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__container">
          <header className="dashboard__header">
            <h1 className="dashboard__title">Dashboard de usuarios</h1>
            <p className="dashboard__subtitle">
              Hubo un problema cargando los datos. Puedes reintentar sin perder el contexto visual del dashboard.
            </p>
          </header>

          <section className="dashboard__metrics" aria-label="Métricas">
            <div className="card metric">
              <div className="metric__label">Contador</div>
              <div className="metric__value">{counter}</div>
              <div className="metric__hint">Disponible incluso ante errores de red</div>
            </div>
            <div className="card metric">
              <div className="metric__label">Usuarios</div>
              <div className="metric__value">—</div>
              <div className="metric__hint">No disponible</div>
            </div>
            <div className="card metric">
              <div className="metric__label">Total caracteres (nombres)</div>
              <div className="metric__value">—</div>
              <div className="metric__hint">No disponible</div>
            </div>
          </section>

          <section className="card card--danger" role="alert" aria-label="Error">
            <div className="card__header">
              <h2 className="card__title">No se pudo cargar el dashboard</h2>
              <p className="card__subtitle">Error: {error}</p>
            </div>
            <div className="card__body">
              <button className="button button--primary" onClick={() => window.location.reload()} type="button">
                Reintentar
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }


  return (
    <div className="dashboard">
      <div className="dashboard__container">
        <header className="dashboard__header">
          <h1 className="dashboard__title">Dashboard de usuarios</h1>
          <p className="dashboard__subtitle">
            Panel estilo SaaS con jerarquía clara: métricas arriba, controles al centro y resultados en una card
            con densidad visual balanceada.
          </p>
        </header>

        <section className="dashboard__metrics" aria-label="Métricas">
          <div className="card metric">
            <div className="metric__label">Contador</div>
            <div className="metric__value">{counter}</div>
            <div className="metric__hint">Feedback inmediato (microinteracción)</div>
          </div>

          <div className="card metric">
            <div className="metric__label">Usuarios</div>
            <div className="metric__value">
              {visibleUsers}
              <span className="metric__hint"> / {totalUsers}</span>
            </div>
            <div className="metric__hint">Resultados visibles vs. total</div>
          </div>

          <div className="card metric">
            <div className="metric__label">Total caracteres (nombres)</div>
            <div className="metric__value">{totalNameLength}</div>
            <div className="metric__hint">Cálculo derivado (sin renders extra)</div>
          </div>
        </section>

        <section className="card dashboard__controls" aria-label="Filtros">
          <div className="card__header">
            <h2 className="card__title">Filtros</h2>
            <p className="card__subtitle">Búsqueda rápida con reset contextual.</p>
          </div>
          <div className="card__body">
            <div className="filters">
              <div className="filters__field">
                <label className="filters__label" htmlFor="user-filter">
                  Buscar por nombre
                </label>
                <input
                  id="user-filter"
                  className="input"
                  type="search"
                  placeholder="Ej. Leanne"
                  value={filter}
                  onChange={handleFilterChange}
                  aria-label="Filtrar usuarios por nombre"
                />
              </div>

              <button
                className="button button--ghost"
                onClick={handleResetFilter}
                type="button"
                disabled={!isFilterActive}
              >
                Reset
              </button>

              <button className="button button--primary" onClick={handleIncrementCounter} type="button">
                +1 contador
              </button>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Usuarios">
          <div className="card__header">
            <h2 className="card__title">Usuarios</h2>
            <p className="card__subtitle">
              {isFilterActive ? `Mostrando ${visibleUsers} resultado(s) para “${filter.trim()}”.` : `Mostrando ${visibleUsers} usuario(s).`}
            </p>
          </div>

          {visibleUsers > 0 ? (
            <ul className="user-list" role="list">
              {filteredUsers.map(user => (
                <UserItem key={user.id} user={user} />
              ))}
            </ul>
          ) : (
            <div className="empty-state" role="status" aria-live="polite">
              <p className="empty-state__title">No users found</p>
              <p className="empty-state__message">
                Prueba con otro término de búsqueda o limpia el filtro para volver a ver el listado completo.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// PROBLEMA DE RENDERING RESUELTO: Componente memoizado con tipos
const UserItem: React.FC<{ user: User }> = React.memo(({ user }) => {
  console.log(`Renderizando: ${user.name}`);
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <li className="user-item">
      <div className="user-item__avatar" aria-hidden="true">
        {initial}
      </div>
      <div>
        <div className="user-item__name">{user.name}</div>
        <div className="user-item__email">{user.email}</div>
      </div>
    </li>
  );
});

// Display name para debugging (opcional pero recomendado)
UserItem.displayName = 'UserItem';

export default UserDashboard;