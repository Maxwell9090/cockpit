import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import Sidebar from './Sidebar';
import axios from 'axios';
import alertGif from './farol.gif'; 
import warningGif from './warning.gif'; 
import Graficos from './Graficos.jsx';
import Rechamada from './Rechamada.jsx'; // Importar o componente Rechamada
import CalculoMedias from './CalculoMedias.jsx'; // Importar o novo componente
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DashboardItem = ({ title, number, onClick }) => (
  <div className="dashboard-item" onClick={onClick}>
    <div className="dashboard-item-header">
      <div className="dashboard-item-title">{title}</div>
      <div className="dashboard-item-number">{number}</div>
    </div>
  </div>
);

const DashboardCard = ({ title, items, cardStyle, onItemClick }) => (
  <div className={`dashboard-card ${cardStyle}`}>
    <div className="dashboard-card-title">
      {title}
    </div>
    {items.map((item, index) => (
      <DashboardItem key={index} {...item} onClick={() => onItemClick(item.title)} />
    ))}
  </div>
);

const inicializarContagemHoras = (chaves) => {
  return chaves.reduce((acc, chave) => {
    acc[chave] = Array(24).fill(0);
    return acc;
  }, {});
};

const extractHour = (horaAberturaOs) => {
  if (typeof horaAberturaOs === 'string') {
    const [hour] = horaAberturaOs.split(':');
    return parseInt(hour, 10);
  }
  return null;
};

const getBrazilianDate = (date = new Date()) => {
  const brazilTimeOffset = -3 * 60; // UTC-3
  const brazilDate = new Date(date.getTime() + (brazilTimeOffset * 60 * 1000));
  return brazilDate.toISOString().split('T')[0];
};

