
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

  // Renderizado condicional para estados de carga/error
  if (loading) {
    return <div>Cargando usuarios...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        Error: {error}
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }


  return (
    <div>
      <h1>Dashboard de Usuarios</h1>
      
      {/* Contador con tipado implícito en evento */}
      <p>
        Contador: {counter} 
        <button onClick={handleIncrementCounter}>+1</button>
      </p>
      
      <input
        type="text"
        placeholder="Filtrar por nombre"
        value={filter}
        onChange={handleFilterChange}
        aria-label="Filtrar usuarios por nombre"
      />
      
      <button onClick={handleResetFilter}>Reset</button>

      <p>Total caracteres en nombres: {totalNameLength}</p>

      {/* Lista de usuarios con React.memo implícito en el componente hijo */}
      <ul>
        {filteredUsers.map(user => (
          <UserItem key={user.id} user={user} />
        ))}
      </ul>

      {filteredUsers.length === 0 && (
        <p>No se encontraron usuarios</p>
      )}
    </div>
  );
};

// PROBLEMA DE RENDERING RESUELTO: Componente memoizado con tipos
const UserItem: React.FC<{ user: User }> = React.memo(({ user }) => {
  console.log(`Renderizando: ${user.name}`);
  return (
    <li>
      <strong>{user.name}</strong> - {user.email}
    </li>
  );
});

// Display name para debugging (opcional pero recomendado)
UserItem.displayName = 'UserItem';

export default UserDashboard;