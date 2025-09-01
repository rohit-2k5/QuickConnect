import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { Link, useNavigate } from 'react-router-dom'
import { Button, TextField, Snackbar, Alert, Slide } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import styles from "../styles/home.module.css";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [isHamOpen, setIsHamOpen] = useState(false);

  const [open, setOpen] = useState({open: false, severity: "", message: ""});


  const { addToUserHistory } = useContext(AuthContext);
  
  // snakbar functions
  function SlideTransition(props) {
    return <Slide {...props} direction="up" />;
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };



  let handleJoinVideoCall = async () => {
    
    if(meetingCode === ""){
      setOpen({open: true, severity: "error", message: "Metting Code is required"});
      return;
    }
    
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
      <Snackbar 
        open={open.open} 
        autoHideDuration={3000} 
        onClose={handleClose} 
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={handleClose}
          severity={open.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {open.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default withAuth(HomeComponent);
