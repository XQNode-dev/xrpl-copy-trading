// src/components/HamburgerMenu.js
import React from 'react';

const HamburgerMenu = ({ onClick }) => {
  return (
    <button onClick={onClick} className="text-white focus:outline-none md:hidden">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
      </svg>
    </button>
  );
};

export default HamburgerMenu;
