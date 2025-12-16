import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="spinner"></div>
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
    </div>
  );
};

export default Loading;