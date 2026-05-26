import React from "react";
import "./Skeleton.css";

// Generic shimmer placeholder block. Compose these to mirror real content layout.
const Skeleton = ({ width = "100%", height = "1em", radius = "8px", className = "", style = {} }) => (
  <span
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

export default Skeleton;
