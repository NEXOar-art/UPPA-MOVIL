import React from 'react';

interface MapErrorDisplayProps {
  errorMessage: string;
}

const MapErrorDisplay: React.FC<MapErrorDisplayProps> = ({ errorMessage }) => {
  const helpUrl = "https://locationiq.com/docs";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/30 p-4 text-center border border-red-500/50 rounded-lg">
      <i className="fas fa-exclamation-triangle text-red-400 text-5xl mb-4"></i>
      <h3 className="text-xl font-bold text-red-300 font-audiowide">Error en el Sistema de Mapas</h3>
      <p className="text-red-200 mt-2 max-w-md">
        {errorMessage}
      </p>
      <p className="text-red-200/80 text-sm mt-2">
        Esto puede deberse a un problema con la clave de API de LocationIQ o a un problema de red.
      </p>
      <a
        href={helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 ps-button bg-red-600 hover:bg-red-700 border-red-500 hover:border-red-400"
      >
        <i className="fas fa-external-link-alt mr-2"></i>
        Documentación de LocationIQ
      </a>
    </div>
  );
};

export default MapErrorDisplay;