const Dashboard = () => {
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [dadosLocalizacoes, setDadosLocalizacoes] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isAutoChangeEnabled, setIsAutoChangeEnabled] = useState(false);
  const [entrantesPorHora, setEntrantesPorHora] = useState({});
  const [entrantesPorCidade, setEntrantesPorCidade] = useState({});
  const [entrantesPorHostname, setEntrantesPorHostname] = useState({});
  const [entrantesPorProjeto, setEntrantesPorProjeto] = useState({});
  const [top10Cidades, setTop10Cidades] = useState([]);
  const [top10Hostnames, setTop10Hostnames] = useState([]);
  const [top10Projetos, setTop10Projetos] = useState([]);
  const [pageTitle, setPageTitle] = useState('Painel de Entrantes');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mediasDiarias, setMediasDiarias] = useState({});
  const [mediasHorarias, setMediasHorarias] = useState({});
  const [possiveisEventosMassivos, setPossiveisEventosMassivos] = useState([]);
  const [historicoEntrantes, setHistoricoEntrantes] = useState([[], [], [], []]);
  const [showMoreCidade, setShowMoreCidade] = useState(false);
  const [showMoreHostname, setShowMoreHostname] = useState(false);
  const [showMoreProjeto, setShowMoreProjeto] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false); // Estado para controlar o ícone de atualização
  
 
  const toggleShowMoreCidade = () => setShowMoreCidade(!showMoreCidade);
  const toggleShowMoreHostname = () => setShowMoreHostname(!showMoreHostname);
  const toggleShowMoreProjeto = () => setShowMoreProjeto(!showMoreProjeto);

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

 

  const identificarEventosMassivos = useCallback((data) => {
    const contagemEventos = data.reduce((acc, item) => {
      const chave = `${item.hostname}|${item.dslam_projeto}|${item.primaria}|${item.caixa}`;
      if (!acc[chave]) {
        acc[chave] = [];
      }
      acc[chave].push(item);
      return acc;
    }, {});
  
    const updatedEventos = Object.entries(contagemEventos).map(([chave, eventos]) => {
      const [hostname, dslam_projeto, primaria, caixa] = chave.split('|');
      const cidade = eventos[0].cidade;
      const total = eventos.length;
      const analisado = eventos.filter(evento => evento.analisado === 1).length;
  
      return {
        cidade,
        hostname,
        dslam_projeto,
        primaria,
        caixa,
        total,
        analisado,
        status: eventos[0].analisado === 1 ? 'Analisado' : '',
        comment: eventos[0].comentario || '',
        eventos: eventos
      };
    });
  
    const eventosPorPrimaria = Object.values(updatedEventos.reduce((acc, evento) => {
      const chavePrimaria = `${evento.dslam_projeto}|${evento.hostname}|${evento.primaria}`;
      if (!acc[chavePrimaria]) {
        acc[chavePrimaria] = {
          ...evento,
          total: 0,
          analisado: 0,
          caixas: []
        };
      }
      acc[chavePrimaria].total += evento.total;
      acc[chavePrimaria].analisado += evento.analisado;
      acc[chavePrimaria].caixas.push({
        caixa: evento.caixa,
        total: evento.total,
        eventos: evento.eventos
      });
      return acc;
    }, {}));
  
    setPossiveisEventosMassivos(eventosPorPrimaria);
  
    // Detectar novos eventos massivos e definir linhas piscantes
    const novosEventos = eventosPorPrimaria.filter(evento => evento.total >= 2);
    const novasLinhasPiscantes = {};
    const filaEventos = [];
  
    novosEventos.forEach(evento => {
      const chavePrimaria = `${evento.dslam_projeto}|${evento.hostname}|${evento.primaria}`;
      if (evento.caixas.some(caixa => caixa.eventos.some(e => e.analisado !== 1))) {
        novasLinhasPiscantes[chavePrimaria] = true;
        filaEventos.push(evento);
      } else {
        novasLinhasPiscantes[chavePrimaria] = false;
      }
    });
  

  }, []);

  const atualizargraficos = useCallback(async (date) => {
    setIsUpdating(true); // Iniciar atualização
    const historico = [[], [], [], []];
    const dates = calculatePastDates(date);
  
    for (let i = 0; i < 4; i++) {
      const dataHistorico = getBrazilianDate(dates[i]); // Usa a data correta no horário local do Brasil
      try {
        const response = await axios.get(` http://172.26.13.52:3002/buscar-dados-historicos`, {
          params: { data: dataHistorico }
        });
  
        const jsonData = response.data;
  
        const horasContagem = jsonData.reduce((acc, item) => {
          const hora = extractHour(item.hora_abertura_os);
          const regional = item.Regional;
          if (!acc[regional]) {
            acc[regional] = Array(24).fill(0);
          }
          if (!acc[regional][hora]) {
            acc[regional][hora] = 0;
          }
          acc[regional][hora]++;
          return acc;
        }, {});
  
        historico[i] = horasContagem;
      } catch (error) {
        console.error('Erro ao carregar dados do banco de dados:', error);
      }
    }
  
    setHistoricoEntrantes(historico);
    setIsUpdating(false); // Concluir atualização
  }, []);

  const updateDashboardItems = useCallback((data) => {
    const updateEntrantesPor = (filtro, setState) => {
      const contagem = data.reduce((acc, item) => {
        const chave = item[filtro];
        if (!acc[chave]) {
          acc[chave] = 0;
        }
        acc[chave]++;
        return acc;
      }, {});

      const top10 = Object.entries(contagem)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([title, number]) => ({ title, number }));

      setState(top10);
    }

    updateEntrantesPor('cidade', setTop10Cidades);
    updateEntrantesPor('hostname', setTop10Hostnames);
    updateEntrantesPor('dslam_projeto', setTop10Projetos);

    const cidadesContagem = data.reduce((acc, item) => {
      const chave = item.cidade;
      const hora = extractHour(item.hora_abertura_os);
      if (!acc[chave]) {
        acc[chave] = Array(24).fill(0);
      }
      if (hora !== null) acc[chave][hora]++;
      return acc;
    }, {});
    setEntrantesPorCidade(cidadesContagem);

    const hostnamesContagem = data.reduce((acc, item) => {
      const chave = item.hostname;
      const hora = extractHour(item.hora_abertura_os);
      if (!acc[chave]) {
        acc[chave] = Array(24).fill(0);
      }
      if (hora !== null) acc[chave][hora]++;
      return acc;
    }, {});
    setEntrantesPorHostname(hostnamesContagem);

    const projetosContagem = data.reduce((acc, item) => {
      const chave = item.dslam_projeto;
      const hora = extractHour(item.hora_abertura_os);
      if (!acc[chave]) {
        acc[chave] = Array(24).fill(0);
      }
      if (hora !== null) acc[chave][hora]++;
      return acc;
    }, {});
    setEntrantesPorProjeto(projetosContagem);
  }, []);


  const atualizarfrontdata = useCallback(async (date) => {
    setIsUpdating(true); // Iniciar atualização
    const formattedDate = getBrazilianDate(date);
    console.log('Fetching data for date:', formattedDate); // Log para verificar a data
    try {
      const response = await axios.get(' http://172.26.13.52:3002/buscar-dados-data', {
        params: { data: formattedDate }
      });
      const newData = response.data;
      console.log('Fetched data:', newData); // Log para verificar os dados buscados
      setDadosLocalizacoes(newData);
  
      let filteredData = newData;
      if (selectedRegion !== 'Todas') {
        filteredData = newData.filter(item => item.Regional === selectedRegion);
      }
      console.log('Filtered data:', filteredData); // Log para verificar os dados filtrados
      updateDashboardItems(filteredData);
      identificarEventosMassivos(filteredData);
    } catch (error) {
      console.error('Erro ao carregar dados do banco de dados:', error);
    }
     setIsUpdating(false); // Concluir atualização
  }, [selectedRegion, updateDashboardItems, identificarEventosMassivos]); // Adicionar identificarEventosMassivos aqui

  // No início da função atualizarfront
  const atualizarfront = useCallback(async (date) => {
    setIsUpdating(true); // Iniciar atualização
    const formattedDate = getBrazilianDate(date);
    console.log('Fetching data for date:', formattedDate); // Log para verificar a data
    try {
      const response = await axios.get(' http://172.26.13.52:3002/buscar-dados', {
        params: { data: formattedDate }
      });
      const newData = response.data;
      console.log('Fetched data:', newData); // Log para verificar os dados buscados
      setDadosLocalizacoes(newData);
  
      let filteredData = newData;
      if (selectedRegion !== 'Todas') {
        filteredData = newData.filter(item => item.Regional === selectedRegion);
      }
      console.log('Filtered data:', filteredData); // Log para verificar os dados filtrados
      updateDashboardItems(filteredData);
      identificarEventosMassivos(filteredData);
    } catch (error) {
      console.error('Erro ao carregar dados do banco de dados:', error);
    }
    setIsUpdating(false); // Concluir atualização
  }, [selectedRegion, updateDashboardItems, identificarEventosMassivos]); // Adicionar identificarEventosMassivos aqui

  const atualizardados = useCallback(async () => {
    setIsUpdating(true); // Iniciar atualização
    try {
      const response = await fetch(' http://172.26.13.52:3002/atualizar-dados');
      if (response.ok) {
        const result = await response.json();
        console.log('Dados atualizados com sucesso:', result);
      } else {
        console.error('Erro ao atualizar os dados:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao fazer a requisição para atualizar os dados:', error);
    }
    setIsUpdating(false); // Concluir atualização
  }, []);

  useEffect(() => {
    atualizargraficos(selectedDate);
  }, [atualizargraficos, selectedDate]);

  const handleRegionChange = (region, event) => {
    setSelectedRegion(region);
    if (event) {
      const clickedButton = event.currentTarget;
      document.querySelectorAll('.region-buttons-container button').forEach(button => {
        button.classList.remove('blinking');
        button.classList.remove('laser-effect');
      });
      clickedButton.classList.add('blinking');
      setTimeout(() => {
        if (clickedButton) {
          clickedButton.classList.remove('blinking');
          clickedButton.classList.add('laser-effect');
        }
      }, 1200);
    }

    let titulo;
    if (region === 'Todas') {
      titulo = 'Painel de Entrantes';
    } else if (region === 'Regional Central') {
      titulo = 'Painel de Entrantes Regional Central';
    } else if (region === 'Regional Campinas') {
      titulo = 'Painel de Entrantes Regional Campinas';
    } else if (region === 'Regional Vale & Sul') {
      titulo = 'Painel de Entrantes Regional Vale & Sul';
    } else if (region === 'Regional Centro - Oeste') {
      titulo = 'Painel de Entrantes Regional Centro - Oeste';
    } else {
      titulo = region;
    }
    setPageTitle(titulo);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    atualizarfrontdata(date); // Corrigir aqui para passar a data correta
  };

  useEffect(() => {
    console.log('Selected date changed:', selectedDate);
    atualizarfrontdata(selectedDate);
  }, [selectedRegion, selectedDate, atualizarfrontdata]);

  // Atualiza os dados a cada 10 minutos
useEffect(() => {
  const intervalId = setInterval(() => {
    atualizardados();
  }, 600000); // 600000ms = 10 minutos

  // Cleanup interval on component unmount
  return () => clearInterval(intervalId);
}, [atualizardados]);

// Atualiza a função atualizarfront a cada 1 minuto
useEffect(() => {
  const intervalId = setInterval(() => {
    atualizarfront(selectedDate);
  }, 60000); // 60000ms = 1 minuto

  // Cleanup interval on component unmount
  return () => clearInterval(intervalId);
}, [atualizarfront, selectedDate]);

// Atualiza a função atualizargraficos a cada 1 minuto
useEffect(() => {
  const intervalId = setInterval(() => {
    atualizargraficos(selectedDate);
  }, 60000); // 60000ms = 1 minuto

  // Cleanup interval on component unmount
  return () => clearInterval(intervalId);
}, [atualizargraficos, selectedDate]);

 
  const toggleSidebar = () => {
    setIsSidebarVisible(prevState => !prevState);
  };

  const toggleAutoChange = () => {
    setIsAutoChangeEnabled(prevState => !prevState);
  };

  useEffect(() => {
    const regionais = ['Regional Central', 'Regional Vale & Sul', 'Regional Campinas', 'Regional Centro - Oeste', 'Total de Entrantes'];
    const cidades = [...new Set(dadosLocalizacoes.map(item => item.cidade))];
    const hostnames = [...new Set(dadosLocalizacoes.map(item => item.hostname))];
    const projetos = [...new Set(dadosLocalizacoes.map(item => item.dslam_projeto))];

    const entrantesInicializados = inicializarContagemHoras(regionais);
    const entrantesInicializadosPorCidade = inicializarContagemHoras(cidades);
    const entrantesInicializadosPorHostname = inicializarContagemHoras(hostnames);
    const entrantesInicializadosPorProjeto = inicializarContagemHoras(projetos);
    const totalEntrantesPorHora = Array(24).fill(0);

    dadosLocalizacoes.forEach(item => {
      const horaAbertura = extractHour(item.hora_abertura_os);

      if (item.descricao_os === 'Reparo') {
        if (horaAbertura >= 0 && horaAbertura < 24) {
          if (entrantesInicializados[item.Regional]) {
            entrantesInicializados[item.Regional][horaAbertura]++;
          }
          if (entrantesInicializadosPorCidade[item.cidade]) {
            entrantesInicializadosPorCidade[item.cidade][horaAbertura]++;
          }
          if (entrantesInicializadosPorHostname[item.hostname]) {
            entrantesInicializadosPorHostname[item.hostname][horaAbertura]++;
          }
          if (entrantesInicializadosPorProjeto[item.dslam_projeto]) {
            entrantesInicializadosPorProjeto[item.dslam_projeto][horaAbertura]++;
          }
          totalEntrantesPorHora[horaAbertura]++;
        }
      }
    });

    entrantesInicializados['Total de Entrantes'] = totalEntrantesPorHora;
    setEntrantesPorHora(entrantesInicializados);
    setEntrantesPorCidade(entrantesInicializadosPorCidade);
    setEntrantesPorHostname(entrantesInicializadosPorHostname);
    setEntrantesPorProjeto(entrantesInicializadosPorProjeto);
  }, [dadosLocalizacoes]);

  const handleCardClick = (tipo, valor, hora = null) => {
    const formattedDate = getBrazilianDate(selectedDate);
    const url = new URL(window.location);
    url.pathname = '/detalhes';
    url.searchParams.set('tipo', tipo);
    url.searchParams.set('valor', valor);
    url.searchParams.set('data', formattedDate);
    if (hora !== null) {
      url.searchParams.set('hora', hora);
    }
    window.open(url.toString(), '_blank');
  };

  const renderTabelaEntrantes = (dados, titulo, filtro, colunaNome, tipoMedia, showMore, toggleShowMore) => {
    const handleCellClick = (tipo, valor, hora = null) => {
      const formattedDate = getBrazilianDate(selectedDate);
      const url = new URL(window.location);
      url.pathname = '/detalhes';
      url.searchParams.set('tipo', tipo);
      url.searchParams.set('valor', valor);
      url.searchParams.set('data', formattedDate);
      if (hora !== null) {
        url.searchParams.set('hora', hora);
      }
      window.open(url.toString(), '_blank');
    };
  
    const dadosOrdenados = Object.entries(dados)
      .filter(([chave]) => selectedRegion === 'Todas' || dadosLocalizacoes.some(item => item[filtro] === chave && item.Regional === selectedRegion))
      .sort((a, b) => b[1].reduce((acc, current) => acc + current, 0) - a[1].reduce((acc, current) => acc + current, 0));
  
    const totalEntrantes = dadosOrdenados.find(([chave]) => chave === 'Total de Entrantes');
    const dadosSemTotal = dadosOrdenados.filter(([chave]) => chave !== 'Total de Entrantes');
    
    const dadosComStatus = dadosSemTotal.map(([chave, horas]) => {
      const somaTotal = horas.reduce((acc, current) => acc + current, 0);
      const mediaData = mediasDiarias[tipoMedia]?.[chave] || { media: 0, horas: Array(24).fill(0) };
      const horasMedia = mediasHorarias[tipoMedia]?.[chave]?.horas || Array(24).fill(0);
      let statusImg = '/ballgreen.png';
  
      if (somaTotal >= mediaData.media) {
        statusImg = '/ballred.png';
      } else if (somaTotal >= mediaData.media - 1) {
        statusImg = '/ballyellow.png';
      }
  
      console.log(`Média horária para ${chave}:`, horasMedia); // Log para verificar as médias horárias
  
      return { chave, horas, statusImg, somaTotal, media: mediaData.media, horasMedia };
    });
  
    const dadosOrdenadosPorStatus = dadosComStatus.sort((a, b) => {
      if (a.statusImg === '/ballred.png' && b.statusImg !== '/ballred.png') return -1;
      if (a.statusImg !== '/ballred.png' && b.statusImg === '/ballred.png') return 1;
      if (a.statusImg === '/ballyellow.png' && b.statusImg !== '/ballyellow.png') return -1;
      if (a.statusImg !== '/ballyellow.png' && b.statusImg === '/ballyellow.png') return 1;
      return b.somaTotal - a.somaTotal;
    });
  
    return (
      <div className="dashboard-entrantes">
        <h2 className="dashboard-titulo-entrante">{titulo}</h2>
        {dadosSemTotal.length > 5 && (
          <div className="show-more" onClick={toggleShowMore}>
            {showMore ? 'Ver menos' : 'Ver mais'}
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>{colunaNome}</th>
              <th>Média</th>
              <th>Real</th>
              <th>Status</th>
              {Array.from({ length: 24 }, (_, i) => (
                <th key={i}>{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosOrdenadosPorStatus.slice(0, showMore ? dadosOrdenadosPorStatus.length : 5).map(({ chave, horas, statusImg, somaTotal, media, horasMedia }) => (
              <tr key={chave}>
                <td className="clickable" onClick={() => handleCellClick(filtro, chave)}>{chave}</td>
                <td>{media}</td>
                <td>{somaTotal}</td>
                <td>
                  <img src={statusImg} alt="status" style={{ width: '20px', height: '20px' }} />
                </td>
                {horas.map((contagem, index) => {
                  const mediaHora = horasMedia[index] || 0;
                  let cellStyle = { backgroundColor: '' };
  
                  if (contagem > mediaHora) {
                    cellStyle.backgroundColor = 'red';
                  } else if (contagem > 0 && contagem >= mediaHora - 1) {
                    cellStyle.backgroundColor = 'yellow';
                  }
  
                  return (
                    <td
                      key={index}
                      className={contagem > 0 ? "clickable" : ""}
                      onClick={() => contagem > 0 && handleCellClick(filtro, chave, index)}
                      style={cellStyle}
                    >
                      {contagem === 0 ? '' : contagem}
                    </td>
                  );
                })}
              </tr>
            ))}
            {totalEntrantes && (
              <tr key="total-entrantes" className="total-entrantes-row">
                <td>{totalEntrantes[0]}</td>
                <td>-</td> {/* Adicionado espaço para a coluna "Média" */}
                <td>{totalEntrantes[1].reduce((acc, current) => acc + current, 0)}</td>
                <td></td> {/* Adicionado espaço para a coluna "Status" */}
                {totalEntrantes[1].map((contagem, index) => (
                  <td key={index}>{contagem === 0 ? '' : contagem}</td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const formatarHora = (horaString) => {
    if (typeof horaString === 'string') {
      const [hora, minuto, segundo] = horaString.split(':');
      return `${hora}:${minuto}:${segundo.split('.')[0]}`;
    }
    return horaString;
  };
  
  const renderTabelaEventosMassivos = (eventos) => {
    const handleEventClick = (evento) => {
      const formattedDate = getBrazilianDate(selectedDate);
      const url = new URL(window.location);
      url.pathname = '/detalhes';
      url.searchParams.set('tipo', 'massivo');
      url.searchParams.set('projeto', evento.dslam_projeto);
      url.searchParams.set('hostname', evento.hostname);
      url.searchParams.set('primaria', evento.primaria);
      url.searchParams.set('caixa', evento.caixa);
      url.searchParams.set('causa', evento.causa);
      url.searchParams.set('data', formattedDate);
      window.open(url.toString(), '_blank');
    };
  
    const handleExpandClick = (eventKey) => {
      setExpandedEvent((prevExpandedEvent) =>
        prevExpandedEvent === eventKey ? null : eventKey
      );
    };
  
    const eventosFiltrados = eventos.filter(evento => evento.total >= 2);
  
    const eventosComStatus = eventosFiltrados.map(evento => {
      let statusImg = '/ballgreen.png';
  
      if (evento.total >= 3) {
        statusImg = alertGif;
      } else if (evento.total >= 2) {
        statusImg = warningGif;
      }
  
      return { ...evento, statusImg };
    });
  
    const eventosOrdenados = eventosComStatus.sort((a, b) => {
      if (a.statusImg === alertGif && b.statusImg !== alertGif) return -1;
      if (a.statusImg !== alertGif && b.statusImg === alertGif) return 1;
      if (a.statusImg === warningGif && b.statusImg !== warningGif) return -1;
      if (a.statusImg !== warningGif && b.statusImg === warningGif) return 1;
      return b.total - a.total;
    });
  
    return (
      <div className="dashboard-entrantes">
        <h2 className="dashboard-titulo-entrante">Possíveis Eventos Massivos</h2>
        <table>
          <thead>
            <tr>
              <th>Cidade</th>
              <th>Projeto</th>
              <th>Hostname</th>
              <th>Primária</th>
              <th>Caixa</th>
              <th>Total</th>
              <th>Status</th>
              <th>Analisado</th>
              <th>Expandir</th>
            </tr>
          </thead>
          <tbody>
            {eventosOrdenados.map((evento, index) => (
              <React.Fragment key={index}>
                <tr onDoubleClick={() => handleExpandClick(index)}>
                  <td onClick={() => handleEventClick(evento)}>{evento.cidade}</td>
                  <td>{evento.dslam_projeto}</td>
                  <td>{evento.hostname}</td>
                  <td>{evento.primaria}</td>
                  <td className="caixa-column">
                    {evento.caixas.map((caixa, i) => (
                      <React.Fragment key={i}>
                        {caixa.caixa}({caixa.total})
                        <br />
                      </React.Fragment>
                    ))}
                  </td>
                  <td>{evento.total}</td>
                  <td>
                    <img src={evento.statusImg} alt="status" style={{ width: '20px', height: '20px' }} />
                  </td>
                  <td>
                    {evento.caixas.every(caixa => caixa.eventos.every(e => e.analisado === 1))
                      ? <span style={{ color: 'green' }}>✔️</span>
                      : <span style={{ color: 'red' }}>❌</span>}
                  </td>
                  <td>
                    <button onClick={() => handleExpandClick(index)}>+</button>
                  </td>
                </tr>
                {expandedEvent === index && (
                  <tr>
                    <td colSpan="9">
                      <div className="expanded-content">
                        <table>
                          <thead>
                            <tr>
                              <th>SO</th>
                              <th>Número Protocolo</th>
                              <th>Cidade</th>
                              <th>Status OS</th>
                              <th>Hora Abertura</th>
                              <th>PPPOE</th>
                              <th>Regional</th>
                              <th>DSLAM Projeto</th>
                              <th>Hostname</th>
                              <th>Primária</th>
                              <th>Caixa</th>
                              <th>Causa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evento.caixas.map((caixa) =>
                              caixa.eventos.map((e, idx) => (
                                <tr key={idx}>
                                  <td>{e.so}</td>
                                  <td>{e.numero_protocolo}</td>
                                  <td>{e.cidade}</td>
                                  <td>{e.status_os}</td>
                                  <td>{formatarHora(e.hora_abertura_os)}</td>
                                  <td>{e.final_login_2}</td>
                                  <td>{e.Regional}</td>
                                  <td>{e.dslam_projeto}</td>
                                  <td>{e.hostname}</td>
                                  <td>{e.primaria}</td>
                                  <td>{e.caixa}</td>
                                  <td>{e.causa}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`dashboard-container ${isSidebarVisible ? 'sidebar-open' : ''}`}>
      <CalculoMedias setMediasDiarias={setMediasDiarias} setMediasHorarias={setMediasHorarias} selectedDate={selectedDate} />
      <div className="dashboard-border"></div>
      {isUpdating && <div className="spinner"></div>}
      <Sidebar
        selectedRegion={selectedRegion}
        onRegionChange={handleRegionChange}
        isAutoChangeEnabled={isAutoChangeEnabled}
        toggleAutoChange={toggleAutoChange}
        isSidebarVisible={isSidebarVisible}
        onDateChange={handleDateChange}
        atualizarfrontdata={atualizarfrontdata}
      />
      <img 
        src="/masc.png" 
        alt=".toggle-sidebar-img" 
        className="toggle-btn"
        onClick={toggleSidebar}
      />
      <div className="dashboard-main-content">
        <h1 className="dashboard-title">{pageTitle}</h1>
        <div className="total-os-header"></div>
        <div className="dashboard-row-total-os">
          <DashboardCard 
            title="Top 10 Cidades" 
            items={top10Cidades} 
            onItemClick={(valor) => handleCardClick('cidade', valor)}
          />
          <DashboardCard 
            title="Top 10 Hostnames" 
            items={top10Hostnames} 
            onItemClick={(valor) => handleCardClick('hostname', valor)}
          />
          <DashboardCard 
            title="Top 10 Projetos" 
            items={top10Projetos} 
            onItemClick={(valor) => handleCardClick('dslam_projeto', valor)}
          />
        </div>

        <div className="dashboard-middle">
          {renderTabelaEntrantes(entrantesPorHora, 'Entrantes de Reparo Regionais', 'Regional', 'Regionais', 'regionais', 'horaRegional')}
          <div className="graficos-title">Gráficos Histórico</div>
          <Graficos historicoEntrantes={historicoEntrantes} selectedDate={selectedDate} />
          <div className="espaco-entre-graficos-e-tabela"></div>
          {renderTabelaEntrantes(entrantesPorCidade, 'Entrantes por Cidade', 'cidade', 'Cidades', 'cidades', 'horaCidade', showMoreCidade, toggleShowMoreCidade)}
          {renderTabelaEntrantes(entrantesPorHostname, 'Entrantes por Hostname', 'hostname', 'Hostnames', 'hostnames', 'horaHostname', showMoreHostname, toggleShowMoreHostname)}
          {renderTabelaEntrantes(entrantesPorProjeto, 'Entrantes por Projeto', 'dslam_projeto', 'Projetos', 'projetos', 'horaProjeto', showMoreProjeto, toggleShowMoreProjeto)}
          {renderTabelaEventosMassivos(possiveisEventosMassivos)}
          <Rechamada /> {/* Certifique-se de que está chamando o componente corretamente */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
