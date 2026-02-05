import React from 'react';
import { HashRouter } from 'react-router-dom';
import Sidebar from './components/SideBar';
import { useState } from 'react'
import AppRouter from './AppRouter';

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <HashRouter>
      <div className={`app-layout ${collapsed ? "collapsed" : ""}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className="main-content">
          <AppRouter />
        </main>
      </div>
    </HashRouter>
  );
}


export default App; 