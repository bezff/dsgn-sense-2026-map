import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import MapPage from './pages/MapPage';
import { BRAILLE_MODE_EVENT, isBrailleModeEnabled } from './brailleMode';
import { disableBrailleTextMode, enableBrailleTextMode } from './brailleTextMode';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const [isBrailleEnabled, setIsBrailleEnabled] = useState<boolean>(isBrailleModeEnabled());

  useEffect(() => {
    const syncBrailleMode = () => {
      setIsBrailleEnabled(isBrailleModeEnabled());
    };

    window.addEventListener(BRAILLE_MODE_EVENT, syncBrailleMode);
    window.addEventListener('storage', syncBrailleMode);

    return () => {
      window.removeEventListener(BRAILLE_MODE_EVENT, syncBrailleMode);
      window.removeEventListener('storage', syncBrailleMode);
    };
  }, []);

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const shouldEnableBraille = isBrailleEnabled && !isAdminRoute;

    document.body.classList.toggle('braille-mode', shouldEnableBraille);
    if (shouldEnableBraille) {
      enableBrailleTextMode();
    } else {
      disableBrailleTextMode();
    }

    return () => {
      disableBrailleTextMode();
    };
  }, [isBrailleEnabled, location.pathname]);

  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
