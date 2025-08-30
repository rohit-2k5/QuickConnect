import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { Link, useNavigate } from 'react-router-dom'
import { Button, TextField } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import styles from "../styles/home.module.css";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [isHamOpen, setIsHamOpen] = useState(false);

  const { addToUserHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <>
      <div className={styles.nav}>
        <div>
          <h2>Quick Connect</h2>
        </div>

        <div className={styles.navRightContainer}>
          {/* Hamburger */}
          <div className={styles.hamburger} onClick={() => setIsHamOpen(!isHamOpen)}>
            ☰
          </div>

          {/* Menu links */}
          <div className={`${styles.navRight} ${isHamOpen ? styles.active : ""}`}>

            <Link to={"/history"} className={styles.history}>
              History
            </Link>

            <Button
              className={styles.logoutbtn}
              variant={isHamOpen ? "" : "contained"}
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/auth");
              }}
            >
            logout
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.bodyMainContainer}>
        <div className={styles.leftSide}>
          <div className={styles.leftContent}>
            <h2 className={styles.joinText}>Join Meeting</h2>

            <TextField
              className={styles.input}
              onChange={(e) => setMeetingCode(e.target.value)}
              id="outlined-basic"
              label="Meeting Code"
              variant="outlined"
            />

            <Button
              className={styles.joinbtn}
              onClick={handleJoinVideoCall}
              variant="contained"
            >
              Join
            </Button>
          </div>
        </div>

        <div className={styles.righSide}>
          <img className={styles.img} srcSet="/logo3.png" alt="" />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);
