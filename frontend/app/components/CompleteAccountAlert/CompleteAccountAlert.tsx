import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./prompt.module.css";
import { LatLng } from "leaflet";

interface CompleteAccountAlertProps {
  verified: boolean;
  userCoordinates: LatLng | null;
}

const CompleteAccountAlert: React.FC<CompleteAccountAlertProps> = ({ verified, userCoordinates }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || (verified && userCoordinates)) return null;

  const message = !verified
    ? "Please verify your account to access all features."
    : "Complete your account by adding your adress for better event recommendations.";

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.verificationPrompt}
    >
      {message}
      <button className={styles.closeButton} onClick={() => setIsVisible(false)}>✖</button>
    </motion.div>
  );
};

export default CompleteAccountAlert;
