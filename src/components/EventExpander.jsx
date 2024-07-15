import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Tooltip from '@mui/material/Tooltip'; // Importar Tooltip do MUI
import ModalComponent from './ModalComponent'; // Importar o novo componente Modal
import SignalComponent from './SignalComponent';

const socket = io('http://172.30.20.76:3001'); // Ajuste para a URL do seu servidor

const EventExpander = ({ 
  evento, 
  index, 
  expandedEvents, 
  setExpandedEvents, 
  handleSelectAll, 
  selectedBoxes, 
  setSelectedBoxes, 
  comment, 
  setComment, 
  saveComment, 
  formatarHora,
  handleEventClick, // Adicionar como prop
  handleCheckboxChange // Adicionar como prop
}) => {
  const [modalEvent, setModalEvent] = useState(null);

  useEffect(() => {
    socket.on('eventExpanded', (data) => {
      if (data.index === index) {
        setExpandedEvents((prev) => [...prev, index]);
      }
    });

    socket.on('eventCollapsed', (data) => {
      if (data.index === index) {
        setExpandedEvents((prev) => prev.filter((key) => key !== index));
      }
    });

    return () => {
      socket.off('eventExpanded');
      socket.off('eventCollapsed');
    };
  }, [index, setExpandedEvents]);

  const handleExpandClick = () => {
    if (expandedEvents.includes(index)) {
      socket.emit('collapseEvent', { index });
      setExpandedEvents((prevExpandedEvents) => prevExpandedEvents.filter((key) => key !== index));
    } else {
      socket.emit('expandEvent', { index });
      setExpandedEvents((prevExpandedEvents) => [...prevExpandedEvents, index]);
    }
  };

  return (
    <>
      <tr className="clickable">
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
          <button onClick={handleExpandClick}>
            {expandedEvents.includes(index) ? 'Analisando... -' : '+'}
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
                          <td>{event.final_login_2}</td>
                          <td>{event.Regional}</td>
                          <td>{event.dslam_projeto}</td>
                          <td>{event.hostname}</td>
                          <td>{event.primaria}</td>
                          <td>{caixa.caixa}</td>
                          <SignalComponent pppoe={event.final_login_2} so={event.so} />
                          <td>{event.causa}</td>
                          <td>
                            {event.analisado === 1 ? (
                              <Tooltip title={event.comentario || "Sem comentário"} arrow>
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
              />
            </td>
          </tr>
        </React.Fragment>
      )}
    </>
  );
};

export default EventExpander;
