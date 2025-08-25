import React, { useContext, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import {Routes,Route} from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import AdminResetPassword from './components/AdminResetPassword/AdminResetPassword'
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminContextProvider, { AdminContext } from './Context/AdminContext';
import AdminLoginPopup from './components/AdminLoginPopup/AdminLoginPopup';

const AppContent = () => {
  const { token } = useContext(AdminContext);
  const [showLogin, setShowLogin] = useState(!token);

  // Update login state when token changes
  React.useEffect(() => {
    setShowLogin(!token);
  }, [token]);

  return (
    <div>
      <ToastContainer/>
      {!token ? (
        <Routes>
          <Route path="/reset-password/:token" element={<AdminResetPassword />} />
          <Route path="*" element={showLogin ? <AdminLoginPopup setShowLogin={setShowLogin} /> : null} />
        </Routes>
      ) : (
        <>
          <Navbar/>
          <hr/>
          <div className="app-content">
            <Sidebar/>
            <Routes>
                <Route path="/add" element={<Add />}/>
                <Route path="/list" element={<List />}/>
                <Route path="/orders" element={<Orders />}/>
                <Route path="/" element={<Orders />}/>
            </Routes>
          </div>
        </>
      )}
    </div>
  )
}

const App = () => {
  return (
    <AdminContextProvider>
      <AppContent />
    </AdminContextProvider>
  )
}
export default App