import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../Context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import Chatbot from "../Chatbot/Chatbot";
import LocationMap from "../LocationMap/LocationMap";

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);

  return (
    <div className="food-display" id="food-display">
      <h2>Top dishes near you</h2>
      <div className="food-display-list">
        {food_list.map((item, index) => {
          if (category === "All" || category === item.category) {
            return (
              <FoodItem
                key={index}
                id={item._id}
                name={item.name}
                description={item.description}
                price={item.price}
                image={item.image}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Location Map Section */}
      <LocationMap 
        latitude={31.582045}
        longitude={74.329376}
        locationName="Lahore, Pakistan"
        popupText="🍕 Fast Food Delivery Available Here!"
        zoom={13}
      />

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default FoodDisplay;
