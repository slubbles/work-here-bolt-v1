import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Utility function to safely serialize objects containing BigInt values
export function safeStringify(
  obj: any,
  replacer?: (key: string, value: any) => any,
  space?: string | number
): string {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return replacer ? replacer(key, value) : value;
    },
    space
  );
}

// Utility function to safely log objects that might contain BigInt values
export function safeLog(message: string, obj?: any): void {
  if (obj) {
    try {
      console.log(message, safeStringify(obj, undefined, 2));
    } catch (error) {
      console.log(message, obj);
    }
  } else {
    console.log(message);
  }
}