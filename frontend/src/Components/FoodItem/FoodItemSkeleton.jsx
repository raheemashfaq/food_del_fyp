import React from "react";
import "./FoodItem.css";
import Skeleton from "../Skeleton/Skeleton";

// Mirrors the FoodItem layout so the grid doesn't shift when real cards load.
const FoodItemSkeleton = () => (
  <div className="food-item">
    <Skeleton height="200px" radius="15px 15px 0 0" />
    <div className="food-item-info">
      <div className="food-item-name-rating">
        <Skeleton width="55%" height="20px" />
        <Skeleton width="70px" height="18px" />
      </div>
      <Skeleton width="100%" height="13px" style={{ marginTop: "8px" }} />
      <Skeleton width="80%" height="13px" style={{ marginTop: "6px" }} />
      <Skeleton width="35%" height="22px" style={{ marginTop: "12px" }} />
    </div>
  </div>
);

export default FoodItemSkeleton;
