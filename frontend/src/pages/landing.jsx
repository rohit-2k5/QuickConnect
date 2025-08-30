import { useState } from "react";
import styles from "../styles/landing.module.css";
import { Link, useNavigate } from "react-router-dom";
import Typewriter from "typewriter-effect";
import { fontSize } from "@mui/system";

export default function LandingPage() {
  const router = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <div className={styles.logoContainer}><span><img className={styles.logocss} src="/logo.png" alt="q" /></span><p style={{fontSize: "1.2rem"}}>uick Connect</p></div>
        </div>

        {/* Nav links */}
        <div className={`navlist ${menuOpen ? "active" : ""}`}>
          <p
            onClick={() => {
              router("/aljk23");
              setMenuOpen(false);
            }}
          >
            Join as Guest
          </p>
          <p
            onClick={() => {
              router("/auth");
              setMenuOpen(false);
            }}
          >
            Register
          </p>
          <div
            onClick={() => {
              router("/auth");
              setMenuOpen(false);
            }}
            role="button"
          >
            <p>Login</p>
          </div>
        </div>

        {/* Hamburger / Close Icon */}
        <div
          className="hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? "×" : "☰"}
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#FF9839" }}>Connect</span> With Your
          </h1>
          <span className={styles.typewriterText}>
            <Typewriter
              options={{
                strings: ["Friends", "Family", "Colleagues..."],
                autoStart: true,
                loop: true,
                delay: 80,
                deleteSpeed: 50,
              }}
            />
          </span>
          <p className={styles.para}>
            Cover a distance by Quick Connect
          </p>
          <div role="button" className={styles.getstarted}>
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="App Preview" />
        </div>
      </div>
    </div>
  );
}
