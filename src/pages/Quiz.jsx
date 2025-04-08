import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Función para eliminar acentos
const quitarAcentos = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

// Función para reproducir sonidos
const playSound = (sound) => {
    new Audio(`/sounds/${sound}.mp3`).play();
};

export default function Quiz() {
    // Estados del componente
    const [palabra, setPalabra] = useState(null); // La palabra actual del quiz
    const [respuesta, setRespuesta] = useState(""); // La respuesta del usuario
    const [mensaje, setMensaje] = useState(""); // Mensajes de feedback (correcto/incorrecto/error/cargando)
    const [mostrarSolucion, setMostrarSolucion] = useState(false); // Flag para mostrar la solución
    const [mostrarChino, setMostrarChino] = useState(false); // Flag para mostrar el chino (modo español-chino)
    const [mostrarEspanol, setMostrarEspanol] = useState(false); // Flag para mostrar el español (modo chino-español)
    const [nivelesSeleccionados, setNivelesSeleccionados] = useState([10]); // Niveles seleccionados (default: [10])
    const [palabras, setPalabras] = useState([]); // Array de palabras cargadas desde la API

    const navigate = useNavigate();
    const location = useLocation();

    const modo = new URLSearchParams(location.search).get("modo") || "chino-espanol";
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    // Función para cargar palabras desde la API según los niveles seleccionados (o nivel 10 por defecto)
    const cargarPalabras = () => {
        setMostrarSolucion(false);
        setMostrarChino(false);
        setMostrarEspanol(false);
        setRespuesta("");
        setMensaje("Cargando palabras...");

        // Decide qué niveles usar: los seleccionados o [10] si la selección está vacía
        const nivelesParaFetch = nivelesSeleccionados.length > 0 ? nivelesSeleccionados : [10];
        const nivelesQueryParam = nivelesParaFetch.join(',');
        const url = `${apiUrl}/api/palabras?niveles=${nivelesQueryParam}`;

        fetch(url)
            .then(response => {
                if (!response.ok) { 
                    throw new Error(`HTTP error ${response.status} - ${response.statusText}`);
                }
                return response.json(); 
            })
            .then(data => {
                setPalabras(data); 
                setMensaje(""); 
                if (data.length === 0) { 
                    const defaultMsg = nivelesSeleccionados.length === 0 ? " (nivel 10 por defecto)" : "";
                    setMensaje(`No hay palabras para los niveles seleccionados${defaultMsg}.`);
                    setPalabra(null);
                }
            })
            .catch(error => { 
                console.error("❌ Error al cargar palabras:", error);
                setMensaje("Error al cargar palabras. Revisa la conexión o la URL de la API.");
                setPalabras([]); 
                setPalabra(null); 
            });
    };

    // Función para seleccionar una palabra al azar de la lista cargada
    const seleccionarPalabraAleatoria = (palabrasDisponibles) => {
        if (!palabrasDisponibles || palabrasDisponibles.length === 0) {
            setPalabra(null); 
            return;
        }
        const palabraAleatoria = palabrasDisponibles[Math.floor(Math.random() * palabrasDisponibles.length)];
        setPalabra(palabraAleatoria); 
    };

    useEffect(() => {
        cargarPalabras(); 
    }, [nivelesSeleccionados]);

    useEffect(() => {
        if (palabras.length > 0) {
            seleccionarPalabraAleatoria(palabras);
        }
    }, [palabras]);

    // Función para comprobar si es correcta
    const comprobarRespuesta = () => {
        if (!palabra) return;

        // Normalizar mayúsculas/acentos
        let correctaPinyin = quitarAcentos(palabra.pinyin.toLowerCase());
        let correctaChino = palabra.chino;
        let correctaEspanol = quitarAcentos(palabra.español.toLowerCase());
        let respuestaNormalizada = quitarAcentos(respuesta.toLowerCase());

        // Lógica de validación según el modo
        if (
            (modo === "chino-espanol" && respuestaNormalizada === correctaEspanol) ||
            (modo === "espanol-chino" && (respuestaNormalizada === correctaPinyin || respuesta === correctaChino))
        ) {
            // Respuesta Correcta
            setMensaje("✅ ¡Correcto! Nueva palabra en 2 segundos...");
            playSound("correct");
            // Mostrar parte de la solución si es necesario
            if (modo === "chino-espanol") setMostrarEspanol(true);
            else setMostrarChino(respuesta !== correctaChino);

            // Pasar a la siguiente palabra después de 2 segundos
            setTimeout(() => {
                 seleccionarPalabraAleatoria(palabras);
                 setMensaje("");
                 setRespuesta("");
                 setMostrarEspanol(false);
                 setMostrarChino(false);
                 setMostrarSolucion(false);
            }, 2000);
        } else {
            // Respuesta Incorrecta
            setMensaje("❌ Inténtalo de nuevo");
            playSound("wrong");
        }
    };

    // Manejador para comprobar respuesta al presionar Enter
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            comprobarRespuesta();
        }
    };

    // Función para añadir o quitar un nivel de la selección
    const toggleNivel = (nivel) => {
        setNivelesSeleccionados((prev) =>
            prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]
        );
    };

    // Función para el botón "Saltar palabra"
    const saltarPalabra = () => {

        setMostrarSolucion(false);
        setMostrarChino(false);
        setMostrarEspanol(false);
        setRespuesta("");
        setMensaje("");
        seleccionarPalabraAleatoria(palabras);
    };

    if (mensaje.includes("Cargando")) return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-primary fs-3">{mensaje}</p></div>;
    if (!palabra && mensaje !== "" && !mensaje.includes("✅") && !mensaje.includes("❌")) return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-warning fs-3">{mensaje}</p></div>;
    if (!palabra && !mensaje) return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-primary fs-3">Cargando palabra...</p></div>;
     if (!palabra) return null; 


    // Definición de niveles para renderizar los botones en columnas
    const nivelesDisponibles = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const columnas = [
        nivelesDisponibles.slice(0, 5),
        nivelesDisponibles.slice(5, 10),
    ];

    // JSX principal
    return (
        <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100 p-3 bg-gradient"
            style={{ background: "linear-gradient(135deg, #ff0000, #ffcc00)" }}>

            {/* Botón Volver */}
            <button
                onClick={() => navigate("/")}
                className="position-absolute top-0 start-0 m-3 btn btn-warning text-dark fw-bold shadow-sm"
            >
                ⬅️ Volver al inicio
            </button>

            {/* Contenedor Principal (Quiz + Niveles) */}
            <div className="d-flex flex-column flex-md-row align-items-center gap-4 w-100 justify-content-center">

                {/* Card del Quiz */}
                <div className="card p-4 p-md-5 shadow-lg rounded-4 bg-light text-center" style={{maxWidth: '500px'}}>
                    {/* Palabra a adivinar */}
                    <h1 className="display-4">{modo === "chino-espanol" ? palabra.chino : palabra.español}</h1>
                    {modo === "chino-espanol" && <p className="lead text-muted">{palabra.pinyin}</p>}

                    {/* Input de respuesta */}
                    <input
                        type="text"
                        className="form-control form-control-lg mt-3 text-center"
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={modo === 'chino-espanol' ? 'Escribe en español...' : 'Escribe en pinyin o chino...'}
                    />

                    {/* Botón Comprobar */}
                    <button onClick={comprobarRespuesta} className="btn btn-primary btn-lg mt-3">
                        ✅ Comprobar
                    </button>

                    {/* Mensaje de Feedback */}
                    {mensaje && !mensaje.includes("Cargando") && <p className={`mt-3 fs-4 fw-bold ${mensaje.includes("✅") ? 'text-success' : mensaje.includes("❌") ? 'text-danger' : 'text-info'}`}>{mensaje}</p>}

                    {/* Mostrar respuesta correcta (si aplica) */}
                    {modo === "chino-espanol" && mostrarEspanol && mensaje.includes("✅") && (
                        <p className="mt-3 fs-3 text-success fw-bold">{palabra.español}</p>
                    )}
                    {modo === "espanol-chino" && mostrarChino && mensaje.includes("✅") && (
                        <p className="mt-3 fs-3 text-danger fw-bold">{palabra.chino} ({palabra.pinyin})</p>
                    )}

                    {/* Botones Saltar / Solución */}
                    <div className="mt-4 d-flex gap-3 justify-content-center">
                        <button onClick={saltarPalabra} className="btn btn-warning btn-lg">
                            🔄 Saltar palabra
                        </button>
                        <button onClick={() => setMostrarSolucion(true)} className="btn btn-danger btn-lg">
                            ❓ Mostrar solución
                        </button>
                    </div>

                    {/* Sección de Solución */}
                    {mostrarSolucion && (
                        <div className="mt-4 fs-3 fw-bold alert alert-info">
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
                </div>

                {/* Selección de niveles */}
                <div className="d-flex flex-column align-items-center gap-3" style={{maxWidth: '300px'}}>
                    <h3 className="fw-bold text-center mb-3">Nº Palabras</h3>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {/* Renderiza los botones de nivel en columnas */}
                        {columnas.map((columna, index) => (
                            <div key={index} className="d-flex flex-column align-items-center gap-3">
                                {columna.map((nivel) => (
                                    <button
                                        key={nivel}
                                        onClick={() => toggleNivel(nivel)}
                                        className={`btn btn-lg fw-bold px-4 py-2 shadow-sm ${nivelesSeleccionados.includes(nivel) ? "btn-success" : "btn-outline-dark"}`} // Estilo cambiado
                                        style={{ width: "120px", height: "50px" }} // Tamaño uniforme
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