import React,{useState} from 'react'
import Navbar from "./Components/Navbar/Navbar"
import { Routes,Route } from 'react-router-dom'
import Cart from './Pages/Cart/Cart'
import Home from './Pages/Home/Home'
import PlaceOrder from './Pages/PlaceOrder/PlaceOrder'
import Footer from './Components/Footer/Footer'
import LoginPopup from './Components/LoginPopup/LoginPopup'
import VerifyEmail from './Pages/VerifyEmail'
import MyOrders from "./Pages/MyOrders/MyOrders"
import Chatbot from './Components/Chatbot/Chatbot'
import Verify from '../src/Pages/Verify/Verify'

const App = () => {


  const [showLogin,setShowLogin] = useState(false)

  return (
   <>
   {showLogin ? <LoginPopup setShowLogin={setShowLogin}/>:<></>}
    <div className="app">
      <Navbar setShowLogin={setShowLogin}/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/cart' element={<Cart/>}/>
        <Route path='/order' element={<PlaceOrder/>}/>
        <Route path='/verify' element={<Verify/>}/>
        <Route path='/verify/:token' element={<VerifyEmail/>}/>
        <Route path='/myorders' element={<MyOrders/>} />
        <Route path='/chat' element={<Chatbot />} />
      </Routes>
      
    </div>
      <Footer/>
   </>
  )
}

export default App