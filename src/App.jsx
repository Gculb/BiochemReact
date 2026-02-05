import React from 'react';
import { HashRouter } from 'react-router-dom';
import Sidebar from './components/SideBar';
import AppRouter from './AppRouter';

function App() {
  return (
    <HashRouter>
      <div className="app-layout">
        {/* Sidebar now has access to the Router context */}
        <Sidebar /> 
        
        <main className="main-content">
          {/* AppRouter only handles the "switching" of pages */}
          <AppRouter />
        </main>
      </div>
    </HashRouter>
  );
}

export default App; 