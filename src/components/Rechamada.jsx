import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Rechamada.css';

const Rechamada = () => {
  const [rechamadas, setRechamadas] = useState([]);

  const getBrazilianDate = (date = new Date()) => {
    const brazilTimeOffset = -3 * 60; // UTC-3
    const brazilDate = new Date(date.getTime() + (brazilTimeOffset * 60 * 1000));
    return brazilDate.toISOString().split('T')[0];
  };

  const formatTime = (timeString) => {
    if (typeof timeString === 'string') {
      const [time] = timeString.split('.');
      return time;
    }
    return timeString;
  };

  const fetchRechamadas = useCallback(async () => {
    const calculatePastDates = (currentDate) => {
      const pastDates = [];
      for (let i = 0; i < 3; i++) {
        const pastDate = new Date(currentDate);
        pastDate.setDate(currentDate.getDate() - i);
        pastDates.push(getBrazilianDate(pastDate));
      }
      return pastDates;
    };

    const today = new Date();
    const pastDates = calculatePastDates(today);
    const rechamadaData = {};

    for (const date of pastDates) {
      try {
        const response = await axios.get(' http://172.26.13.52:3002/buscar-dados-data', {
          params: { data: date }
        });
        const data = response.data;
        console.log('Fetched data:', data);

        data.forEach(item => {
          const { final_login_2, so, numero_protocolo, hora_abertura_os } = item;
          const formattedDateAbertura = formatTime(hora_abertura_os);
          if (!rechamadaData[final_login_2]) {
            rechamadaData[final_login_2] = {
              login: final_login_2,
              dates: [],
              count: 0,
              sos: [], // Adicione um array para os números da SO
              prot: [], // Adicione um array para os números da SO
              dataAbertura: [] // Adicione um array para as datas de abertura da SO
            };
          }
          rechamadaData[final_login_2].dates.push(date);
          rechamadaData[final_login_2].count++;
          rechamadaData[final_login_2].sos.push(so); // Armazene o número da SO
          rechamadaData[final_login_2].prot.push(numero_protocolo); // Armazene o número da SO
          rechamadaData[final_login_2].dataAbertura.push(formattedDateAbertura); // Armazene a data de abertura da SO formatada
        });
      } catch (error) {
        console.error('Erro ao buscar dados de rechamadas:', error);
      }
    }

    const rechamadasArray = Object.values(rechamadaData).filter(item => item.count > 1);
    console.log('Processed rechamadas:', rechamadasArray);
    setRechamadas(rechamadasArray);
  }, []);

  useEffect(() => {
    fetchRechamadas();
  }, [fetchRechamadas]);

  return (
    <div className="rechamada-container">
      <h2 className="dashboard-titulo-entrante">Rechamadas</h2>
      <table>
        <thead>
          <tr>
            <th>Login do Cliente</th>
            <th>Datas de Contato</th>
            <th>Número de Rechamadas</th>
            <th>Número da SO</th>
            <th>Número Protocolo</th>
            <th>Hora de Abertura da SO</th>
          </tr>
        </thead>
        <tbody>
          {rechamadas.map((item, index) => (
            <tr key={index}>
              <td>{item.login}</td>
              <td>{item.dates.join(', ')}</td>
              <td>{item.count}</td>
              <td>{item.sos.join(', ')}</td> {/* Exiba os números da SO */}
              <td>{item.prot.join(', ')}</td> {/* Exiba os números da SO */}
              <td>{item.dataAbertura.join(', ')}</td> {/* Exiba as datas de abertura da SO */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Rechamada;
