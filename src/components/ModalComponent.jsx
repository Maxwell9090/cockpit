import React, { useState, useEffect } from 'react';
import './Modal.css';

const fetchComentarioHistory = async (ordemServico, setComentarioHistory) => {
  try {
    const response = await fetch(`http://172.26.13.52:3002/historico-comentarios?ordem_servico=${ordemServico}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar histórico de comentários');
    }
    const data = await response.json();
    setComentarioHistory(data);
  } catch (error) {
    console.error('Erro ao carregar histórico de comentários:', error);
  }
};

const ModalComponent = ({ isVisible, onClose, onSave, comment, setComment, ordemServico }) => {
  const [comentarioHistory, setComentarioHistory] = useState([]);

  useEffect(() => {
    if (isVisible && ordemServico) {
      fetchComentarioHistory(ordemServico, setComentarioHistory);
    }
  }, [isVisible, ordemServico]);

  return isVisible ? (
    <div className="fixed-modal">
      <div className="modal-content">
        <div className="modal-container">
          <div className="modal-historico">
            <h3>Histórico de Comentários</h3>
            <ul>
              {comentarioHistory.map((entry, index) => (
                <li key={index}>
                  <p>
                    <strong>{entry.usuario}</strong> ({entry.data_comentario}): {entry.comentario}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="modal-comentario">
            <h3>Adicionar Comentário</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div>
              <button onClick={onSave}>Salvar</button>
              <button className="btn-cancel" onClick={onClose}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default ModalComponent;
