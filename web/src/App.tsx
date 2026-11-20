import { Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { NoEncontrada } from './pages/NoEncontrada';
import { RUTAS } from './rutas';
import './design-system/tokens/global.scss';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {RUTAS.map((r) => (
          <Route key={r.path} path={r.path} element={r.elemento} />
        ))}
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
