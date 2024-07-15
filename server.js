const express = require('express');
const path = require('path');
const os = require('os');
const app = express();

// Caminho para os arquivos estáticos
const staticPath = path.join(__dirname, 'build');

// Novo caminho para a pasta bancodedados
const bancodedadosPath = '/home/maxwell.silva/cockpit-noc/back-end/venv/backend/public/bancodedados';

if (process.pkg) {
  const pathToStaticFiles = path.join(path.dirname(process.execPath), 'build');
  app.use(express.static(pathToStaticFiles));
  app.get('*', (req, res) => {
    res.sendFile(path.join(pathToStaticFiles, 'index.html'));
  });
} else {
  app.use(express.static(staticPath));
  app.use('/bancodedados', express.static(bancodedadosPath)); // Servir a pasta bancodedados
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.get('/download-sensor', (req, res) => {
  const file = path.join(bancodedadosPath, 'sensor.xlsx');
  res.download(file); // Defina o caminho para o arquivo XLSX
});

const PORT = process.env.PORT || 3001;

function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, () => {
  const ipAddress = getIPAddress();
  console.log(`Server is running on http://${ipAddress}:${PORT}`);
});
