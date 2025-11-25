import { useEffect, useState } from "react";

export default function useCartTotals() {
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    const updateTotals = () => {
      try {
        const savedCart = localStorage.getItem("cart");
        if (!savedCart) {
          setCartTotal(0);
          return;
        }

        const parsed = JSON.parse(savedCart);
        const totalCount = Object.values(parsed).reduce(
          (sum, item) => sum + (item?.quantity || 0),
          0
        );
        setCartTotal(totalCount);
      } catch {
        setCartTotal(0);
      }
    };

    updateTotals();
    window.addEventListener("storage", updateTotals);
    window.addEventListener("cartUpdated", updateTotals);

    return () => {
      window.removeEventListener("storage", updateTotals);
      window.removeEventListener("cartUpdated", updateTotals);
    };
  }, []);

  return cartTotal;
}

