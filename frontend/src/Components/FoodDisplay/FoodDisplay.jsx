import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../Context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import FoodItemSkeleton from "../FoodItem/FoodItemSkeleton";
import Chatbot from "../Chatbot/Chatbot";
import LocationMap from "../LocationMap/LocationMap";

const FoodDisplay = ({ category }) => {
  const { food_list, searchTerm, isLoading } = useContext(StoreContext);

  // Filter foods based on search term and category
  const filteredFoods = food_list.filter((item) => {
    const matchesCategory = category === "All" || category === item.category;
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="food-display" id="food-display">
      <h2>
        {searchTerm ? 
          `Search results for "${searchTerm}" (${filteredFoods.length} items found)` : 
          "Top dishes near you"
        }
      </h2>
      {isLoading && food_list.length === 0 ? (
        <>
          <div className="food-display-list">
            {Array.from({ length: 8 }).map((_, i) => (
              <FoodItemSkeleton key={i} />
            ))}
          </div>
          <p className="food-display-waking">
            Loading dishes… the server may be waking up, this can take up to a minute.
          </p>
        </>
      ) : (
      <div className="food-display-list">
        {filteredFoods.length > 0 ? (
          filteredFoods.map((item, index) => (
            <FoodItem
              key={index}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          ))
        ) : (
          <div className="no-results">
            <p>No items found matching your search criteria.</p>
            {searchTerm && (
              <p>Try searching with different keywords or browse our menu categories.</p>
            )}
          </div>
        )}
      </div>
      )}

      {/* Location Map Section */}
      <LocationMap 
        latitude={31.582045}
        longitude={74.329376}
        locationName="Lahore, Pakistan"
        popupText="🍕 Fast Food Delivery Available Here!"
        zoom={13}
      />

      {/* Chatbot - temporarily disabled */}
      {/* <Chatbot /> */}
    </div>
  );
};

export default FoodDisplay;
