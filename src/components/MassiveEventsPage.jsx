import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import Tooltip from '@mui/material/Tooltip';
import './Dashboard.css';
import alertGif from './farol.gif';
import warningGif from './warning.gif';
import SignalComponent from './SignalComponent';
import ModalComponent from './ModalComponent';
import Sis from './sis';

const socket = io('http://172.26.13.52:3002');

const getBrazilianDate = (date = new Date()) => {
  const brazilTimeOffset = -3 * 60; // UTC-3
  const brazilDate = new Date(date.getTime() + (brazilTimeOffset * 60 * 1000));
  return brazilDate.toISOString().split('T')[0];
};

const MassiveEventsPage = ({ selectedDate }) => {
  const [expandedEvents, setExpandedEvents] = useState([]);
  const [comment, setComment] = useState('');
  const [possiveisEventosMassivos, setPossiveisEventosMassivos] = useState([]);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState(null);
  const [highlightedEvents, setHighlightedEvents] = useState([]);
  const username = localStorage.getItem('username'); // Retrieve username from localStorage

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
        eventos: eventos.map(e => ({
          ...e,
          onu: 'loading',
          olt: 'loading'
        })),
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

  }, []);

  const fetchData = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateFromUrl = urlParams.get('data') || getBrazilianDate(selectedDate);

    try {
      const response = await fetch(`http://172.26.13.52:3002/buscar-dados-historicos?data=${dateFromUrl}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados históricos');
      }
      const data = await response.json();
      identificarEventosMassivos(data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, [selectedDate, identificarEventosMassivos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 60000); // 60000ms = 1 minuto

    return () => clearInterval(intervalId);
  }, [fetchData]);

  useEffect(() => {
    socket.on('event_updated', (data) => {
      setPossiveisEventosMassivos((prevEventos) =>
        prevEventos.map((evento) =>
          evento.caixas.some(caixa => caixa.eventos.some(e => e.so === data.ordem_servico))
            ? {
              ...evento,
              caixas: evento.caixas.map((caixa) =>
                caixa.eventos.some(e => e.so === data.ordem_servico)
                  ? {
                    ...caixa,
                    eventos: caixa.eventos.map((e) =>
                      e.so === data.ordem_servico ? { ...e, comentario: data.comment, analisado: data.analisado, usuario: data.usuario } : e
                    ),
                  }
                  : caixa
              ),
            }
            : evento
        )
      );
    });

    socket.on('event_expanded', (data) => {
      setHighlightedEvents((prevHighlightedEvents) =>
        prevHighlightedEvents.includes(data.event_key)
          ? prevHighlightedEvents
          : [...prevHighlightedEvents, data.event_key]
      );
    });

    socket.on('event_collapsed', (data) => {
      setHighlightedEvents((prevHighlightedEvents) =>
        prevHighlightedEvents.filter((key) => key !== data.event_key)
      );
    });
  }, []);

  const handleEventClick = (evento) => {
    const formattedDate = getBrazilianDate(selectedDate);
    const url = new URL(window.location);
    url.pathname = '/detalhes';
    url.searchParams.set('tipo', 'massivo');
    url.searchParams.set('projeto', evento.hostname);
    url.searchParams.set('hostname', evento.dslam_projeto);
    url.searchParams.set('primaria', evento.primaria);
    url.searchParams.set('caixa', evento.caixa);
    url.searchParams.set('causa', evento.causa);
    url.searchParams.set('data', formattedDate);
    window.open(url.toString(), '_blank');
  };

  const handleExpandClick = async (eventKey, eventos) => {
    const isExpanded = expandedEvents.includes(eventKey);
    setExpandedEvents((prevExpandedEvents) =>
      isExpanded
        ? prevExpandedEvents.filter((key) => key !== eventKey)
        : [...prevExpandedEvents, eventKey]
    );

    if (isExpanded) {
      socket.emit('collapse_event', { event_key: eventKey });
      fetch('http://172.26.13.52:3002/collapse-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_key: eventKey }),
      }).catch((error) => console.error('Erro ao emitir evento colapsado:', error));
    } else {
      socket.emit('expand_event', { event_key: eventKey });
      fetch('http://172.26.13.52:3002/expand-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_key: eventKey }),
      }).catch((error) => console.error('Erro ao emitir evento expandido:', error));
    }

    if (!isExpanded) {
      try {
        const updatedCaixas = await Promise.all(eventos.caixas.map(async (caixa) => {
          const updatedEventos = await Promise.all(caixa.eventos.map(async (event) => {
            return event;
          }));
          return { ...caixa, eventos: updatedEventos };
        }));

        setPossiveisEventosMassivos((prevEventos) => {
          const newEventos = [...prevEventos];
          newEventos[eventKey] = {
            ...newEventos[eventKey],
            caixas: updatedCaixas
          };

          return newEventos;
        });
        setComment(eventos[0].comment || '');
        setModalEvent(eventKey);
      } catch (error) {
        console.error('Erro ao atualizar dados ONU e OLT:', error);
      }
    }
  };

  const handleCheckboxChange = (e, event) => {
    if (e.target.checked) {
      setSelectedBoxes([...selectedBoxes, event]);
    } else {
      setSelectedBoxes(selectedBoxes.filter((box) => box !== event));
    }
  };

  const handleSelectAll = (evento) => {
    const allEvents = evento.caixas.flatMap(caixa => caixa.eventos);
    setSelectedBoxes(allEvents);
  };

  const saveComment = async (e) => {
    e.preventDefault();
    if (selectedBoxes.length > 0 || modalEvent !== null) {
      const boxesToUpdate = selectedBoxes.length > 0 ? selectedBoxes : possiveisEventosMassivos[modalEvent].caixas.flatMap(caixa => caixa.eventos);

      try {
        await Promise.all(
          boxesToUpdate.map(async (box) => {
            const response = await fetch('http://172.26.13.52:3002/update-event', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ordem_servico: box.so,
                comment: comment || '',
                analisado: comment ? 1 : 0,
                usuario: username, // Include the username here
              }),
            });

            if (!response.ok) {
              throw new Error('Erro ao salvar dados');
            }

            box.comentario = comment || '';
            box.analisado = comment ? 1 : 0;
            box.usuario = username; // Store the username in the object
          })
        );

        setPossiveisEventosMassivos((prevEventos) =>
          prevEventos.map((evento) =>
            evento.caixas.some(caixa => caixa.eventos.some(e => boxesToUpdate.includes(e)))
              ? {
                ...evento,
                caixas: evento.caixas.map((caixa) =>
                  caixa.eventos.some(e => boxesToUpdate.includes(e))
                    ? {
                      ...caixa,
                      eventos: caixa.eventos.map((e) =>
                        boxesToUpdate.includes(e) ? { ...e, comentario: comment || '', analisado: comment ? 1 : 0, usuario: username } : e
                      ),
                    }
                    : caixa
                ),
              }
              : evento
          )
        );

        setSelectedBoxes([]);
        setComment('');
        setModalEvent(null);
      } catch (error) {
        console.error('Erro ao salvar dados', error);
      }
    }
  };

  const renderTabelaEventosMassivos = (eventos) => {
    if (!eventos || eventos.length === 0) return null;

    const eventosFiltrados = eventos.filter((evento) => evento.total >= 2);

    const eventosComStatus = eventosFiltrados.map((evento) => {
      let statusImg = '/ballgreen.png';

      if (evento.total >= 3) {
        statusImg = alertGif;
      } else if (evento.total >= 2) {
        statusImg = warningGif;
      }

      return { ...evento, statusImg };
    });

    const formatarHora = (horaString) => {
      if (typeof horaString === 'string') {
        const [hora, minuto, segundo] = horaString.split(':');
        return `${hora}:${minuto}:${segundo.split('.')[0]}`;
      }
      return horaString;
    };

    const eventosOrdenados = eventosComStatus.sort((a, b) => {
      const aNaoAnalisado = a.caixas.some(caixa => caixa.eventos.some(e => e && e.analisado !== 1));
      const bNaoAnalisado = b.caixas.some(caixa => caixa.eventos.some(e => e && e.analisado !== 1));

      if (aNaoAnalisado && !bNaoAnalisado) return -1;
      if (!aNaoAnalisado && bNaoAnalisado) return 1;

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
                <tr className={`clickable ${highlightedEvents.includes(index) ? 'highlighted-row' : ''}`}>
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
                    {evento.caixas.every(caixa => caixa.eventos.every(e => e && e.analisado === 1))
                      ? <Tooltip title={evento.comment || "Sem comentário"} arrow>
                          <span style={{ color: 'green', cursor: 'pointer' }}>✔️</span>
                        </Tooltip>
                      : <span style={{ color: 'red', cursor: 'pointer' }}>❌</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => { handleExpandClick(index, evento); setModalEvent(index); }}
                    >
                      {expandedEvents.includes(index) ? '-' : '+'}
                    </button>
                  </td>
                </tr>
                {expandedEvents.includes(index) && (
                  <React.Fragment>
                    <tr>
                      <td colSpan="15">
                        <div className="expanded-content">
                          <button onClick={() => handleSelectAll(evento)}>Selecionar Todas as Caixas</button>
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
                                <th>ONU</th>
                                <th>OLT</th>
                                <th>Causa</th>
                                <th>Analisado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {evento.caixas.map((caixa) =>
                                caixa.eventos.map((event, idx) => (
                                  <tr key={idx}>
                                    <td>{event.so}</td>
                                    <td>{event.numero_protocolo}</td>
                                    <td>{event.cidade}</td>
                                    <td>{event.status_os}</td>
                                    <td>{formatarHora(event.hora_abertura_os)}</td>
                                    <td>
                                      <Sis pppoe={event.final_login_2} />
                                    </td>
                                    <td>{event.Regional}</td>
                                    <td>{event.dslam_projeto}</td>
                                    <td>{event.hostname}</td>
                                    <td>{event.primaria}</td>
                                    <td>{caixa.caixa}</td>
                                    <SignalComponent pppoe={event.final_login_2} so={event.so} />
                                    <td>{event.causa}</td>
                                    <td>
                                      {event.analisado === 1 ? (
                                        <Tooltip title={event.comentario || "Atualizando Nota"} arrow>
                                          <span style={{ color: 'green', cursor: 'pointer' }}>✔️</span>
                                        </Tooltip>
                                      ) : (
                                        <input type="checkbox" checked={selectedBoxes.includes(event)} onChange={(e) => handleCheckboxChange(e, event)} />
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="15">
                        <ModalComponent
                          isVisible={modalEvent === index}
                          onClose={() => setModalEvent(null)}
                          onSave={saveComment}
                          comment={comment}
                          setComment={setComment}
                          ordemServico={evento.caixas.flatMap(c => c.eventos)[0].so}
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="massive-events-page">
      {loading ? <p>Carregando...</p> : renderTabelaEventosMassivos(possiveisEventosMassivos)}
    </div>
  );
};

export default MassiveEventsPage;
