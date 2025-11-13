import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

// (NUEVO) Importaciones de Firebase (MODIFICADO)
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider, // (NUEVO) Proveedor de Google
  signInWithPopup     // (NUEVO) Para la ventana de login
} from 'firebase/auth';
import {
  getFirestore,      // (NUEVO) Importar Firestore
  doc,               // (NUEVO) Para referenciar un documento
  getDoc,            // (NUEVO) Para leer un documento
  setLogLevel        // (NUEVO) Para ver logs
} from 'firebase/firestore'; // (NUEVO)

// --- (NUEVO) Configuración de Firebase ---

// 1. Intenta cargar desde variables de entorno (Vite / Vercel)
// Estas variables se leen de tu archivo .env.local (local) o de Vercel (producción)
const env = import.meta.env;
const configFromEnv = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// 2. Carga desde variables del entorno Canvas (si existen)
const configFromCanvas = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : null;

// 3. Fallback a mock (para evitar que 'initializeApp' falle si no hay nada)
const mockConfig = { 
  apiKey: "mock-key", 
  authDomain: "mock.firebaseapp.com", 
  projectId: "mock-project-id" // projectId no puede ser "mock-project"
};

// Prioriza: 1. Canvas, 2. Variables de Entorno (Vite/Vercel), 3. Mock
const firebaseConfig = configFromCanvas || 
                       (configFromEnv.apiKey ? configFromEnv : mockConfig);
  
// Esta nueva lógica busca 3 niveles para el AppId DE LA APP (para la ruta de Firestore)
// 1. Variable de Vercel/Vite (para producción)
// 2. Variable de Canvas (para este entorno)
// 3. 'default-app-id' (para desarrollo local 'npm run dev')
const appId = env.VITE_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // (NUEVO) Inicializa Firestore
setLogLevel('Debug'); // (NUEVO) Habilita logs detallados de Firestore


// --- Iconos (Sin cambios) ---
const SearchIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const LoaderIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const PlusCircleIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const CheckIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ShoppingCartIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const Trash2Icon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const XIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const PlusIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const MinusIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const MicIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const LogOutIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const UserIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
// --- (NUEVO) Icono de Google ---
const GoogleIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12.27V14.18H18.05C17.82 15.62 17.06 16.82 15.93 17.56V20.18H19.25C21.32 18.39 22.56 15.56 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12.27 23C15.02 23 17.34 22.02 19.25 20.18L15.93 17.56C15.03 18.15 13.78 18.5 12.27 18.5C9.87 18.5 7.8 16.89 7 14.56H3.59V17.25C5.4 20.73 8.58 23 12.27 23Z" fill="#34A853"/>
    <path d="M7 14.56C6.79 13.96 6.67 13.31 6.67 12.62C6.67 11.93 6.79 11.28 7 10.69V7.99999H3.59C2.7 9.69999 2.22 11.1 2.22 12.62C2.22 14.14 2.7 15.54 3.59 17.25L7 14.56Z" fill="#FBBC05"/>
    <path d="M12.27 6.49999C13.84 6.49999 15.11 7.02999 15.6 7.47999L19.33 3.82999C17.34 1.97999 15.02 1 12.27 1C8.58 1 5.4 3.26999 3.59 6.74999L7 9.43999C7.8 7.09999 9.87 6.49999 12.27 6.49999Z" fill="#EA4335"/>
  </svg>
);
// --- (NUEVO) Icono de Acceso Denegado ---
const UserXIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="17" y1="8" x2="22" y2="13"/>
    <line x1="22" y1="8" x2="17" y2="13"/>
  </svg>
);
// --- Fin Iconos ---


