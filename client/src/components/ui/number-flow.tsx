import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { formatNumber } from "@/lib/game-constants";

interface NumberFlowProps {
  value: number;
  className?: string;
  prefix?: string;
}

export function NumberFlow({ value, className, prefix = "" }: NumberFlowProps) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => formatNumber(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <span className={className}>
      {prefix}<motion.span>{display}</motion.span>
    </span>
  );
}
