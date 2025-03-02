// client/src/components/Modal.js
import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && <h2 className="modal-title">{title}</h2>}
        {children} {/* Custom close button will be passed here */}
      </div>
    </div>
  );
};

export default Modal;