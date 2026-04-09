const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const chokidar = require('chokidar');

const app = express();
const port = 3000;
const inventoryPath = path.join(__dirname, 'inventory.ini');
const excelPath = path.join(__dirname, 'sample_inventory.xlsx');

// Detect if running inside Docker
const IS_DOCKER = fs.existsSync('/.dockerenv') || process.env.DOCKER_ENV === 'true';
const ANSIBLE_PREFIX = IS_DOCKER ? '' : 'wsl ';

// Hardcoded Credentials (In production, use ENV variables and hashing)
const AUTH_USER = 'admin';
const AUTH_PASS = 'scn!2122';
const AUTH_TOKEN = 'secret-senses-token-2024'; // Simple token for this session

// Middleware to protect APIs
const requireAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token === AUTH_TOKEN) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
};

app.use(express.json());
app.use(express.static('public'));

// Logic to parse Excel and update inventory.ini
const syncExcelToInventory = () => {
    try {
        if (!fs.existsSync(excelPath)) return;
        
        console.log(`Syncing: ${excelPath} to inventory.ini...`);
        const workbook = xlsx.readFile(excelPath);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        let content = "[all_systems]\n";
        data.forEach(row => {
            const host = row.Host || row.Name || row.name || 'host';
            const ip = row.IP || row.ip || row['IP Address'] || '0.0.0.0';
            const os = row.OS || row.os || 'Windows';
            content += `${host} ansible_host=${ip} os_type=${os}\n`;
        });
        
        content += "\n[all_systems:vars]\n";
        content += "ansible_user=admin\n";
        content += "ansible_password='scn!2122'\n";
        content += "ansible_port=5986\n";
        content += "ansible_connection=winrm\n";
        content += "ansible_winrm_server_cert_validation=ignore\n";
        content += "ansible_winrm_transport=ntlm\n";
        
        fs.writeFileSync(inventoryPath, content);
        console.log('Synchronization successful.');
    } catch (e) {
        console.error('Synchronization failed:', e.message);
    }
};

// Initialize File Watcher
const watcher = chokidar.watch(excelPath, {
    persistent: true,
    ignoreInitial: false
});

watcher.on('change', path => {
    console.log(`Excel file changed: ${path}`);
    syncExcelToInventory();
});

watcher.on('add', path => {
    console.log(`Excel file detected: ${path}`);
    syncExcelToInventory();
});

// Initial sync
syncExcelToInventory();

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === AUTH_USER && password === AUTH_PASS) {
        res.json({ success: true, token: AUTH_TOKEN });
    } else {
        res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
});

// API: List systems from inventory.ini
app.get('/api/systems', requireAuth, (req, res) => {
    try {
        const content = fs.readFileSync(inventoryPath, 'utf8');
        const hosts = content.split('\n')
            .filter(line => line.trim() && !line.startsWith('[') && !line.startsWith('#'))
            .map(line => {
                const parts = line.split(/\s+/);
                const name = parts[0];
                const ipPart = parts.find(p => p.startsWith('ansible_host='));
                const ip = ipPart ? ipPart.split('=')[1] : 'N/A';
                return { name, ip };
            });
        res.json(hosts);
    } catch (e) {
        res.status(500).json({ error: 'Could not read inventory' });
    }
});

// API: Ping All or Single
app.post('/api/ping', requireAuth, (req, res) => {
    const { limit } = req.body;
    let cmd = `${ANSIBLE_PREFIX}ansible-playbook ping_systems.yml`;
    if (limit) cmd += ` --limit ${limit}`;
    
    console.log(`Running: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ansible Ping Error: ${stderr || stdout}`);
            return res.status(500).json({ 
                success: false, 
                message: 'Ansible command failed. Check if Ansible is installed in WSL.',
                error: stderr || stdout || error.message 
            });
        }
        res.json({ success: true, output: stdout });
    });
});

// API: Maintenance
app.post('/api/maintenance', requireAuth, (req, res) => {
    const { limit } = req.body;
    let cmd = `${ANSIBLE_PREFIX}ansible-playbook maintenance.yml`;
    if (limit) cmd += ` --limit ${limit}`;
    
    console.log(`Running: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ansible Maintenance Error: ${stderr || stdout}`);
            return res.status(500).json({ 
                success: false, 
                message: `Maintenance failed. Ensure pywinrm is installed ${IS_DOCKER ? 'in container' : 'in WSL'}.`,
                error: stderr || stdout || error.message 
            });
        }
        res.json({ success: true, output: stdout });
    });
});

app.listen(port, () => {
    console.log(`Senses Dashboard with Auto-Sync running at http://localhost:${port}`);
    console.log(`Watching for changes in: ${excelPath}`);
});

// Global Error Handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
