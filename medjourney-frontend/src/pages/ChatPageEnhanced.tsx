import React from 'react';

const ChatPageEnhanced: React.FC = () => {
  return (
    <div
      className="w-full h-full"
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        position: 'relative',
        background: 'transparent',
      }}
    >
      <iframe
        src="http://localhost:3001/"
        className="rounded-lg shadow-lg"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '75vw',
          height: '70vh',
          border: 'none',
          minWidth: 320,
          minHeight: 240,
          maxWidth: 1200,
          maxHeight: 900,
          background: 'white',
        }}
        title="Embedded App"
        allow="camera; microphone"
      />
    </div>
  );
};

export default ChatPageEnhanced;