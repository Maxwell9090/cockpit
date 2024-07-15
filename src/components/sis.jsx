import React from 'react';

const Sis = ({ pppoe }) => {
  const handleDoubleClick = () => {
    const userId = pppoe.split('.')[0];
    const url = `http://sis.desktop.com.br/Clientes-View?num=${userId}&type=Cliente&ADMINVERSION=3`;
    window.open(url, '_blank');
  };

  return (
    <span onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
      {pppoe}
    </span>
  );
};

export default Sis;
