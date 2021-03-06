import React from "react";

function Rating({ rating, numReviews }) {
  return (
    <div className="rating">
      <i
        className={
          rating >= 1
            ? "fa fa-star"
            : rating >= 0.5
            ? "fas fa-star-half-alt"
            : "far fa-star"
        }
      ></i>
      <i
        className={
          rating >= 2
            ? "fa fa-star"
            : rating >= 1.5
            ? "fas fa-star-half-alt"
            : "far fa-star"
        }
      ></i>
      <i
        className={
          rating >= 3
            ? "fa fa-star"
            : rating >= 2.5
            ? "fas fa-star-half-alt"
            : "far fa-star"
        }
      ></i>
      <i
        className={
          rating >= 4
            ? "fa fa-star"
            : rating >= 3.5
            ? "fas fa-star-half-alt"
            : "far fa-star"
        }
      ></i>
      <i
        className={
          rating >= 5
            ? "fa fa-star"
            : rating >= 4.5
            ? "fas fa-star-half-alt"
            : "far fa-star"
        }
      ></i>
      <span className="ml-3">{numReviews} Reviews</span>
    </div>
  );
}

export default Rating;
