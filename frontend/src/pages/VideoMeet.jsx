import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Snackbar, Alert, Slide, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },   // Google STUN
    {
      urls: "turn:relay1.expressturn.com:3478", // Public TURN server
      username: "ef1WfK4a4Z9p9Kmg",             // demo credentials
      credential: "rZ2Vj2aQK6nXvJv8"
    }
  ]
};


export default function VideoMeetComponent() {

    const [open, setOpen] = useState({open: false, severity: "", message: ""});
    const [showRefreshDialog, setShowRefreshDialog] = useState(false);
    const [isInMeeting, setIsInMeeting] = useState(false);
    

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])
    const chatDisplayRef = useRef(null)

    let [videos, setVideos] = useState([])

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

    // Check for saved meeting state on component mount
    useEffect(() => {
        const savedMeetingState = localStorage.getItem('quickConnect_meeting_state');
        if (savedMeetingState) {
            try {
                const state = JSON.parse(savedMeetingState);
                if (state.username && state.meetingUrl === window.location.href) {
                    setUsername(state.username);
                    setAskForUsername(false);
                    setIsInMeeting(true);
                    // Auto-rejoin the meeting
                    setTimeout(() => {
                        getMedia();
                    }, 1000);
                }
            } catch (error) {
                console.log('Error parsing saved meeting state:', error);
                localStorage.removeItem('quickConnect_meeting_state');
            }
        }
    }, []);

    // Save meeting state to localStorage
    const saveMeetingState = () => {
        if (username && !askForUsername) {
            const meetingState = {
                username: username,
                meetingUrl: window.location.href,
                timestamp: Date.now()
            };
            localStorage.setItem('quickConnect_meeting_state', JSON.stringify(meetingState));
        }
    };

    // Clear meeting state from localStorage
    const clearMeetingState = () => {
        localStorage.removeItem('quickConnect_meeting_state');
    };

    // Handle beforeunload event to prevent accidental refresh
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isInMeeting && !askForUsername) {
                const message = 'Are you sure you want to leave the meeting? You will be disconnected.';
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isInMeeting) {
                saveMeetingState();
            }
        };

        const handleKeyDown = (e) => {
            // Prevent F5, Ctrl+R, Ctrl+Shift+R
            if (isInMeeting && !askForUsername) {
                if (e.key === 'F5' || 
                    (e.ctrlKey && e.key === 'r') || 
                    (e.ctrlKey && e.shiftKey && e.key === 'R')) {
                    e.preventDefault();
                    setShowRefreshDialog(true);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isInMeeting, askForUsername]);

    // Save meeting state whenever meeting state changes
    useEffect(() => {
        if (isInMeeting && !askForUsername) {
            saveMeetingState();
        }
    }, [isInMeeting, askForUsername, username]);

    // Cleanup function for when component unmounts
    useEffect(() => {
        return () => {
            if (socketRef.current && isInMeeting) {
                socketRef.current.disconnect();
            }
        };
    }, [isInMeeting]);

    useEffect(() => {
        getPermissions();
    })

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }


    }, [video, audio])
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatDisplayRef.current && messages.length > 0) {
            requestAnimationFrame(() => {
                chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
            });
        }
    }, [messages])

    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        clearMeetingState();
        setIsInMeeting(false);
        window.location.href = "/home"
    }


    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    }

    
    let connect = () => {
        
        if(username === ""){
            setOpen({open: true, severity: "error", message: "Please Select a name for Yourself"});
            return;
        }
        setAskForUsername(false);
        setIsInMeeting(true);
        getMedia();
    }

    const handleclosechat = () =>{
        setModal(false);
    }


    return (
        <div>

            {/* Refresh Prevention Dialog */}
            <Dialog
                open={showRefreshDialog}
                onClose={() => setShowRefreshDialog(false)}
                aria-labelledby="refresh-dialog-title"
            >
                <DialogTitle id="refresh-dialog-title">
                    Leave Meeting?
                </DialogTitle>
                <DialogContent>
                    Are you sure you want to leave the meeting? You will be disconnected from the call.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRefreshDialog(false)} color="primary">
                        Stay in Meeting
                    </Button>
                    <Button onClick={() => {
                        setShowRefreshDialog(false);
                        clearMeetingState();
                        window.location.reload();
                    }} color="secondary">
                        Leave Meeting
                    </Button>
                </DialogActions>
            </Dialog>

            {askForUsername === true ?

                <div className={styles.permissionMainBox}>
                    <div className={styles.permissionLeft}>
                        <div className={styles.permissionLeftContent}>
                            <h2 style={{marginBottom: "0.5rem"}}>Select a Name For Yourself</h2>
                            <TextField id="outlined-basic" label="Name For Videocall" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                            <Button className={styles.permissionBtn} variant="contained" onClick={connect}>Connect</Button>
                        </div>
                    </div>

                    <div className={styles.permissionRight}>
                       <div className={styles.videoContainer}><video className={styles.videoPreview} ref={localVideoref} autoPlay muted></video></div>
                        <div>
                            <h2 className={styles.yourPreviewText}>Your Preview...</h2>
                        </div>
                    </div>
                </div> :


                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>

                        <div className={styles.chatContainer}>
                            <div style={{display: "flex", alignItems: "center", position: "sticky", top: "0rem", backgroundColor: "white", marginLeft: "1rem", marginBottom: "1rem"}}><ArrowBackIcon onClick={handleclosechat} sx={{height: "4rem", width: "2rem", marginRight: "1rem"}}/>Chats</div>

                            <div className={styles.chattingDisplay} ref={chatDisplayRef}>

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div style={{ 
                                            marginBottom: "12px", 
                                            padding: "8px 12px",
                                            backgroundColor: "#f0f0f0",
                                            borderRadius: "8px",
                                            maxWidth: "85%"
                                        }} key={index}>
                                            <p style={{ 
                                                fontWeight: "bold", 
                                                color: "#075e54",
                                                margin: "0 0 4px 0",
                                                fontSize: "14px"
                                            }}>{item.sender}</p>
                                            <p style={{ 
                                                margin: "0",
                                                color: "#333",
                                                fontSize: "14px",
                                                lineHeight: "1.4"
                                            }}>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}


                            </div>

                            <div className={styles.chattingArea}>
                                <TextField  
                                    className='chatareainput' 
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)} 
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                    style={{width: "70%"}} 
                                    placeholder='Type your message here' 
                                    id="outlined-basic" 
                                    variant="outlined" 
                                />
                                <Button className='chatareasendbutton' variant='contained' onClick={sendMessage}><SendIcon></SendIcon></Button>
                            </div>


                        </div>
                    </div> : <></>}


                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "greenyellow" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>

                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> :
                            <></>
                        }

                        
                        <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                        
                        </IconButton>
                        

                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={`${styles.conferenceView} ${styles[`conferenceView${videos.length}`]}`}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

                </div>

            }
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

           
           
        </div>
    )
}
