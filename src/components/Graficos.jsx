import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const calculatePastDates = (currentDate) => {
  const pastDates = [];
  const currentDayOfWeek = currentDate.getDay();

  for (let i = 0; i <= 3; i++) {
    const pastDate = new Date(currentDate);
    pastDate.setDate(currentDate.getDate() - (7 * i));
    if (pastDate.getDay() === currentDayOfWeek) {
      pastDates.push(pastDate);
    }
  }
  return pastDates;
};

const Graficos = ({ historicoEntrantes, selectedDate }) => {
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const cores = ['rgba(255,0,0,1)', 'rgba(0,128,0,1)', 'rgba(255,165,0,1)', 'rgba(0,0,255,1)'];
  const regionais = ['Central', 'Vale & Sul', 'Campinas', 'Centro - Oeste'];
  const regionaisCompletos = ['Regional Central', 'Regional Vale & Sul', 'Regional Campinas', 'Regional Centro - Oeste'];

  const handleGraficoClick = (historico, titulo, cores, labels, regionais, regionaisCompletos) => {
    const data = {
      labels,
      datasets: regionaisCompletos.map((regionalCompleto, index) => ({
        label: regionais[index],
        data: labels.map((_, i) => historico[regionalCompleto]?.[i] || 0),
        fill: false,
        borderColor: cores[index],
        backgroundColor: cores[index], // Cor da bolinha
        pointRadius: 3, // Tamanho da bolinha nos dados
        tension: 0.4, // Suavização das linhas
      })),
    };

    const options = {
      maintainAspectRatio: false, // Permitir que o gráfico cresça
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true, // Usar estilo de ponto (bolinha) na legenda
            pointStyle: 'circle', // Estilo de ponto para bolinha
            fontColor: '#000', // Cor da fonte da legenda
            boxWidth: 5, // Tamanho da bolinha na legenda
            boxHeight: 5, // Altura da bolinha na legenda
            padding: 20, // Espaçamento entre os itens da legenda
            generateLabels: function(chart) {
              const datasets = chart.data.datasets;
              return datasets.map((dataset, i) => {
                const total = dataset.data.reduce((acc, value) => acc + value, 0);
                return {
                  text: `${dataset.label}: ${total}`,
                  fillStyle: dataset.borderColor,
                  hidden: chart.getDatasetMeta(i).hidden,
                  lineCap: dataset.borderCapStyle,
                  lineDash: dataset.borderDash,
                  lineDashOffset: dataset.borderDashOffset,
                  lineJoin: dataset.borderJoinStyle,
                  strokeStyle: dataset.borderColor,
                  pointStyle: dataset.pointStyle,
                  datasetIndex: i,
                };
              });
            },
          },
          position: 'top', // Posição da legenda
        },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y;
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Horas',
          },
          ticks: {
            autoSkip: true, // Mostrar todos os rótulos
            maxRotation: 90, // Rotação máxima dos rótulos
            minRotation: 45, // Rotação mínima dos rótulos
            stepSize: 4, // Mostrar cada hora
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Entrantes',
          },
          beginAtZero: true, // Iniciar o eixo y no zero
        },
      },
    };

    const chartWindow = window.open('', '_blank');
    chartWindow.document.write(`
      <html>
      <head>
        <title>${titulo}</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
          canvas { width: 90vw !important; height: 90vh !important; }
        </style>
      </head>
      <body>
        <canvas id="chart"></canvas>
      </body>
      </html>
    `);

    chartWindow.document.close();

    chartWindow.onload = () => {
      const ctx = chartWindow.document.getElementById('chart').getContext('2d');
      new ChartJS(ctx, {
        type: 'line',
        data: data,
        options: options,
      });
    };
  };

  const renderGrafico = (historico, titulo, cores, labels, regionais, regionaisCompletos) => {
    if (!historico) {
      console.warn(`Historico is undefined or null for ${titulo}`);
      return null;
    }
  
    const datasets = regionaisCompletos.map((regionalCompleto, index) => {
      const data = labels.map((_, i) => historico[regionalCompleto]?.[i] || 0);
      return {
        label: regionais[index],
        data,
        fill: false,
        borderColor: cores[index],
        backgroundColor: cores[index], // Cor da bolinha
        pointRadius: 3, // Tamanho da bolinha nos dados
        tension: 0.4, // Suavização das linhas
      };
    });
  
    const data = {
      labels,
      datasets,
    };
  
    const options = {
      maintainAspectRatio: false, // Permitir que o gráfico cresça
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true, // Usar estilo de ponto (bolinha) na legenda
            pointStyle: 'circle', // Estilo de ponto para bolinha
            fontColor: '#000', // Cor da fonte da legenda
            boxWidth: 5, // Tamanho da bolinha na legenda
            boxHeight: 5, // Altura da bolinha na legenda
            padding: 20, // Espaçamento entre os itens da legenda
            generateLabels: function(chart) {
              const datasets = chart.data.datasets;
              return datasets.map((dataset, i) => {
                const total = dataset.data.reduce((acc, value) => acc + value, 0);
                return {
                  text: `${dataset.label}: ${total}`,
                  fillStyle: dataset.borderColor,
                  hidden: chart.getDatasetMeta(i).hidden,
                  lineCap: dataset.borderCapStyle,
                  lineDash: dataset.borderDash,
                  lineDashOffset: dataset.borderDashOffset,
                  lineJoin: dataset.borderJoinStyle,
                  strokeStyle: dataset.borderColor,
                  pointStyle: dataset.pointStyle,
                  datasetIndex: i,
                };
              });
            },
          },
          position: 'top', // Posição da legenda
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
  
            ci.data.datasets.forEach((dataset, i) => {
              const meta = ci.getDatasetMeta(i);
              if (i !== index) {
                meta.hidden = !meta.hidden ? true : null;
              } else {
                meta.hidden = null;
              }
            });
  
            ci.update();
          },
        },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y;
              return label;
            },
          },
        },
      },
      onClick: () => {
        handleGraficoClick(historico, titulo, cores, labels, regionais, regionaisCompletos);
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Horas',
          },
          ticks: {
            autoSkip: true, // Mostrar todos os rótulos
            maxRotation: 90, // Rotação máxima dos rótulos
            minRotation: 45, // Rotação mínima dos rótulos
            stepSize: 4, // Mostrar cada hora
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Entrantes',
          },
          beginAtZero: true, // Iniciar o eixo y no zero
        },
      },
    };
  
    return (
      <div className="dashboard-grafico" style={{ height: '300px', width: '800px' }}>
        <h2>{titulo}</h2>
        <Line data={data} options={options} />
      </div>
    );
  };

  const dates = calculatePastDates(selectedDate).map(date => date.toLocaleDateString('pt-BR'));

  if (!Array.isArray(historicoEntrantes) || historicoEntrantes.length < 4) {
    console.warn('historicoEntrantes is not properly initialized or does not have enough data.');
    return <p>Dados insuficientes para mostrar os gráficos.</p>;
  }

  return (
    <div className="graficos-historico-entrantes">
      <>
        {historicoEntrantes[3] && renderGrafico(historicoEntrantes[3], `Entrantes por Regional ${dates[3]}`, cores, labels, regionais, regionaisCompletos)}
        {historicoEntrantes[2] && renderGrafico(historicoEntrantes[2], `Entrantes por Regional ${dates[2]}`, cores, labels, regionais, regionaisCompletos)}
        {historicoEntrantes[1] && renderGrafico(historicoEntrantes[1], `Entrantes por Regional ${dates[1]}`, cores, labels, regionais, regionaisCompletos)}
        {historicoEntrantes[0] && renderGrafico(historicoEntrantes[0], `Entrantes por Regional ${dates[0]}`, cores, labels, regionais, regionaisCompletos)}
      </>
    </div>
  );
};

export default Graficos;
