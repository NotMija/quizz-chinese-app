import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column align-items-center justify-content-start bg-light text-dark" style={{ minHeight: "100vh" }}>
      {/* Título ajustado con margen superior más grande */}
      <h1
        className="text-center fw-bold"
        style={{
          fontSize: "3rem",
          marginTop: "5%", // Esto mueve el título hacia abajo, ajustable
          marginBottom: "3rem", // Espacio abajo del título
        }}
      >
        Chinese Quiz
      </h1>

      {/* Botones apilados verticalmente en pantallas pequeñas y centrados en pantallas grandes */}
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4 w-100" style={{ marginTop: "4rem" }}>
        {/* Botón Chino a Español */}
        <button
          className="btn btn-lg border-0 shadow d-flex justify-content-center align-items-center position-relative custom-button mb-3"
          style={{
            backgroundImage: "url('/images/china-flag.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "200px", // Ancho fijo
            height: "100px", // Alto fijo
            borderRadius: "10px",
          }}
          onClick={() => navigate("/quiz?modo=chino-espanol")}
        >
          <span className="text-white font-weight-bold" style={{ position: "absolute", fontWeight: "600" }}>
            Chino a Español
          </span>
        </button>

        {/* Icono de las manos */}
        <span style={{ fontSize: "3rem" }}>🤝</span>

        {/* Botón Español a Chino */}
        <button
          className="btn btn-lg border-0 shadow d-flex justify-content-center align-items-center position-relative custom-button mb-3"
          style={{
            backgroundImage: "url('/images/spain-flag.png')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            width: "200px", // Ancho fijo
            height: "100px", // Alto fijo
            borderRadius: "10px",
          }}
          onClick={() => navigate("/quiz?modo=espanol-chino")}
        >
          <span className="text-white font-weight-bold" style={{ position: "absolute", fontWeight: "600" }}>
            Español a Chino
          </span>
        </button>
      </div>
    </div>
  );
}
