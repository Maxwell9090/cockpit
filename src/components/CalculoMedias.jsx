import { useEffect, useCallback } from 'react';
import axios from 'axios';

const CalculoMedias = ({ setMediasDiarias, setMediasHorarias, selectedDate }) => {
  const calculatePastDates = (currentDate) => {
    const pastDates = [];
    for (let i = 1; i <= 3; i++) {
      const pastDate = new Date(currentDate);
      pastDate.setDate(currentDate.getDate() - (7 * i));
      pastDates.push(pastDate);
    }
    return pastDates;
  };

  const fetchHistoricalData = useCallback(async () => {
    if (!selectedDate) return []; // Verifica se selectedDate está definido
    const dates = calculatePastDates(selectedDate);
    const historicalData = [];
    for (let i = 0; i < dates.length; i++) {
      const formattedDate = dates[i].toISOString().split('T')[0];
      try {
        const response = await axios.get(' http://172.26.13.52:3002/buscar-dados-historicos', {
          params: { data: formattedDate }
        });
        console.log(`Dados históricos para ${formattedDate}:`, response.data);
        historicalData.push(...response.data);
      } catch (error) {
        console.error(`Erro ao carregar dados históricos para a data ${formattedDate}:`, error);
      }
    }
    return historicalData;
  }, [selectedDate]);

  const calculateMedias = useCallback(async () => {
    const historicalData = await fetchHistoricalData();
    if (!historicalData.length) return; // Verifica se historicalData está definido

    const aggregateData = (data) => {
      const totals = { regionais: {}, cidades: {}, hostnames: {}, projetos: {}, horas: {} };

      data.forEach(item => {
        const horaAbertura = item.hora_abertura_os ? parseInt(item.hora_abertura_os.split(':')[0], 10) : null;

        // Processar regionais
        if (item.Regional) {
          if (!totals.regionais[item.Regional]) {
            totals.regionais[item.Regional] = { total: 0, count: 0, horas: Array(24).fill(0) };
          }
          totals.regionais[item.Regional].total += 1;
          totals.regionais[item.Regional].count += 1;
          if (horaAbertura !== null) {
            totals.regionais[item.Regional].horas[horaAbertura] += 1;
          }
        }

        // Processar cidades
        if (item.cidade) {
          if (!totals.cidades[item.cidade]) {
            totals.cidades[item.cidade] = { total: 0, count: 0, horas: Array(24).fill(0) };
          }
          totals.cidades[item.cidade].total += 1;
          totals.cidades[item.cidade].count += 1;
          if (horaAbertura !== null) {
            totals.cidades[item.cidade].horas[horaAbertura] += 1;
          }
        }

        // Processar hostnames
        if (item.hostname) {
          if (!totals.hostnames[item.hostname]) {
            totals.hostnames[item.hostname] = { total: 0, count: 0, horas: Array(24).fill(0) };
          }
          totals.hostnames[item.hostname].total += 1;
          totals.hostnames[item.hostname].count += 1;
          if (horaAbertura !== null) {
            totals.hostnames[item.hostname].horas[horaAbertura] += 1;
          }
        }

        // Processar projetos
        if (item.dslam_projeto) {
          if (!totals.projetos[item.dslam_projeto]) {
            totals.projetos[item.dslam_projeto] = { total: 0, count: 0, horas: Array(24).fill(0) };
          }
          totals.projetos[item.dslam_projeto].total += 1;
          totals.projetos[item.dslam_projeto].count += 1;
          if (horaAbertura !== null) {
            totals.projetos[item.dslam_projeto].horas[horaAbertura] += 1;
          }
        }
      });

      return totals;
    };

    const totals = aggregateData(historicalData);

    console.log('Dados agregados:', totals); // Log dos dados agregados

    const calculateAverages = (totals) => {
      const averages = {};
      Object.keys(totals).forEach(category => {
        averages[category] = {};
        Object.keys(totals[category]).forEach(key => {
          averages[category][key] = {
            media: Math.round(totals[category][key].total / 3),
            total: totals[category][key].total,
            count: totals[category][key].count,
            horas: totals[category][key].horas.map(hora => Math.round(hora / 3)) // Média horária
          };
        });
      });
      return averages;
    };

    const medias = calculateAverages(totals);

    console.log('Médias calculadas:', medias); // Log das médias calculadas

    setMediasDiarias(medias);
    setMediasHorarias({
      regionais: medias.regionais,
      cidades: medias.cidades,
      hostnames: medias.hostnames,
      projetos: medias.projetos
    });
  }, [fetchHistoricalData, setMediasDiarias, setMediasHorarias]);

  useEffect(() => {
    calculateMedias();
  }, [calculateMedias]);

  return null;
};

export default CalculoMedias;
