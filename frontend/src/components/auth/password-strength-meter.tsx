"use client";

import { motion } from "framer-motion";
import {
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/validation";

interface PasswordStrengthMeterProps {
  password: string;
  show: boolean;
}

export function PasswordStrengthMeter({ password, show }: PasswordStrengthMeterProps) {
  if (!show || !password) return null;

  const strength = calculatePasswordStrength(password);
  const label = getPasswordStrengthLabel(strength);
  const color = getPasswordStrengthColor(strength);
  const percentage = ((strength + 1) / 4) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Password strength:</span>
        <span style={{ color }} className="font-medium">
          {label}
        </span>
      </div>

      {/* Strength meter bars */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: index <= strength ? "100%" : "0%",
                backgroundColor: index <= strength ? color : "#e5e7eb",
              }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="h-full rounded-full"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