// Helper: Formateador de Moneda
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) {
    return '$0.00';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// (NUEVO) Helper: Formateador de Tipo de Moneda
const formatCurrencyType = (currencyCode) => {
  const code = currencyCode ? currencyCode.toString().trim() : '';
  if (code === '1') return 'ARS';
  if (code === '2') return 'USD Billete';
  if (code === '3') return 'USD Divisas';
  return '-'; // Valor por defecto
};

// --- Helper: Función para normalizar y quitar acentos (NUEVO) ---
const normalizeText = (text) => {
  if (!text) return '';
  // 1. Normaliza la cadena a su forma de descomposición (NFD) para separar los acentos.
  // 2. Elimina los caracteres diacríticos (acentos, tildes, etc.) usando una expresión regular.
  // 3. Convierte a minúsculas.
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// --- Constantes ---
const ITEMS_PER_PAGE = 50;

// --- Componente de Carrito ---
// (MODIFICADO) Ahora recibe usdRateBillete y usdRateDivisas
function CartList({ cartItems, onRemoveItem, onUpdateQuantity, onClearCart, onIncrement, onDecrement, usdRateBillete, usdRateDivisas }) {
  const [editingQuantity, setEditingQuantity] = useState({});
  
  // (MODIFICADO) Parsea ambas cotizaciones
  const rateBillete = parseFloat(usdRateBillete) || 0;
  const rateDivisas = parseFloat(usdRateDivisas) || 0;

  // Calcula el total
  const total = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      // (MODIFICADO) El precio se calcula dinámicamente con la cotización correcta
      const currencyValue = item.currency ? item.currency.toString().trim() : '';
      let calculatedPrice; // Precio *antes* de IVA

      if (currencyValue === '1') {
          calculatedPrice = item.price; // Es ARS, usa el precio base
      } else if (currencyValue === '2') {
          calculatedPrice = item.price_usd * rateBillete; // Es USD Billete
      } else if (currencyValue === '3') {
          calculatedPrice = item.price_usd * rateDivisas; // Es USD Divisas
      } else {
          calculatedPrice = 0; // Default
      }
      
      // --- (NUEVO) APLICAR IVA ---
      const tesValue = item.tes ? item.tes.toString().trim() : '';
      let finalPrice = calculatedPrice; // Precio *final* con IVA

      if (tesValue === '501') {
          finalPrice = calculatedPrice * 1.105; // Suma 10.5%
      } else if (tesValue === '503') {
          finalPrice = calculatedPrice * 1.21;  // Suma 21%
      }
      // --- FIN NUEVA LÓGICA ---
          
      return acc + (finalPrice * item.quantity); // Usa el precio final
    }, 0);
  // (MODIFICADO) Depende de ambas cotizaciones
  }, [cartItems, rateBillete, rateDivisas]);
  
  // Función local para manejar el cambio en el input
  const handleQuantityChange = useCallback((code, value) => {
    // Actualiza el estado local para que el input refleje lo que escribe el usuario,
    // incluyendo el estado temporal de cadena vacía o '0'.
    setEditingQuantity(prev => ({ ...prev, [code]: value }));

    // Si el campo no está vacío, llama a la función de actualización principal
    if (value.trim() !== '') {
        onUpdateQuantity(code, value);
    }
  }, [onUpdateQuantity]);

  // Función local para restablecer el estado temporal al perder el foco
  const handleBlur = useCallback((code, quantity) => {
    // Si el campo quedó vacío (cadena vacía) o es inválido,
    // usamos la cantidad actual del item para forzar un re-render
    if (editingQuantity[code] === '' || isNaN(parseInt(editingQuantity[code], 10))) {
        // Llama a la función de actualización con 0 si el campo estaba vacío/inválido.
        const valueToUse = 0;
        onUpdateQuantity(code, valueToUse);
    }
    
    // Limpia el estado local para que el input vuelva a usar item.quantity
    setEditingQuantity(prev => {
        const newState = { ...prev };
        delete newState[code];
        return newState;
    });
  }, [editingQuantity, onUpdateQuantity]);

  if (cartItems.length === 0) {
    return null; // No mostrar nada si el carrito está vacío
  }

  return (
    // <!-- MODIFICADO: Se cambió bg-blue-50 por bg-blue-100 y el borde a juego -->
    <div className="mb-6 bg-blue-100 rounded-lg shadow-md border border-blue-300">
      {/* (MODIFICADO) Header con padding responsivo y título más chico en móvil */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-blue-300">
        <div className="flex items-center gap-3">
          <ShoppingCartIcon className="text-blue-600" />
          {/* (MODIFICADO) Título responsivo */}
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Productos Seleccionados
          </h2>
        </div>
        <button
          onClick={onClearCart}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
        >
          <XIcon size={14} />
          {/* (MODIFICADO) Texto oculto en móvil, visible en escritorio */}
          <span className="hidden sm:inline">Vaciar Lista</span>
        </button>
      </header>

      {/* (NUEVO) Vista de Tarjetas para Móvil */}
      <div className="sm:hidden divide-y divide-blue-300">
        {cartItems.map(item => {
          // (MODIFICADO) Calcula el subtotal dinámicamente con la cotización correcta
          const currencyValue = item.currency ? item.currency.toString().trim() : '';
          let calculatedPrice; // Precio *antes* de IVA
          
          if (currencyValue === '1') {
              calculatedPrice = item.price;
          } else if (currencyValue === '2') {
              calculatedPrice = item.price_usd * rateBillete;
          } else if (currencyValue === '3') {
              calculatedPrice = item.price_usd * rateDivisas;
          } else {
              calculatedPrice = 0;
          }
          
          // --- (NUEVO) APLICAR IVA ---
          const tesValue = item.tes ? item.tes.toString().trim() : '';
          let finalPrice = calculatedPrice; 

          if (tesValue === '501') {
              finalPrice = calculatedPrice * 1.105;
          } else if (tesValue === '503') {
              finalPrice = calculatedPrice * 1.21;
          }
          // --- FIN NUEVA LÓGICA ---
          
          const subtotal = finalPrice * item.quantity;

          return (
            <div key={item.code} className="p-3">
              <div className="flex justify-between items-start">
                {/* Info del Producto */}
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-gray-800">{item.description}</p>
                  <p className="text-sm text-gray-500">Código: {item.code}</p>
                </div>
                {/* Botón de Quitar */}
                <button
                  onClick={() => onRemoveItem(item.code)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Quitar producto"
                >
                  <Trash2Icon size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-3">
                {/* Controlador de Cantidad */}
                <div className="flex items-center">
                  <button
                    onClick={() => onDecrement(item.code)}
                    className="p-1.5 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                    title="Restar uno"
                  >
                    <MinusIcon size={14} />
                  </button>
                  <input
                    type="number"
                    min="0" 
                    // Usa el valor temporal o el valor real del carrito
                    value={editingQuantity[item.code] !== undefined ? editingQuantity[item.code] : item.quantity}
                    onChange={(e) => handleQuantityChange(item.code, e.target.value)}
                    onBlur={() => handleBlur(item.code, item.quantity)}
                    className="w-12 text-center border-t border-b border-gray-300 py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => onIncrement(item.code)}
                    className="p-1.5 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                    title="Sumar uno"
                  >
                    <PlusIcon size={14} />
                  </button>
                </div>
                {/* Subtotal */}
                <p className="font-semibold text-gray-900 text-right">
                  {/* (MODIFICADO) Usa el subtotal calculado */}
                  {formatCurrency(subtotal)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* (MODIFICADO) Vista de Tabla para Escritorio (oculta en móvil) */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="min-w-full">
          {/* <!-- MODIFICADO: Se quitó bg-gray-50 para que herede el bg-blue-100 del contenedor --> */}
          <thead>
            <tr className="border-b border-blue-300">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cant.
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quitar
              </th>
            </tr>
          </thead>
          {/* <!-- MODIFICADO: Se quitó bg-white para que herede el bg-blue-100 y se cambió el borde --> */}
          <tbody className="divide-y divide-blue-200">
            {cartItems.map(item => {
              // (MODIFICADO) Calcula el subtotal dinámicamente con la cotización correcta
              const currencyValue = item.currency ? item.currency.toString().trim() : '';
              let calculatedPrice; // Precio *antes* de IVA
              
              if (currencyValue === '1') {
                  calculatedPrice = item.price;
              } else if (currencyValue === '2') {
                  calculatedPrice = item.price_usd * rateBillete;
              } else if (currencyValue === '3') {
                  calculatedPrice = item.price_usd * rateDivisas;
              } else {
                  calculatedPrice = 0;
              }

              // --- (NUEVO) APLICAR IVA ---
              const tesValue = item.tes ? item.tes.toString().trim() : '';
              let finalPrice = calculatedPrice; 

              if (tesValue === '501') {
                  finalPrice = calculatedPrice * 1.105;
              } else if (tesValue === '503') {
                  finalPrice = calculatedPrice * 1.21;
              }
              // --- FIN NUEVA LÓGICA ---

              const subtotal = finalPrice * item.quantity;

              return (
                <tr key={item.code}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.code}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onDecrement(item.code)}
                        className="p-1.5 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                        title="Restar uno"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <input
                        type="number"
                        min="0" // Permite cero
                        // Usa el valor temporal o el valor real del carrito
                        value={editingQuantity[item.code] !== undefined ? editingQuantity[item.code] : item.quantity}
                        onChange={(e) => handleQuantityChange(item.code, e.target.value)}
                        onBlur={() => handleBlur(item.code, item.quantity)}
                        className="w-14 text-center border-t border-b border-gray-300 py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => onIncrement(item.code)}
                        className="p-1.5 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                        title="Sumar uno"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {/* (MODIFICADO) Usa el subtotal calculado */}
                    {formatCurrency(subtotal)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => onRemoveItem(item.code)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Quitar producto"
                    >
                      <Trash2Icon />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* <!-- MODIFICADO: Se quitó bg-gray-50 para que herede el bg-blue-100 y se cambió el borde --> */}
      <footer className="p-3 sm:p-4 border-t border-blue-300 flex justify-end items-center">
        <span className="text-sm font-medium text-gray-700 uppercase mr-4">Total</span>
        <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
      </footer>
    </div>
  );
}


// --- Componente de Página (Refactorizado) ---

function PriceListPage({ user, onSignOut }) { // (MODIFICADO) Recibe user y onSignOut
  // --- Estados ---
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isListening, setIsListening] = useState(false); // NUEVO: Estado para el micrófono
  
  // (MODIFICADO) Estados separados para las cotizaciones
  const [usdRateBillete, setUsdRateBillete] = useState(''); // Para Moneda 2
  const [usdRateDivisas, setUsdRateDivisas] = useState(''); // Para Moneda 3

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('priceListCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error al cargar el carrito de localStorage", error);
      return [];
    }
  });

  const { ref, inView } = useInView();
  
  // --- (ELIMINADO) Lógica de Resize de Columnas ---
  
  // --- Lógica de Reconocimiento de Voz (NUEVO) ---
  const handleVoiceSearch = () => {
    // Verifica si la API de reconocimiento de voz está disponible
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Reconocimiento de voz no soportado en este navegador.');
      // En lugar de alert, es mejor una notificación menos intrusiva, pero mantenemos por simplicidad.
      alert('Tu navegador no soporta la búsqueda por voz.');
      return;
    }

    // Si ya está escuchando, detiene la escucha para evitar problemas
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR'; // Establece el idioma a español (Argentina)
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Escuchando...');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voz reconocida:', transcript);
      setSearchTerm(transcript); // Aplica la transcripción al campo de búsqueda
    };

    recognition.onerror = (event) => {
      console.error('Error en el reconocimiento de voz:', event.error);
      if (event.error !== 'no-speech') {
        alert(`Error de voz: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Reconocimiento de voz finalizado.');
      setIsListening(false);
    };

    recognition.start();
  };

  // --- Carga de Datos y Guardado en LocalStorage (Sin cambios) ---
  useEffect(() => {
    fetch('/products.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al cargar 'products.json': ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setAllProducts(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setIsLoading(false);
      });
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem('priceListCart', JSON.stringify(cart));
    } catch (error) {
      console.error("Error al guardar el carrito en localStorage", error);
    }
  }, [cart]);

  // --- Lógica del Carrito (Sin cambios funcionales en esta sección) ---
  const cartItemCodes = useMemo(() => new Set(cart.map(item => item.code)), [cart]);

  const handleAddToCart = (productToAdd) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.code === productToAdd.code);
      // (MODIFICADO) El producto que se agrega (productToAdd) ya tiene el precio ARS
      // y la cotización calculados por el useMemo.
      // Sin embargo, para el carrito, solo guardamos el precio base (price o price_usd).
      // El cálculo final se hace *dentro* del componente CartList.
      
      // Creamos una copia "limpia" para el carrito, sin el 'price' y 'rate' calculados
      // (excepto si es ARS, que 'price' es el base)
      const cartProduct = {
        code: productToAdd.code,
        description: productToAdd.description,
        currency: productToAdd.currency,
        tes: productToAdd.tes, // (NUEVO) Agregamos el 'tes' al carrito
        // (MODIFICADO) Guarda el precio base ARS (que es el final)
        price: (productToAdd.currency && productToAdd.currency.toString().trim() === '1') ? productToAdd.price_base_ars : 0, 
        price_usd: productToAdd.price_usd, // Precio base USD
      };
      
      if (existingItem) {
        // Si ya existe, incrementamos la cantidad
        return prevCart.map(item =>
          item.code === cartProduct.code
            ? { ...item, quantity: Math.max(1, item.quantity + 1) }
            : item
        );
      } else {
        return [...prevCart, { ...cartProduct, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productCode, newQuantityStr) => {
    // Si la cadena está vacía (el usuario borró el número) o es NaN,
    // permitimos que el input mantenga el campo vacío/inválido.
    if (newQuantityStr.trim() === '' || isNaN(parseInt(newQuantityStr, 10))) {
        // La lógica de actualización la maneja handleBlur al perder el foco
        return; 
    }
    
    const newQuantity = parseInt(newQuantityStr, 10);
    
    // Si la cantidad es negativa, la forzamos a 0. No eliminamos el producto.
    const finalQuantity = Math.max(0, newQuantity);
    
    setCart(prevCart =>
        prevCart.map(item =>
          item.code === productCode ? { ...item, quantity: finalQuantity } : item
        )
    );
  };

  const handleRemoveFromCart = (productCode) => {
    setCart(prevCart => prevCart.filter(item => item.code !== productCode));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleIncrementQuantity = (productCode) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.code === productCode
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };
  
  const handleDecrementQuantity = (productCode) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.code === productCode);
      if (existingItem && existingItem.quantity > 0) {
        return prevCart.map(item =>
          item.code === productCode
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      // Si ya está en 0, no hacemos nada, solo se elimina con el botón de papelera.
      return prevCart;
    });
  };

  // --- Lógica de Filtros (MODIFICADA para usar normalizeText) ---
  
  // (MODIFICADO) Parsea ambas cotizaciones
  const rateBillete = parseFloat(usdRateBillete) || 0;
  const rateDivisas = parseFloat(usdRateDivisas) || 0;

  const filteredProducts = useMemo(() => {
    let products = allProducts;
    if (searchTerm) {
      // Normaliza el término de búsqueda para ignorar acentos
      const normalizedSearchTerm = normalizeText(searchTerm);

      const searchWords = normalizedSearchTerm
        .split(' ') 
        .filter(word => word.length > 0); 
      
      products = products.filter(p => {
        // Normaliza el texto del producto para compararlo
        // (MODIFICADO) Se incluye la marca en la búsqueda
        const productText = normalizeText(
          (p.description || '') + ' ' + (p.code || '') + ' ' + (p.brand || '')
        );
        return searchWords.every(word => productText.includes(word));
      });
    }

    // (MODIFICADO) Mapea los productos para calcular precios dinámicamente
    return products.map(p => {
      const currencyValue = p.currency ? p.currency.toString().trim() : '';
      let calculatedPrice = 0; // Precio *antes* de IVA
      let rate = p.rate;
      
      if (currencyValue === '1') {
        // Es ARS
        calculatedPrice = p.price; // Este es el precio base de ARS
        rate = 1; // Ya está en 1 por el script
      } else if (currencyValue === '2') {
        // Es USD Billete
        calculatedPrice = p.price_usd * rateBillete;
        rate = rateBillete;
      } else if (currencyValue === '3') {
        // Es USD Divisas
        calculatedPrice = p.price_usd * rateDivisas;
        rate = rateDivisas;
      }
      
      // --- (NUEVO) APLICAR IVA ---
      const tesValue = p.tes ? p.tes.toString().trim() : '';
      let finalPrice = calculatedPrice; // Precio *final* con IVA

      if (tesValue === '501') {
          finalPrice = calculatedPrice * 1.105; // Suma 10.5%
      } else if (tesValue === '503') {
          finalPrice = calculatedPrice * 1.21;  // Suma 21%
      }
      // --- FIN NUEVA LÓGICA ---
      
      // (NUEVO) Preserva el precio base ARS original
      const baseArsPrice = (currencyValue === '1') ? p.price : 0;
      
      // Es ARS (o desconocido): Devuelve el producto tal cual
      // (el script de conversión ya puso rate = 1 y price_usd = 0)
      return { ...p, price: finalPrice, rate: rate, price_base_ars: baseArsPrice }; 
    });

  // (MODIFICADO) Depende de allProducts, searchTerm y AMBAS cotizaciones
  }, [allProducts, searchTerm, rateBillete, rateDivisas]); 

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm]);

  useEffect(() => {
    if (inView) {
      setVisibleCount(prevCount =>
        Math.min(prevCount + ITEMS_PER_PAGE, filteredProducts.length)
      );
    }
  }, [inView, filteredProducts.length]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);
  
  const totalProductsFound = filteredProducts.length;
  const hasMore = visibleCount < totalProductsFound;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // --- Renderizado ---

  return (
    // (MODIFICADO) Padding responsivo
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
      <header className="mb-6">
        {/* (NUEVO) Header con botón de Salir */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Lista de Precios</h1>
            <p className="text-gray-600 mt-1">
              Explora nuestro catálogo completo de productos.
              {!isLoading && !error && (
                <span className="ml-2 font-medium text-blue-600">
                  ({totalProductsFound} {totalProductsFound === 1 ? 'producto' : 'productos'} encontrados)
                </span>
              )}
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              Usuario: <span className="font-medium text-gray-700">{user.email}</span>
            </span>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
            >
              <LogOutIcon size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* --- Barra de Filtros (CORREGIDA) --- */}
      {/* (MODIFICADO) grid-cols-1 md:grid-cols-3 para 3 elementos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 1. Contenedor del item de la grilla (sin 'relative') */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por Código, Nombre o Marca
          </label>
          {/* 2. Div 'relative' que envuelve SOLO el input y los íconos */}
          <div className="relative">
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Ej: 10001, Z10, Latex, Alba..."
              // Ajuste en padding para evitar solapamiento
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {/* 3. Icono de Lupa (ahora centrado correctamente) */}
            <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            
            {/* 4. Botón de Búsqueda por Voz (ahora centrado correctamente) */}
            <button
              onClick={handleVoiceSearch}
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                isListening
                  ? 'text-red-500 hover:text-red-600 animate-pulse'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
              title={isListening ? "Escuchando..." : "Buscar por voz"}
            >
              {isListening ? (
                <LoaderIcon size={20} className="text-red-500" />
              ) : (
                <MicIcon size={20} />
              )}
            </button>
          </div>
        </div>

        {/* (NUEVO) Input para Cotización USD Billete (Moneda 2) */}
        <div>
          <label htmlFor="usdRateBillete" className="block text-sm font-medium text-gray-700 mb-1">
            Cotización USD Billete
          </label>
          <div className="relative">
            <input
              type="number"
              id="usdRateBillete"
              value={usdRateBillete}
              onChange={(e) => setUsdRateBillete(e.target.value)}
              placeholder="Ej: 1000.00"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Icono de Dólar */}
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-bold">
              $
            </span>
          </div>
        </div>
        
        {/* (NUEVO) Input para Cotización USD Divisas (Moneda 3) */}
        <div>
          <label htmlFor="usdRateDivisas" className="block text-sm font-medium text-gray-700 mb-1">
            Cotización USD Divisas
          </label>
          <div className="relative">
            <input
              type="number"
              id="usdRateDivisas"
              value={usdRateDivisas}
              onChange={(e) => setUsdRateDivisas(e.target.value)}
              placeholder="Ej: 1050.00"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Icono de Dólar */}
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-bold">
              $
            </span>
          </div>
        </div>

      </div>
      {/* --- Fin Barra de Filtros (CORREGIDA) --- */}


      {/* --- Lista/Carrito de Productos Seleccionados (Sin cambios) --- */}
      <CartList
        cartItems={cart}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onIncrement={handleIncrementQuantity}
        onDecrement={handleDecrementQuantity}
        // (MODIFICADO) Pasa ambas cotizaciones al carrito
        usdRateBillete={usdRateBillete}
        usdRateDivisas={usdRateDivisas}
      />
      
      {/* --- Título de la tabla de productos (MODIFICADO) --- */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">
        Catálogo de Productos
      </h2>

      {/* (MODIFICADO) Lógica de estados movida fuera de la tabla */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex justify-center items-center text-gray-500">
            <LoaderIcon size={24} className="mr-2" />
            Cargando productos...
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-red-200 text-red-600">
          Error al cargar los productos: {error.message}.
          <br/>
          <span className="text-sm text-gray-600">¿Ejecutaste 'node convert.mjs' y 'products.json' está en 'public'?</span>
        </div>
      ) : totalProductsFound === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200 text-gray-500">
          No se encontraron productos que coincidan con los filtros.
        </div>
      ) : (
        // (NUEVO) Contenedor para ambas vistas de lista
        <div>
          {/* (NUEVO) Vista de Tarjetas para Móvil (MODIFICADA) */}
          <div className="sm:hidden">
            {visibleProducts.map((product) => {
              const isInCart = cartItemCodes.has(product.code);
              return (
                <div key={product.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-3">
                  <div className="mb-2">
                    <p className="font-semibold text-gray-800">{product.description}</p>
                    <p className="text-sm text-gray-500">Código: {product.code}</p>
                    {/* NUEVOS CAMPOS MÓVIL */}
                    <p className="text-sm text-gray-500">Marca: {product.brand || 'N/A'}</p>
                    {/* (NUEVO) Mostrar tipo de moneda */}
                    <p className="text-sm text-gray-500">Moneda: {formatCurrencyType(product.currency)}</p>
                  </div>
                  {/* NUEVA SECCIÓN DE PRECIOS */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Precio USD</p>
                      <p className="text-lg font-bold text-gray-700">
                        {/* (MODIFICADO) Muestra price_usd (base) o '-' */}
                        {product.price_usd > 0 ? formatCurrency(product.price_usd) : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Precio Final ARS</p>
                      <p className="text-xl font-bold text-gray-900">
                        {/* (MODIFICADO) Muestra el precio (calculado o base) */}
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isInCart}
                    className={`w-full py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-colors text-sm font-bold ${
                      isInCart
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {isInCart ? (
                      <CheckIcon size={16} />
                    ) : (
                      <PlusCircleIcon size={16} />
                    )}
                    {isInCart ? 'Agregado' : 'Agregar'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* (MODIFICADO) Vista de Tabla para Escritorio (oculta en móvil) */}
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 hidden sm:block">
            {/* (MODIFICADO) Se quita 'table-fixed' para que los anchos sean automáticos */}
            <table className="min-w-full divide-y divide-gray-200">
              {/* CABECERA DE TABLA MODIFICADA */}
              <thead className="bg-gray-50">
                <tr>
                  {/* (MODIFICADO) Se quitan estilos de resize */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  {/* NUEVA COLUMNA */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca
                  </th>
                  
                  {/* (NUEVO) Columna Moneda */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moneda
                  </th>

                  {/* (CORREGIDO) Eliminada la columna "Cotización" que sobraba del encabezado */}
                  
                  {/* NUEVA COLUMNA */}
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio (USD)
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Final (ARS)
                  </th>
                  {/* (MODIFICADO) Se quita 'style' de ancho fijo */}
                  <th scope="col" className="sticky right-0 bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              {/* CUERPO DE TABLA MODIFICADO */}
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleProducts.map((product) => {
                  const isInCart = cartItemCodes.has(product.code);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {/* (MODIFICADO) Se quita 'style', se mantiene 'truncate' */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
                        {product.code}
                      </td>
                      {/* (MODIFICADO) Se quita 'truncate' y 'whitespace-nowrap'. Se agrega 'whitespace-normal' y un ancho (w-96) para forzar el ajuste de línea. */}
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-normal w-96">
                        {product.description}
                      </td>
                      {/* NUEVA CELDA */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate">
                        {product.brand || '-'}
                      </td>

                      {/* (NUEVO) Celda Moneda */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate">
                        {formatCurrencyType(product.currency)}
                      </td>

                      {/* (ELIMINADA) Celda Cotización
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {product.rate ? parseFloat(product.rate).toFixed(2) : '-'}
                      </td>
                      */}

                      {/* NUEVA CELDA */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 truncate">
                        {/* (MODIFICADO) Muestra el precio base USD */}
                        {product.price_usd > 0 ? formatCurrency(product.price_usd) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 truncate">
                        {/* (MODIFICADO) Muestra el precio final (calculado o base) */}
                        {formatCurrency(product.price)}
                      </td>
                      {/* (MODIFICADO) Se quita 'style' de ancho fijo */}
                      <td className="sticky right-0 bg-white hover:bg-gray-50 px-4 py-3 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isInCart}
                          className={`py-1 px-2.5 rounded-full flex items-center justify-center gap-1.5 transition-colors text-xs font-bold ${
                            isInCart
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isInCart ? (
                            <CheckIcon size={14} />
                          ) : (
                            <PlusCircleIcon size={14} />
                          )}
                          {isInCart ? 'Agregado' : 'Agregar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* --- Trigger de Carga (visible en ambas vistas) --- */}
          <div ref={ref} className="h-20 flex justify-center items-center">
            {hasMore ? (
              <div className="flex justify-center items-center text-sm text-gray-500">
                <LoaderIcon size={20} className="mr-2" />
                Cargando más...
              </div>
            ) : (
              <span className="text-sm text-gray-500">Fin de la lista</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// --- (NUEVO) Componente de Login (MODIFICADO para Google) ---
function LoginScreen() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      // El 'onAuthStateChanged' en App se encargará de mostrar la app
      // o la pantalla de "No autorizado"
    } catch (err) {
      console.error("Error de inicio de sesión con Google:", err.code);
      if (err.code !== 'auth/popup-closed-by-user') {
        if (err.code === 'auth/api-key-not-valid') {
            setError('Error: API Key de Firebase no válida. Revisa tu configuración.');
        } else {
            setError('Ocurrió un error. Inténtelo de nuevo.');
        }
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <UserIcon size={40} className="text-blue-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">Acceso Restringido</h1>
          <p className="text-gray-600 mt-1">Inicie sesión para ver la lista de precios.</p>
        </div>

        {error && (
          <div className="my-4 text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 bg-white text-gray-700 font-medium rounded-md shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <LoaderIcon size={20} className="mx-auto" />
          ) : (
            <>
              <GoogleIcon size={20} />
              Iniciar Sesión con Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// --- (NUEVO) Componente de Acceso Denegado ---
function AuthorizationFailedScreen({ onSignOut }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex flex-col items-center mb-6">
          <UserXIcon size={40} className="text-red-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">Acceso Denegado</h1>
          <p className="text-gray-600 mt-2">
            Tu cuenta no se encuentra en la lista de usuarios autorizados.
          </p>
          <p className="text-gray-600 mt-1">
            Por favor, contacta al administrador para solicitar acceso.
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}


// --- Componente Raíz (App) (MODIFICADO) ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false); // (NUEVO) Estado de autorización
  const [authLoading, setAuthLoading] = useState(true); // (NUEVO) Estado de carga de Whitelist

  // (NUEVO) Función para verificar la Whitelist en Firestore
  const checkUserAuthorization = async (user) => {
    if (!user) {
      setIsAuthorized(false);
      setAuthLoading(false);
      return;
    }

    // Si la config de firebase no es válida, no intentes conectar a firestore.
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "mock-key") {
      console.error("Configuración de Firebase no válida. Imposible verificar autorización.");
      setIsAuthorized(false); // No autorizado si no hay config
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    try {
      // (IMPORTANTE) La Whitelist es una colección en /artifacts/{appId}/public/data/whitelist
      // Cada documento en esa colección debe tener como ID el email del usuario autorizado.
      console.log(`Verificando autorización para ${user.email} en ruta: artifacts/${appId}/public/data/whitelist/${user.email}`);
      const whitelistRef = doc(db, 'artifacts', appId, 'public', 'data', 'whitelist', user.email);
      const docSnap = await getDoc(whitelistRef);

      if (docSnap.exists()) {
        console.log("Acceso autorizado para:", user.email);
        setIsAuthorized(true);
      } else {
        console.warn("Acceso denegado: email no está en la whitelist:", user.email);
        setIsAuthorized(false);
        // Opcional: Desloguear automáticamente si falla la autorización
        // await signOut(auth); 
      }
    } catch (error) {
      console.error("Error al verificar la whitelist:", error);
      setIsAuthorized(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Maneja el estado de autenticación
  useEffect(() => {
    // Si la config no es válida, no intentes registrar el listener
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "mock-key") {
      console.warn("Configuración de Firebase no detectada. Mostrando login.");
      setAuthReady(true); // Marca como listo para mostrar el login
      setAuthLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthReady(true);
      // (NUEVO) Verifica la autorización cada vez que cambia el usuario (login/logout)
      checkUserAuthorization(user);
    });
    return () => unsubscribe();
  }, []); // Se ejecuta solo una vez al montar

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Al desloguearse, onAuthStateChanged se disparará,
      // 'user' será null y 'isAuthorized' se pondrá en false.
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Renderizado principal de la App
  
  // 1. Muestra un loader mientras Firebase verifica el estado inicial
  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoaderIcon size={40} className="text-blue-600" />
      </div>
    );
  }

  // 2. Si hay un usuario, verifica si está autorizado
  if (user) {
    // 2a. Muestra loader mientras se verifica la whitelist
    if (authLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <LoaderIcon size={40} className="text-blue-600" />
          <span className="ml-4 text-gray-600">Verificando autorización...</span>
        </div>
      );
    }

    // 2b. Si está autorizado, muestra la app
    if (isAuthorized) {
      return (
        <main className="bg-gray-50 min-h-screen font-sans">
          <PriceListPage user={user} onSignOut={handleSignOut} />
        </main>
      );
    }
    
    // 2c. Si NO está autorizado, muestra la pantalla de Acceso Denegado
    return (
      <main className="bg-gray-50 min-h-screen font-sans">
        <AuthorizationFailedScreen onSignOut={handleSignOut} />
      </main>
    );
  }

  // 3. Si no hay usuario, muestra la pantalla de Login
  return (
    <main className="bg-gray-50 min-h-screen font-sans">
      <LoginScreen />
    </main>
  );
}