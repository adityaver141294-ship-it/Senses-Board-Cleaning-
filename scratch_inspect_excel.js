const xlsx = require('xlsx');
const path = 'C:\\Users\\admin\\Downloads\\Import _Format.xlsx';

try {
    const workbook = xlsx.readFile(path);
    console.log('Sheet Names:', workbook.SheetNames);
    workbook.SheetNames.forEach(name => {
        const worksheet = workbook.Sheets[name];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`--- Sheet: ${name} ---`);
        console.log('Headers:', data[0]);
        if (data[1]) console.log('Sample Row:', data[1]);
    });
} catch (e) {
    console.error('Error reading file:', e.message);
}
