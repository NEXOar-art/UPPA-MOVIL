import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="ps-card w-full max-w-lg max-h-[90vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold font-audiowide text-blue-300">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl transition-colors"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto pr-2 -mr-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;