import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

const PageWrapper = ({ children }) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      key={location.pathname}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="min-h-full w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
