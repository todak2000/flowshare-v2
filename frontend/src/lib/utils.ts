import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
export const formatVolume = (volume: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(volume);
};


// Get last day of month at 23:59:59.999
export const getLastDayOfMonth = (year: number, monthIndex: number): Date => {
  const date = new Date(year, monthIndex + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
};

// Get start/end of month (for API queries)
export const getMonthRange = (year: number, monthIndex: number): { startDate: Date; endDate: Date } => {
  const startDate = new Date(year, monthIndex, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(year, monthIndex + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

// Format Date as YYYY-MM-DD (ISO date part)
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Get display string for receipt date
export const formatReceiptDisplayDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Generate last 12 months (offset-based)
export const getPast12MonthsOptions = (): { value: number; label: string }[] => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const offset = -i;
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      value: offset,
      label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  });
};

export function formatMonth(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long" });
}

export const formatVolumeMbbls = (volume: number): string => {
  return formatVolume(volume / 1000);
};

export const formatDateToISO = (dateString: string): string => {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};

export const formatLimit = (value: number): string => {
  return value === -1 ? 'Unlimited' : value.toString();
};

export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};