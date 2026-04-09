const xlsx = require('xlsx');
const path = require('path');

const data = [
    { Name: 'Senses_Board_Floor1', 'IP Address': '192.168.1.101', OS: 'Windows' },
    { Name: 'Senses_Board_Floor2', 'IP Address': '192.168.1.102', OS: 'Windows' },
    { Name: 'Main_Linux_Server', 'IP Address': '192.168.1.50', OS: 'Linux' },
    { Name: 'Android_Panel_01', 'IP Address': '192.168.1.201', OS: 'Android' }
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Systems");

const filePath = path.join(__dirname, 'sample_inventory.xlsx');
xlsx.writeFile(wb, filePath);

console.log(`Sample Excel file created at: ${filePath}`);
