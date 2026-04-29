import { motion } from 'framer-motion';

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}    // Start slightly lower and invisible
      animate={{ opacity: 1, y: 0 }}     // Slide up and fade in
      exit={{ opacity: 0, y: -10 }}      // Slide up slightly and fade out
      transition={{ 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1] // Custom "cubic-bezier" for a premium feel
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;