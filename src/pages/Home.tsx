import { Link } from "react-router-dom";

export default function Home() {
  const dorsiflexiongifUrl = "/src/assets/dorsiflexion.gif";
  const eversiongifUrl = "/src/assets/eversion.gif";
  const destinationUrl = "/hmi";

  return (
    <div className="flex justify-start items-center h-80 relative flex-col">
      <div className="text-center">
        <h2 className="text-6xl font-bold mb-8">Pick the exercise</h2>
        <div className="flex justify-center gap-8">
          <div style={{ position: "relative", marginRight: "20px" }}>
            <Link to={destinationUrl}>
              <img
                src={dorsiflexiongifUrl}
                alt="Dorsiflexion Stretch"
                className="w-80 h-auto"
              />
            </Link>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                color: "white",
                padding: "10px",
              }}
            >
              <p>
                Dorsiflexion
              </p>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Link to={destinationUrl}>
              <img
                src={eversiongifUrl}
                alt="Eversion Stretch"
                className="w-80 h-auto"
              />
            </Link>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                color: "white",
                padding: "10px",
              }}
            >
              <p>
                Eversion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
