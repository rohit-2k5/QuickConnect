const fs = require('fs');
const p = 'authentication.jsx';
let c = fs.readFileSync(p, 'utf8');

// The exact old string with CRLF line endings and single quotes as in the file
const old = `                           <div style={{display: "flex"}}>\r\n                             <HomeIcon style={{ cursor: "pointer" }} onClick={() => navigate('/')}></HomeIcon>\r\n                             <p style={{marginLeft:"0.1rem", marginTop:"0.1rem"}}>Home</p>\r\n                            </div>`;

const rep = `                           <div style={{display: "flex", cursor: "pointer"}} onClick={() => navigate('/')}>\r\n                             <HomeIcon></HomeIcon>\r\n                             <p style={{marginLeft:"0.1rem", marginTop:"0.1rem"}}>Home</p>\r\n                           </div>`;

if (c.includes(old)) {
  c = c.replace(old, rep);
  fs.writeFileSync(p, c, 'utf8');
  console.log('SUCCESS: Home button onClick moved to div wrapper');
} else {
  console.log('NOT FOUND - dumping lines 160-163:');
  const lines = c.split('\n');
  [159,160,161,162].forEach(i => console.log(i+1, JSON.stringify(lines[i])));
}
