import React,{useState,useContext, useEffect, useRef} from 'react'
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
  const [showSearchInput, setShowSearchInput] = useState(false);
  const searchContainerRef = useRef(null);
  const {getTotalCartAmount,token, setToken, searchTerm, setSearchTerm} = useContext(StoreContext)
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

  const handleSearchClick = () => {
    setShowSearchInput(!showSearchInput);
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Navigate to home page with search results
    if (searchTerm.trim()) {
      navigate('/');
      // Scroll to food display section
      setTimeout(() => {
        const foodDisplayElement = document.getElementById('food-display');
        if (foodDisplayElement) {
          foodDisplayElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }

  // Close search input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchInput(false);
      }
    };

    // Add event listener when search input is open
    if (showSearchInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchInput]);
  
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
        <div className="search-container" ref={searchContainerRef}>
          <img 
            src={assets.search_icon} 
            alt="" 
            className="search-icon"
            onClick={handleSearchClick}
          />
          {showSearchInput && (
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search for food..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
                autoFocus
              />
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>
          )}
        </div>
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