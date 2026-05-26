import { createContext , useEffect, useState} from "react";
// import {food_list} from "../assets/assets"
import axios from "axios";
import { toast } from 'react-toastify';

export const StoreContext = createContext(null);

const StoreContextProvider = (props) =>{

    const [cartItems, setCartItems] = useState({});
    const url = import.meta.env.VITE_API_URL
    const [token,setToken] = useState("")
    // Data carry from database now
    const [food_list,setFoodList] = useState([]);
    // Loading state for initial food fetch (covers Render free-tier cold start)
    const [isLoading, setIsLoading] = useState(true);
    // Search functionality
    const [searchTerm, setSearchTerm] = useState("");
    // Promo code state
    const [promoCode, setPromoCode] = useState("");
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [appliedPromo, setAppliedPromo] = useState(null); // stores applied promo code string

    const addToCart = async (itemId) => {
        // Find the food item to get its name for toast
        const foodItem = food_list.find(item => item._id === itemId);
        const itemName = foodItem ? foodItem.name : "Item";
        
        // Ensure we're working with a valid number
        const currentQuantity = cartItems[itemId] || 0;
        
        setCartItems((prev) => ({...prev,[itemId]:currentQuantity+1}))
        
        // Show toast notification using react-toastify
        toast.success(`${itemName} added to cart!`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
        
        if(token){
            await axios.post(url+"/api/cart/add",{itemId},{headers:{token}})
        }
    }

    const removeFromCart = async (itemId) => {
        // Ensure we don't go below 0
        const currentQuantity = cartItems[itemId] || 0;
        const newQuantity = Math.max(0, currentQuantity - 1);
        
        // Create a new cart items object
        const newCartItems = { ...cartItems };
        
        if (newQuantity === 0) {
            // Remove item completely if quantity is 0
            delete newCartItems[itemId];
        } else {
            // Update quantity
            newCartItems[itemId] = newQuantity;
        }
        
        setCartItems(newCartItems);
        
        // Show toast notification for removal (only if item was actually removed)
        if (currentQuantity > 0) {
            const foodItem = food_list.find(item => item._id === itemId);
            const itemName = foodItem ? foodItem.name : "Item";
            toast.info(`${itemName} removed from cart`, {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
        
        if(token && currentQuantity > 0){
            await axios.post(url+"/api/cart/remove",{itemId},{headers:{token}})
        }
    }

    const getTotalCartAmount = () =>{
        let totalAmount = 0;
        for(const item in cartItems){
            if(cartItems[item]>0){
                let intemInfo = food_list.find((product)=>product._id === item);
                if(intemInfo) { // Add null check to prevent error
                    totalAmount += intemInfo.price*cartItems[item];
                }
            }
        }
        return totalAmount;
    }
    
    const getTotalCartItems = () => {
        let totalItems = 0;
        for(const item in cartItems) {
            // Only count items with quantity greater than 0
            if(cartItems[item] > 0) {
                totalItems += cartItems[item];
            }
        }
        return totalItems;
    }
    const applyPromoCode = async (code) => {
        try {
            const subtotal = getTotalCartAmount();
            // Build cart items array for product-specific promo validation
            const cartItemsArray = [];
            for (const itemId in cartItems) {
                if (cartItems[itemId] > 0) {
                    const food = food_list.find(f => f._id === itemId);
                    if (food) {
                        cartItemsArray.push({ _id: food._id, quantity: cartItems[itemId], price: food.price });
                    }
                }
            }
            const response = await axios.post(url + "/api/promo/validate", { code, subtotal, cartItems: cartItemsArray }, { headers: { token } });
            if (response.data.success) {
                setAppliedPromo(response.data.promoCode);
                setPromoDiscount(response.data.discount);
                return { success: true, message: response.data.message, discount: response.data.discount };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            return { success: false, message: "Failed to validate promo code." };
        }
    };

    const removePromoCode = () => {
        setAppliedPromo(null);
        setPromoDiscount(0);
        setPromoCode("");
    };

    // Data carry from database now
    const fetchFoodList = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(url+"/api/food/list");
            setFoodList(response.data.data);
        } catch (error) {
            // On a cold start the first request can time out before the server wakes.
            // Retry once after a short delay so the user doesn't see an empty page.
            console.error("Failed to fetch food list, retrying...", error);
            try {
                await new Promise((r) => setTimeout(r, 3000));
                const response = await axios.get(url+"/api/food/list");
                setFoodList(response.data.data);
            } catch (retryError) {
                console.error("Retry failed:", retryError);
            }
        } finally {
            setIsLoading(false);
        }
    }

    const loadCartData = async (token) => {
        const response = await axios.post(url+"/api/cart/get",{},{headers:{token}})
        // Filter out items with zero quantities when loading cart data
        const filteredCartData = {};
        if (response.data.cartData) {
            Object.entries(response.data.cartData).forEach(([itemId, quantity]) => {
                const numQuantity = Number(quantity);
                if (!isNaN(numQuantity) && numQuantity > 0) {
                    filteredCartData[itemId] = numQuantity;
                }
            });
        }
        console.log('loadCartData - setting cart items:', filteredCartData);
        setCartItems(filteredCartData);
    }

    // on refreash we were logout hence need this -> store token
    useEffect(()=>{
        async function loadData(){
            await fetchFoodList();
            console.log('useEffect - localStorage token:', localStorage.getItem("token"));
            if(localStorage.getItem("token")){
                setToken(localStorage.getItem("token"))
                await loadCartData(localStorage.getItem("token"));
            } else {
                // If no token, ensure cart is empty
                console.log('useEffect - no token, setting empty cart');
                setCartItems({});
            }
        }
        loadData();
    },[])

    // Add a useEffect to debug cartItems changes
    useEffect(() => {
        console.log('StoreContext - cartItems changed:', cartItems);
    }, [cartItems]);

    const contextValue = {
        food_list,
        isLoading,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        getTotalCartItems,
        url,
        token,
        setToken,
        searchTerm,
        setSearchTerm,
        promoCode,
        setPromoCode,
        promoDiscount,
        appliedPromo,
        applyPromoCode,
        removePromoCode
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}
export default StoreContextProvider;