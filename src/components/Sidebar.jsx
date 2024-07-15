import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';

registerLocale('pt-BR', ptBR);

const regionais = ['Todas', 'Regional Central', 'Regional Campinas', 'Regional Vale & Sul', 'Regional Centro - Oeste'];

const Sidebar = ({
  onRegionChange,
  isSidebarVisible,
  isAutoChangeEnabled,
  toggleAutoChange,
  onDateChange,
  atualizarfrontdata,
}) => {
  const [currentRegionalIndex, setCurrentRegionalIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);

  useEffect(() => {
    const regionChangeInterval = setInterval(() => {
      if (isAutoChangeEnabled) {
        const nextIndex = (currentRegionalIndex + 1) % regionais.length;
        onRegionChange(regionais[nextIndex]);
        setCurrentRegionalIndex(nextIndex);
      }
    }, 60000);

    return () => {
      clearInterval(regionChangeInterval);
    };
  }, [currentRegionalIndex, onRegionChange, isAutoChangeEnabled]);

  const handleDateChange = (date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
    onDateChange(date); // Buscar dados do banco de dados para a data selecionada e atualizar o front
    atualizarfrontdata(date); // Adiciona esta linha para chamar a função de atualização no Dashboard
    setIsDissolving(true);
    setTimeout(() => {
      setIsCalendarOpen(false);
      setIsDissolving(false);
    }, 500); // Tempo de dissolução
  };

  const getBrazilianDate = (date = new Date()) => {
    const brazilTimeOffset = -3 * 60; // UTC-3
    const brazilDate = new Date(date.getTime() + (brazilTimeOffset * 60 * 1000));
    return brazilDate.toISOString().split('T')[0];
  };
  
  const handleOpenMassiveEvents = () => {
    const formattedDate = getBrazilianDate(selectedDate);
    const url = new URL(window.location);
    url.pathname = '/massive-events';
    url.searchParams.set('data', formattedDate);
    window.open(url.toString(), '_blank');
  };


  return (
    <>
      <aside className={`sidebar ${isSidebarVisible ? 'sidebar-visible' : ''}`}>
        <h2 className="sidebar-title">Regionais</h2>
        {regionais.map((regional, index) => (
          <button key={index} onClick={(e) => onRegionChange(regional, e)}>{regional}</button>
        ))}

        <button onClick={handleOpenMassiveEvents}>Eventos Massivos</button>   

        <div className="auto-change-control">
          <button onClick={toggleAutoChange}>
            {isAutoChangeEnabled ? 'Desativar Mudança Automática' : 'Ativar Mudança Automática'}
          </button>
        </div>
        <div className="date-filter">
          <label className="date-filter-label">Filtrar por Data</label>
          <div className="custom-datepicker-container">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              onCalendarOpen={() => setIsCalendarOpen(true)}
              onCalendarClose={() => setIsDissolving(false)}
              dateFormat="yyyy/MM/dd"
              locale="pt-BR"
              calendarClassName={`custom-datepicker ${isDissolving ? 'custom-datepicker-dissolve' : ''}`}
              popperProps={{
                positionFixed: true,
                strategy: 'fixed'
              }}
            />
          </div>
        </div>
      </aside>
      <div className={`overlay ${isCalendarOpen ? 'visible' : ''}`} />
    </>
  );
};

export default Sidebar;
