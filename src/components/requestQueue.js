import axios from 'axios';

const requestQueue = [];
let isProcessing = false;
let processedSO = new Set(); // Conjunto para rastrear os SO processados

const fetchSignalData = async (pppoe) => {
  console.log(`Iniciando fetchSignalData para ${pppoe}`);
  try {
    const response = await axios.get(` http://172.26.13.52:3002/buscar-sinal?login=${pppoe}`);
    const data = response.data;

    if (response.status === 200 && data) {
      console.log(`Recebendo dados para ${pppoe}: ONU=${data.onu_rx}, OLT=${data.olt_rx}`);
      return {
        onu: data.onu_rx !== undefined ? String(data.onu_rx) : 'N/A',
        olt: data.olt_rx !== undefined ? String(data.olt_rx) : 'N/A',
      };
    } else {
      throw new Error('Erro ao buscar dados de sinal');
    }
  } catch (error) {
    console.error(`Erro ao buscar dados de sinal para ${pppoe}:`, error);
    return { onu: 'N/A', olt: 'N/A' };
  }
};

export const addToQueue = async (request) => {
  const { so } = request;
  if (!processedSO.has(so)) {
    processedSO.add(so);
    requestQueue.push(request);
    if (!isProcessing) {
      processQueue();
    }
  }
};

const processQueue = async () => {
  if (requestQueue.length === 0) {
    isProcessing = false;
    // Resetar processedSO após a fila ser processada
    processedSO = new Set();
    return;
  }

  isProcessing = true;
  const { pppoe, setSignal, setLoading } = requestQueue.shift();
  await new Promise(resolve => setTimeout(resolve, 100)); // 1 segundo de espera entre requisições

  let signalData = await fetchSignalData(pppoe);

  setSignal(signalData);
  setLoading(false);

  processQueue();
};
