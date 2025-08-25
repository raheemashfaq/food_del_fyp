import React, { useContext } from 'react'
import './Navbar.css'
import {assets} from "../../assets/assets"
import { AdminContext } from '../../Context/AdminContext'

const Navbar = () => {
  const { setToken } = useContext(AdminContext);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    setToken('');
  };

  return (
    <div className="navbar">
        <img className='logo' src={assets.logo} alt=""/>
        <div className="navbar-right">
          <img className='profile' src={assets.profile_image}  alt =""/>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
    </div>
  )
}

export default Navbar