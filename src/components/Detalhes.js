import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './Detalhes.css';

const Detalhes = () => {
  const location = useLocation();
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      const params = new URLSearchParams(location.search);
      const tipo = params.get('tipo');
      const valor = params.get('valor');
      const hora = params.get('hora');
      const projeto = params.get('projeto');
      const hostname = params.get('hostname');
      const primaria = params.get('primaria');
      const caixa = params.get('caixa');
      const data = params.get('data'); // Obter a data dos parâmetros da URL

      try {
        const resposta = await fetch(` http://172.26.13.52:3002/buscar-dados-historicos?data=${data}`);
        if (!resposta.ok) {
          throw new Error(`HTTP error! status: ${resposta.status}`);
        }
        const responseData = await resposta.json();

        // Convertendo numero_protocolo para string de maneira segura
        const dadosTratados = responseData.map(item => ({
          ...item,
          numero_protocolo: item.numero_protocolo ? Number(item.numero_protocolo).toFixed(0) : '',
          primaria: item.primaria ? Number(item.primaria).toFixed(0) : '',
          caixa: item.caixa ? Number(item.caixa).toFixed(0) : ''
        }));

        console.log('Dados recebidos do banco de dados:', dadosTratados); // Log de depuração

        const filtrados = dadosTratados.filter(item => {
          if (tipo === 'massivo') {
            return (
              item.dslam_projeto === hostname &&
              item.hostname === projeto &&
              item.primaria === primaria &&
              item.caixa === caixa
            );
          } else {
            return (
              item[tipo] === valor &&
              (!hora || new Date(`1970-01-01T${item.hora_abertura_os}Z`).getUTCHours() === parseInt(hora, 10))
            );
          }
        });
        setFilteredData(filtrados);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, [location]);

  const formatarHora = (horaString) => {
    if (typeof horaString === 'string') {
      const [hora, minuto, segundo] = horaString.split(':');
      return `${hora}:${minuto}:${segundo.split('.')[0]}`;
    }
    return horaString;
  };

  const exportarParaXLSX = () => {
    const exportData = filteredData.map(item => ({
      ...item,
      data_abertura: item.data_abertura_os,
      hora_abertura: formatarHora(item.hora_abertura_os),
      numero_protocolo: item.numero_protocolo
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detalhes");
    XLSX.writeFile(workbook, 'detalhes.xlsx');
  };

  return (
    <div className="detalhes-container">
      <button onClick={exportarParaXLSX} className="export-button">Exportar para XLSX</button>
      <table className="detalhes-tabela">
        <thead>
          <tr>
            <th>OS</th>
            <th>Número Protocolo</th>
            <th>Técnico</th>
            <th>Empresa</th>
            <th>Causa</th>
            <th>Cidade</th>
            <th>Descrição Região</th>
            <th>Status OS</th>
            <th>CTO Latitude</th>
            <th>CTO Longitude</th>
            <th>Data Agendamento</th>
            <th>Data Abertura OS</th>
            <th>Hora Abertura</th>
            <th>Data Finalização OS</th>
            <th>Admin Version</th>
            <th>Final Login</th>
            <th>Final Login 2</th>
            <th>Regional</th>
            <th>Descrição OS</th>
            <th>DSLAM Projeto</th>
            <th>Hostname</th>
            <th>Primária</th>
            <th>Caixa</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index}>
              <td>{item.so}</td>
              <td>{item.numero_protocolo}</td>
              <td>{item.tecnico}</td>
              <td>{item.empresa}</td>
              <td>{item.causa}</td>
              <td>{item.cidade}</td>
              <td>{item.descricao_regiao}</td>
              <td>{item.status_os}</td>
              <td>{item.cto_latitude}</td>
              <td>{item.cto_longitude}</td>
              <td>{item.data_agendamento}</td>
              <td>{item.data_abertura_os}</td>
              <td>{formatarHora(item.hora_abertura_os)}</td>
              <td>{item.data_finalizacao_os}</td>
              <td>{item.adminversion}</td>
              <td>{item.final_login}</td>
              <td>{item.final_login_2}</td>
              <td>{item.Regional}</td>
              <td>{item.descricao_os}</td>
              <td>{item.dslam_projeto}</td>
              <td>{item.hostname}</td>
              <td>{item.primaria}</td>
              <td>{item.caixa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Detalhes;
