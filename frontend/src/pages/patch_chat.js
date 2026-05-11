const fs = require('fs');
const p = 'VideoMeet.jsx';
let c = fs.readFileSync(p, 'utf8');

// Fix 1: Guard srcObject assignment so it doesn't flicker on every render
c = c.replace(
  /ref=\{ref => \{\r?\n\s*if \(ref && video\.stream\) \{\r?\n\s*ref\.srcObject = video\.stream;\r?\n\s*\}\r?\n\s*\}\}/,
  `ref={ref => {\r\n                                    if (ref && video.stream && ref.srcObject !== video.stream) {\r\n                                        ref.srcObject = video.stream;\r\n                                    }\r\n                                }}`
);

// Fix 2: user-left now receives (id, leftUsername) - update the handler to show a toast
c = c.replace(
  /socketRef\.current\.on\('user-left', \(id\) => \{\r?\n\s*setVideos\(\(videos\) => videos\.filter\(\(video\) => video\.socketId !== id\)\)\r?\n\s*\}\)/,
  `socketRef.current.on('user-left', (id, leftUsername) => {\r\n                setVideos((videos) => videos.filter((video) => video.socketId !== id));\r\n                setOpen({ open: true, severity: 'info', message: \`\${leftUsername || 'A participant'} left the call\` });\r\n            })`
);

// Fix 3: Remove the hardcoded white backgroundColor from the chat header inline style
c = c.replace(
  /style=\{\{display: "flex", alignItems: "center", position: "sticky", top: "0rem", backgroundColor: "white", marginLeft: "1rem", marginBottom: "1rem"\}\}/,
  `className={styles.chatHeader}`
);

fs.writeFileSync(p, c, 'utf8');
console.log('Done');
