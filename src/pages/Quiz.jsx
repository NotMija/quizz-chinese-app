import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Función para eliminar acentos
const quitarAcentos = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Función para reproducir sonidos
const playSound = (sound) => {
    new Audio(`/sounds/${sound}.mp3`).play();
};

export default function Quiz() {
    const [palabra, setPalabra] = useState(null);
    const [respuesta, setRespuesta] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [mostrarSolucion, setMostrarSolucion] = useState(false);
    const [mostrarChino, setMostrarChino] = useState(false);
    const [mostrarEspanol, setMostrarEspanol] = useState(false);
    const [nivelesSeleccionados, setNivelesSeleccionados] = useState([10]);
    const [palabras, setPalabras] = useState([]);
    const [palabrasUsadas, setPalabrasUsadas] = useState([]); // Para evitar repeticiones (ajustar si se usa _id u otra key)

    const navigate = useNavigate();
    const location = useLocation();

    const modo = new URLSearchParams(location.search).get("modo") || "chino-espanol";

    const inputRef = useRef(null);

    const cargarPalabras = () => {
        setMostrarSolucion(false);
        setMostrarChino(false);
        setMostrarEspanol(false);
        setRespuesta("");
        setMensaje("");

        if (nivelesSeleccionados.length === 0) {
            setPalabras([]);
            setPalabra(null);
            setMensaje("Por favor, selecciona al menos un nivel.");
            return;
        }

        const nivelesQuery = nivelesSeleccionados.join(",");
        // Asegúrate de que la URL base sea correcta o usa una variable de entorno
        const apiUrl = `http://localhost:5000/api/palabras?niveles=${nivelesQuery}`;

        fetch(apiUrl)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setPalabras(data);
                // La selección se hará en el useEffect [palabras]
            })
            .catch(error => {
                console.error("Error al cargar palabras:", error);
                setMensaje("Error al cargar palabras. Inténtalo de nuevo.");
                setPalabras([]);
                setPalabra(null);
            });
    };

    const seleccionarPalabraAleatoria = (palabrasDisponibles) => {
        if (palabrasDisponibles.length === 0) {
            setPalabra(null);
            return;
        }

        let palabrasNoUsadas = palabrasDisponibles.filter(p => !palabrasUsadas.find(usada => usada._id === p._id));

        if (palabrasNoUsadas.length === 0 && palabrasDisponibles.length > 0) {
             setPalabrasUsadas([]);
             palabrasNoUsadas = palabrasDisponibles;
        }

        const palabraAleatoria = palabrasNoUsadas[Math.floor(Math.random() * palabrasNoUsadas.length)];
        setPalabra(palabraAleatoria);

        if(palabraAleatoria) {
        }
    };

    // Cargar palabras cuando cambian los niveles
    useEffect(() => {
        setPalabrasUsadas([]);
        cargarPalabras();
    }, [nivelesSeleccionados]);

     useEffect(() => {
         if (palabras.length > 0) {
             seleccionarPalabraAleatoria(palabras);
         } else if (nivelesSeleccionados.length > 0) {
            setPalabra(null);
         }
     }, [palabras]);

    useEffect(() => {
        if (palabra && inputRef.current) {
            inputRef.current.focus();
        }
    }, [palabra]);


    const comprobarRespuesta = () => {
        if (!palabra) return;

        let correctaPinyin = quitarAcentos(palabra.pinyin.toLowerCase());
        let correctaChino = palabra.chino;
        let correctaEspanol = quitarAcentos(palabra.español.toLowerCase());
        let respuestaNormalizada = quitarAcentos(respuesta.toLowerCase());

        if (
            (modo === "chino-espanol" && respuestaNormalizada === correctaEspanol) ||
            (modo === "espanol-chino" && (respuestaNormalizada === correctaPinyin || respuesta === correctaChino))
        ) {
            setMensaje("✅ ¡Correcto! Nueva palabra en 2 segundos...");
            playSound("correct");
            if (modo === "chino-espanol") {
                setMostrarEspanol(true);
            } else {
                setMostrarChino(true);
            }
            setTimeout(() => {
                seleccionarPalabraAleatoria(palabras);
                setRespuesta("");
                setMensaje("");
                setMostrarSolucion(false);
                setMostrarChino(false);
                setMostrarEspanol(false);
            }, 2000);
        } else {
            setMensaje("❌ Inténtalo de nuevo");
            playSound("wrong");
            if(inputRef.current) {
                inputRef.current.select();
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            comprobarRespuesta();
        }
    };

    const saltarPalabra = () => {
        if (palabras.length > 0) {
            seleccionarPalabraAleatoria(palabras);
        }
        setRespuesta("");
        setMensaje("");
        setMostrarSolucion(false);
        setMostrarChino(false);
        setMostrarEspanol(false);
    }

    const toggleNivel = (nivel) => {
        setNivelesSeleccionados((prev) =>
            prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]
        );
    };

    // --- Renderizado ---
    if (!palabra && nivelesSeleccionados.length > 0 && palabras.length === 0) {
          return (
              <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
                 <p className="text-warning fs-3">{mensaje || "Cargando palabras..."}</p>
                 {/* Aquí podría ir el selector de niveles si quieres mostrarlo */}
              </div>
          );
    }

    if (!palabra && nivelesSeleccionados.length === 0) {
        return (
             <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
                 <p className="text-info fs-3">{mensaje || "Por favor, selecciona un nivel para empezar."}</p>
                 {/* Aquí podría ir el selector de niveles */}
             </div>
         );
    }

     if (!palabra) {
         return <p className="text-danger">Cargando palabra...</p>;
     }


    const nivelesDisponibles = [10, 20, 40, 60, 80, 100];
    const columnas = [
        nivelesDisponibles.slice(0, Math.ceil(nivelesDisponibles.length / 2)),
        nivelesDisponibles.slice(Math.ceil(nivelesDisponibles.length / 2)),
    ];

    return (
        <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100 bg-gradient"
             style={{ background: "linear-gradient(135deg, #ff0000, #ffcc00)" }}>

            <button
                onClick={() => navigate("/")}
                className="position-absolute top-0 start-0 m-3 btn btn-warning text-dark fw-bold shadow-sm"
            >
                ⬅️ Volver al inicio
            </button>

            <div className="d-flex flex-column flex-md-row align-items-center gap-4 w-100 justify-content-center">

                {/* Tarjeta del Quiz */}
                <div className="card p-4 p-md-5 shadow-lg rounded-4 bg-light text-center" style={{maxWidth: '500px'}}>
                    <h1 className="display-4">{modo === "chino-espanol" ? palabra.chino : palabra.español}</h1>
                    {modo === "chino-espanol" && <p className="lead text-muted">{palabra.pinyin}</p>}

                    <input
                        ref={inputRef}
                        type="text"
                        className="form-control form-control-lg mt-3 text-center"
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        aria-label="Respuesta"
                    />

                    <button onClick={comprobarRespuesta} className="btn btn-primary btn-lg mt-3">
                        ✅ Comprobar
                    </button>

                    {mensaje && <p className={`mt-3 fs-4 fw-bold ${mensaje.includes("✅") ? 'text-success' : 'text-danger'}`}>{mensaje}</p>}

                    {modo === "chino-espanol" && mostrarEspanol && mensaje.includes("✅") && (
                         <p className="mt-3 fs-3 text-success fw-bold">{palabra.español}</p>
                     )}
                    {modo === "espanol-chino" && mostrarChino && mensaje.includes("✅") && (
                         <p className="mt-3 fs-3 text-success fw-bold">{palabra.chino} ({palabra.pinyin})</p>
                     )}

                     {mostrarSolucion && (
                         <div className="mt-4 fs-3 fw-bold text-info">
                             <p>Solución:</p>
                             {modo === "chino-espanol" ? (
                                 <p>Español: {palabra.español}</p>
                             ) : (
                                 <>
                                     <p>Pinyin: {palabra.pinyin}</p>
                                     <p>Chino: {palabra.chino}</p>
                                 </>
                             )}
                         </div>
                     )}

                    <div className="mt-4 d-flex gap-3 justify-content-center">
                        <button onClick={saltarPalabra} className="btn btn-warning btn-lg">
                            🔄 Saltar
                        </button>

                        <button onClick={() => setMostrarSolucion(true)} className="btn btn-danger btn-lg">
                            ❓ Solución
                        </button>
                    </div>
                </div>

                {/* Selección de niveles */}
                <div className="d-flex flex-column align-items-center gap-3">
                     <h3 className="fw-bold text-center text-light">Niveles</h3>
                     <div className="d-flex flex-row flex-md-column gap-3 justify-content-center">
                         {columnas.map((columna, index) => (
                             <div key={index} className="d-flex flex-column align-items-center gap-3">
                                 {columna.map((nivel) => (
                                     <button
                                         key={nivel}
                                         onClick={() => toggleNivel(nivel)}
                                         className={`btn btn-lg fw-bold px-4 py-2 ${
                                             nivelesSeleccionados.includes(nivel) ? "btn-light" : "btn-outline-light"
                                         }`}
                                         style={{ width: "100px" }}
                                     >
                                         {nivel}
                                     </button>
                                 ))}
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
}