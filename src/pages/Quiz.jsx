import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const quitarAcentos = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

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
        setMensaje("Cargando palabras..."); // Mostrar mensaje mientras carga

        if (nivelesSeleccionados.length === 0) {
            setPalabras([]);
            setMensaje("Selecciona al menos un nivel.");
            setPalabra(null);
            return;
        }

        const nivelesQueryParam = nivelesSeleccionados.join(',');
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
                setMensaje(""); // Limpiar mensaje si la carga es exitosa
                if (data.length === 0) {
                    setMensaje("No hay palabras para los niveles seleccionados.");
                    setPalabra(null); // Limpiar palabra si no hay datos
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
            setPalabra(null); // Asegurar que no hay palabra si no hay disponibles
            return;
        }
        const palabraAleatoria = palabrasDisponibles[Math.floor(Math.random() * palabrasDisponibles.length)];
        setPalabra(palabraAleatoria);
    };

    useEffect(() => {
        cargarPalabras();
    }, [nivelesSeleccionados]); // Se ejecuta cuando cambian los niveles seleccionados

    useEffect(() => {
        // Selecciona una palabra aleatoria cuando el array 'palabras' se actualiza y tiene contenido
        if (palabras.length > 0) {
            seleccionarPalabraAleatoria(palabras);
        }
    }, [palabras]); // Se ejecuta cuando el estado 'palabras' cambia


    const comprobarRespuesta = () => {
        if (!palabra) return; // No hacer nada si no hay palabra cargada

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
                setMostrarChino(respuesta !== correctaChino);
            }
            setTimeout(() => {
                // En lugar de cargar todo, solo selecciona otra palabra de las ya cargadas
                seleccionarPalabraAleatoria(palabras);
                setMensaje("");
                setRespuesta("");
                setMostrarEspanol(false);
                setMostrarChino(false);
                setMostrarSolucion(false);
            }, 2000);
        } else {
            setMensaje("❌ Inténtalo de nuevo");
            playSound("wrong");
        }
    };

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
        seleccionarPalabraAleatoria(palabras); // Simplemente selecciona otra palabra
    };


    // Mostrar mensaje de carga inicial o si no hay palabra
    if (mensaje.includes("Cargando") || !palabra && mensaje === "") return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-primary fs-3">{mensaje || "Cargando palabra..."}</p></div>;
    // Mostrar mensaje si no hay palabras para los niveles seleccionados
    if (!palabra && mensaje !== "") return <div className="container vh-100 d-flex justify-content-center align-items-center"><p className="text-warning fs-3">{mensaje}</p></div>;


    const niveles = [10, 20, 40, 60, 80, 100];
    const columnas = [
        niveles.slice(0, 3),
        niveles.slice(3, 6),
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

            <div className="d-flex flex-column flex-md-row align-items-center gap-4">

                <div className="card p-5 shadow-lg rounded-4 bg-light text-center">
                    <h1 className="display-4">{modo === "chino-espanol" ? palabra.chino : palabra.español}</h1>
                    {modo === "chino-espanol" && <p className="lead text-muted">{palabra.pinyin}</p>}

                    <input
                        type="text"
                        className="form-control form-control-lg mt-3 text-center"
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <button onClick={comprobarRespuesta} className="btn btn-primary btn-lg mt-3">
                        ✅ Comprobar
                    </button>

                    {mensaje && !mensaje.includes("Cargando") && <p className={`mt-3 fs-4 fw-bold ${mensaje.includes("✅") ? 'text-success' : mensaje.includes("❌") ? 'text-danger' : 'text-info'}`}>{mensaje}</p>}

                    {modo === "chino-espanol" && mostrarEspanol && mensaje.includes("✅") && (
                        <p className="mt-3 fs-3 text-success fw-bold">{palabra.español}</p>
                    )}

                    {modo === "espanol-chino" && mostrarChino && mensaje.includes("✅") && (
                        <p className="mt-3 fs-3 text-danger fw-bold">{palabra.chino} ({palabra.pinyin})</p>
                    )}

                    <div className="mt-4 d-flex gap-3">
                        <button onClick={saltarPalabra} className="btn btn-warning btn-lg">
                            🔄 Saltar palabra
                        </button>

                        <button onClick={() => setMostrarSolucion(true)} className="btn btn-danger btn-lg">
                            ❓ Mostrar solución
                        </button>
                    </div>

                    {mostrarSolucion && (
                        <div className="mt-4 fs-3 fw-bold">
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

                <div className="d-flex flex-column align-items-center gap-3 w-100">
                    <h3 className="fw-bold text-center">Número de palabras</h3>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {columnas.map((columna, index) => (
                            <div key={index} className="d-flex flex-column align-items-center gap-3">
                                {columna.map((nivel) => (
                                    <button
                                        key={nivel}
                                        onClick={() => toggleNivel(nivel)}
                                        className={`btn btn-lg fw-bold px-4 py-2 ${nivelesSeleccionados.includes(nivel) ? "btn-primary" : "btn-outline-primary"}`}
                                        style={{ width: "120px", height: "50px" }}
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