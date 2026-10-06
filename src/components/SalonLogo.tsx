import React, { useState } from "react";
import { SalonProfile } from "../types";

interface SalonLogoProps {
  salon: Partial<SalonProfile>;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  roundedClassName?: string;
}

export const SalonLogo: React.FC<SalonLogoProps> = ({
  salon,
  size = "md",
  className = "",
  roundedClassName = "rounded-xl",
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: "w-7 h-7 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-11 h-11 text-lg",
    lg: "w-14 h-14 text-2xl",
    xl: "w-20 h-20 text-3xl",
  };

  const hasImage = salon.logoType === "image" && salon.logoUrl && !imgError;

  if (hasImage) {
    return (
      <div
        className={`${sizeClasses[size]} ${roundedClassName} bg-stone-100 border border-stone-200/80 overflow-hidden flex items-center justify-center shrink-0 shadow-xs ${className}`}
      >
        <img
          src={salon.logoUrl}
          alt={salon.salonName || "Salon Logo"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${roundedClassName} bg-stone-900 text-white flex items-center justify-center font-bold shrink-0 shadow-xs select-none ${className}`}
    >
      <span>{salon.logoEmoji || "💅"}</span>
    </div>
  );
};
