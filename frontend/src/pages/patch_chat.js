const fs = require('fs');
const p = 'VideoMeet.jsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Add CameraswitchIcon import after ArrowBackIcon
c = c.replace(
  `import ArrowBackIcon from '@mui/icons-material/ArrowBack';`,
  `import ArrowBackIcon from '@mui/icons-material/ArrowBack';\r\nimport CameraswitchIcon from '@mui/icons-material/Cameraswitch';`
);

// 2. Add facingMode state after the username state
c = c.replace(
  `    let [username, setUsername] = useState("");\r\n`,
  `    let [username, setUsername] = useState("");\r\n    let [facingMode, setFacingMode] = useState('user');\r\n`
);

// 3. Add flipCamera function after handleAudio
c = c.replace(
  `    let handleAudio = () => {\r\n        setAudio(!audio)\r\n        // getUserMedia();\r\n    }`,
  `    let handleAudio = () => {\r\n        setAudio(!audio)\r\n        // getUserMedia();\r\n    }\r\n\r\n    let flipCamera = async () => {\r\n        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';\r\n        setFacingMode(newFacingMode);\r\n        try {\r\n            // Stop current video tracks\r\n            if (window.localStream) {\r\n                window.localStream.getVideoTracks().forEach(track => track.stop());\r\n            }\r\n            // Request new stream with switched camera\r\n            const newStream = await navigator.mediaDevices.getUserMedia({\r\n                video: { facingMode: newFacingMode },\r\n                audio: audio\r\n            });\r\n            const newVideoTrack = newStream.getVideoTracks()[0];\r\n            // Update local preview\r\n            if (localVideoref.current) {\r\n                localVideoref.current.srcObject = newStream;\r\n            }\r\n            window.localStream = newStream;\r\n            // Replace track in all active peer connections (no renegotiation needed)\r\n            for (let id in connections) {\r\n                const sender = connections[id].getSenders().find(s => s.track && s.track.kind === 'video');\r\n                if (sender) sender.replaceTrack(newVideoTrack);\r\n            }\r\n        } catch (e) {\r\n            console.log('Camera flip error:', e);\r\n            setOpen({ open: true, severity: 'error', message: 'Could not switch camera' });\r\n        }\r\n    }`
);

// 4. Add flip camera button in control bar after the chat button, before closing </div>
c = c.replace(
  `                        <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>\r\n                                <ChatIcon />                        \r\n                        </IconButton>`,
  `                        <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>\r\n                                <ChatIcon />                        \r\n                        </IconButton>\r\n\r\n                        <IconButton onClick={flipCamera} title="Flip Camera">\r\n                            <CameraswitchIcon />\r\n                        </IconButton>`
);

fs.writeFileSync(p, c, 'utf8');

// Verify
const result = fs.readFileSync(p, 'utf8');
console.log('CameraswitchIcon import:', result.includes('CameraswitchIcon'));
console.log('facingMode state:', result.includes('facingMode'));
console.log('flipCamera function:', result.includes('flipCamera'));
console.log('Flip button in JSX:', result.includes('onClick={flipCamera}'));
