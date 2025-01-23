import React from 'react';

export const CustomCheckbox = ({ checked, onChange, className }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        w-5 h-5 rounded-md border-2 flex items-center justify-center
        transition-all duration-200 ease-in-out
        ${checked 
          ? 'bg-blue-600 border-blue-600' 
          : 'bg-transparent border-gray-500 hover:border-gray-400'
        }
        ${className}
      `}
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-3 h-3 text-white"
        >
          <path
            d="M20 6L9 17L4 12"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};
