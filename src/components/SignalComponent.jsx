import React, { useState, useEffect } from 'react';
import loadingGif from './loading.gif';
import { addToQueue } from './requestQueue'; // Certifique-se de importar a fila

const getColorForSignalValue = (value) => {
  const signalValue = parseFloat(value);
  if (value === 'N/A' || signalValue >= 0) return 'red';
  if (signalValue >= -15.9) return 'red';
  if (signalValue >= -24.9) return 'green';
  if (signalValue >= -26.9) return 'orange';
  return 'red';
};

const SignalComponent = ({ pppoe, so }) => {
  const [signal, setSignal] = useState({ onu: 'loading', olt: 'loading' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(`Adicionando SO ${so} ao addToQueue`);
    addToQueue({ pppoe, setSignal, setLoading, so });
  }, [pppoe, so]);

  const displayOnu = (signal.onu === '0' || signal.onu === '0.0' || signal.onu === 'N/A') ? 'Sem Sinal' : signal.onu;
  const displayOlt = (signal.olt === '0' || signal.olt === '0.0' || signal.olt === 'N/A') ? 'Sem Sinal' : signal.olt;

  return (
    <>
      <td style={{ color: (displayOnu === 'Sem Sinal') ? 'red' : getColorForSignalValue(signal.onu) }}>
        {loading ? <img src={loadingGif} alt="Loading" /> : displayOnu}
      </td>
      <td style={{ color: (displayOlt === 'Sem Sinal') ? 'red' : getColorForSignalValue(signal.olt) }}>
        {loading ? <img src={loadingGif} alt="Loading" /> : displayOlt}
      </td>
    </>
  );
};

export default SignalComponent;
