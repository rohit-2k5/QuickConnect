const fs = require('fs');
const p = 'VideoMeet.jsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/style=\{\{\s*marginBottom:\s*"12px",\s*padding:\s*"8px 12px",\s*backgroundColor:\s*"#f0f0f0",\s*borderRadius:\s*"8px",\s*maxWidth:\s*"85%"\s*\}\}/g, 'className={styles.messageWrapper}');
c = c.replace(/style=\{\{\s*fontWeight:\s*"bold",\s*color:\s*"#075e54",\s*margin:\s*"0 0 4px 0",\s*fontSize:\s*"14px"\s*\}\}/g, 'className={styles.messageSender}');
c = c.replace(/style=\{\{\s*margin:\s*"0",\s*color:\s*"#333",\s*fontSize:\s*"14px",\s*lineHeight:\s*"1\.4"\s*\}\}/g, 'className={styles.messageContent}');

fs.writeFileSync(p, c, 'utf8');
console.log('Done');
