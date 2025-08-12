
import { cn } from "@/lib/utils";

export const SagaLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-6 h-6", className)}
  >
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 15.5C15.5 15.5 14.5 17 12 17C9.5 17 8.5 15.5 8.5 15.5"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 8.5C9.67157 8.5 10.5 9.32843 10.5 10.5C10.5 11.6716 9.67157 12.5 8.5 12.5C7.32843 12.5 6.5 11.6716 6.5 10.5C6.5 9.32843 7.32843 8.5 8.5 8.5Z"
      fill="hsl(var(--primary))"
    />
    <path
      d="M15.5 8.5C16.6716 8.5 17.5 9.32843 17.5 10.5C17.5 11.6716 16.6716 12.5 15.5 12.5C14.3284 12.5 13.5 11.6716 13.5 10.5C13.5 9.32843 14.3284 8.5 15.5 8.5Z"
      fill="hsl(var(--primary))"
    />
  </svg>
);
