import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function ProtectedLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default ProtectedLayout;