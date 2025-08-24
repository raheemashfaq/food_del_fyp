import React,{useState,useContext} from 'react'
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import "./Navbar.css"
import {assets} from "../../assets/assets"
import { Link } from 'react-router-dom';
import {StoreContext} from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom';

const Navbar = ({setShowLogin}) => {

  const navigate = useNavigate();
  const [menu,setMenu] = useState("Home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {getTotalCartAmount,token, setToken} = useContext(StoreContext)
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/")
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  }

  const handleMenuClick = (menuItem) => {
    setMenu(menuItem);
    setMobileMenuOpen(false); // Close mobile menu when item is clicked
  }
  
  return (
    <div className="navbar">
      <Link to='/'><img src={assets.logo} alt="" className="logo"/></Link>
      
      {/* Hamburger Menu Button */}
      <div className="hamburger-menu" onClick={toggleMobileMenu}>
        <span className={mobileMenuOpen ? "bar open" : "bar"}></span>
        <span className={mobileMenuOpen ? "bar open" : "bar"}></span>
        <span className={mobileMenuOpen ? "bar open" : "bar"}></span>
      </div>

      <ul className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to='/' onClick={()=>handleMenuClick("Home")} className={menu === "Home" ? "active" : ""}>Home</Link>
        <a href='#explore-menu' onClick={()=>handleMenuClick("Menu")} className={menu === "Menu" ? "active" : ""}>Menu</a>
        <a href='#app-download' onClick={()=>handleMenuClick("Mobile-app")} className={menu === "Mobile-app" ? "active" : ""}>Mobile-app</a>
        <a href='#footer' onClick={()=>handleMenuClick("Contact us")} className={menu === "Contact us" ? "active" : ""}>Contact us</a>
      </ul>
      {/* <ul className="navbar-menu">
        <li onClick={()=>setMenu("home")} className={menu === "home" ? "active" : ""}>home</li>
        <li onClick={()=>setMenu("menu")} className={menu === "menu" ? "active" : ""}>menu</li>
        <li onClick={()=>setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>mobile-app</li>
        <li onClick={()=>setMenu("contact us")} className={menu === "contact us" ? "active" : ""}>contact us</li>
      </ul> */}
      <div className="navbar-right">
        <img src={assets.search_icon} alt="" className="search-icon"/>
        <div className="navbar-search-icon">
            <Link to="/cart"><img src={assets.basket_icon} alt=""/></Link>
            <div className={getTotalCartAmount()===0?"":"dot"}></div>
        </div>    
        {!token?<button onClick={()=>setShowLogin(true)}>Sign in</button>
        :<div className='navbar-profile'>
          <img src={assets.profile_icon} alt=""/>
          <ul className="nav-profile-dropdown">
            <li onClick={()=>navigate('/myorders')}><img src={assets.bag_icon} alt="" /><p>Orders</p></li>
            <hr/>
            <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Logout</p></li>
          </ul>
        </div>
        }
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={toggleMobileMenu}></div>}
    </div>
  )
}

export default Navbar