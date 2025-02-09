// src/components/Sidebar.js
import React from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed top-0 left-0 h-full w-64 bg-gray-800 shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 md:static md:translate-x-0`}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Menu</h2>
        <ul className="space-y-4">
          <li className="text-white hover:text-futuristic-accent cursor-pointer" onClick={onClose}>Overview</li>
          <li className="text-white hover:text-futuristic-accent cursor-pointer" onClick={onClose}>Transactions</li>
          <li className="text-white hover:text-futuristic-accent cursor-pointer" onClick={onClose}>Analytics</li>
          <li className="text-white hover:text-futuristic-accent cursor-pointer" onClick={onClose}>Settings</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
