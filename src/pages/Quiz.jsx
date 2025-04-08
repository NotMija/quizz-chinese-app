import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Función para eliminar acentos
const quitarAcentos = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

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

    const navigate = useNavigate();
    const location = useLocation();

    const modo = new URLSearchParams(location.search).get("modo") || "chino-espanol";
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const cargarPalabras = () => {
        setMostrarSolucion(false);
        setMostrarChino(false);
        setMostrarEspanol(false);
        setRespuesta("");
        setMensaje("Cargando palabras...");

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

    // --- FUNCIÓN comprobarRespuesta MODIFICADA ---
    const comprobarRespuesta = () => {
        if (!palabra) return; // Salir si no hay palabra cargada

        let respuestaNormalizada = quitarAcentos(respuesta.toLowerCase());
        let esLaRespuestaCorrecta = false; // Flag para saber si fue correcta

        // --- Lógica Chino -> Español
        if (modo === "chino-espanol") {
            // Verificar que palabra.español sea un array
            if (!Array.isArray(palabra.español)) {
                 console.error("Error: Se esperaba un array en palabra.español para modo chino-espanol", palabra.español);
                 setMensaje("Error interno: formato de respuesta inválido.");
                 return;
            }
            //respuestaNormalizada coincide con ALGUNA variante
            esLaRespuestaCorrecta = palabra.español.some(variante =>
                quitarAcentos(variante.toLowerCase()) === respuestaNormalizada
            );

            if (esLaRespuestaCorrecta) {
                setMostrarEspanol(true); // Activar flag para mostrar la respuesta correcta después
            }
        }
        // --- Lógica Español -> Chino (Sin cambios necesarios aquí para el array de español) ---
        else if (modo === "espanol-chino") {
            let correctaPinyin = quitarAcentos(palabra.pinyin.toLowerCase());
            let correctaChino = palabra.chino; // Caracteres chinos exactos
            // Comprobar si coincide con pinyin O con los caracteres chinos
            if (respuestaNormalizada === correctaPinyin || respuesta === correctaChino) {
                esLaRespuestaCorrecta = true;
                setMostrarChino(respuesta !== correctaChino); // Activar flag si usaron pinyin
            }
        }

        // --- Resultado Común (Correcto / Incorrecto) ---
        if (esLaRespuestaCorrecta) {
            setMensaje("✅ ¡Correcto! Nueva palabra en 2 segundos...");
            playSound("correct");
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
             // Solo muestra incorrecto si no hubo error de formato antes
             if (!(modo === "chino-espanol" && !Array.isArray(palabra.español))) {
                 setMensaje("❌ Inténtalo de nuevo");
                 playSound("wrong");
             }
        }
    };
    // --- FIN FUNCIÓN comprobarRespuesta ---


    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            comprobarRespuesta();
        }
    };

    const toggleNivel = (nivel) => {
        setNivelesSeleccionados((prev) =>
            prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]
        );
    };

    const saltarPalabra = () => {
        setMostrarSolucion(false);
        setMostrarChino(false);
        setMostrarEspanol(false);
        setRespuesta("");
        setMensaje("");
        seleccionarPalabraAleatoria(palabras);
    };

    // --- Renderizado ---
    if (mensaje.includes("Cargando")) return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-primary fs-3">{mensaje}</p></div>;
    if (!palabra && mensaje !== "" && !mensaje.includes("✅") && !mensaje.includes("❌")) return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-warning fs-3">{mensaje}</p></div>;
    if (!palabra && !mensaje) return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-primary fs-3">Cargando palabra...</p></div>;
    if (!palabra) return null;


    const nivelesDisponibles = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const columnas = [
        nivelesDisponibles.slice(0, 5),
        nivelesDisponibles.slice(5, 10)
    ];

    return (
        <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100 p-3 bg-gradient"
            style={{ background: "linear-gradient(135deg, #ff0000, #ffcc00)" }}>

            <button
                onClick={() => navigate("/")}
                className="position-absolute top-0 start-0 m-3 btn btn-warning text-dark fw-bold shadow-sm"
            >
                ⬅️ Volver al inicio
            </button>

            <div className="d-flex flex-column flex-md-row align-items-center gap-4 w-100 justify-content-center">
                <div className="card p-4 p-md-5 shadow-lg rounded-4 bg-light text-center" style={{maxWidth: '500px'}}>

                    {/* --- Palabra a adivinar (MODIFICADO para mostrar array de español) --- */}
                    <h1 className="display-4">{modo === "chino-espanol" ? palabra.chino : (Array.isArray(palabra.español) ? palabra.español.join(' / ') : palabra.español) }</h1>
                    {modo === "chino-espanol" && <p className="lead text-muted">{palabra.pinyin}</p>}

                    <input
                        type="text"
                        className="form-control form-control-lg mt-3 text-center"
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={modo === 'chino-espanol' ? 'Escribe en español...' : 'Escribe en pinyin o chino...'}
                        disabled={mensaje.includes("✅")}
                    />

                    <button onClick={comprobarRespuesta} className="btn btn-primary btn-lg mt-3" disabled={mensaje.includes("✅")}>
                        ✅ Comprobar
                    </button>

                    {mensaje && !mensaje.includes("Cargando") && <p className={`mt-3 fs-4 fw-bold ${mensaje.includes("✅") ? 'text-success' : mensaje.includes("❌") ? 'text-danger' : 'text-info'}`}>{mensaje}</p>}

                     {/* --- Mostrar la(s) respuesta(s) correcta(s) (MODIFICADO para mostrar array) --- */}
                    {modo === "chino-espanol" && mostrarEspanol && mensaje.includes("✅") && (
                         <p className="mt-3 fs-3 text-success fw-bold">{Array.isArray(palabra.español) ? palabra.español.join(' / ') : palabra.español}</p>
                    )}
                    {modo === "espanol-chino" && mostrarChino && mensaje.includes("✅") && (
                        <p className="mt-3 fs-3 text-danger fw-bold">{palabra.chino} ({palabra.pinyin})</p>
                    )}


                    <div className="mt-4 d-flex gap-3 justify-content-center">
                        <button onClick={saltarPalabra} className="btn btn-warning btn-lg" disabled={mensaje.includes("✅")}>
                            🔄 Saltar palabra
                        </button>
                        <button onClick={() => setMostrarSolucion(true)} className="btn btn-danger btn-lg" disabled={mensaje.includes("✅")}>
                            ❓ Mostrar solución
                        </button>
                    </div>

                     {/* --- Sección de Solución (MODIFICADO para mostrar array) --- */}
                    {mostrarSolucion && (
                        <div className="mt-4 fs-3 fw-bold alert alert-info">
                            {modo === "chino-espanol" ? (
                                <p>Español: {Array.isArray(palabra.español) ? palabra.español.join(' / ') : palabra.español}</p>
                            ) : (
                                <>
                                    <p>Pinyin: {palabra.pinyin}</p>
                                    <p>Chino: {palabra.chino}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                 {/* --- Selección de niveles (Sin cambios aquí) --- */}
                <div className="d-flex flex-column align-items-center gap-3" style={{maxWidth: '300px'}}>
                    <h3 className="fw-bold text-center mb-3">Niveles</h3>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {columnas.map((columna, index) => (
                            <div key={index} className="d-flex flex-column align-items-center gap-3">
                                {columna.map((nivel) => (
                                    <button
                                        key={nivel}
                                        onClick={() => toggleNivel(nivel)}
                                        className={`btn btn-lg fw-bold px-4 py-2 shadow-sm ${nivelesSeleccionados.includes(nivel) ? "btn-success" : "btn-outline-dark"}`}
                                        style={{ width: "150px", height: "50px" }}
                                    >
                                        Nivel {nivel}
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