import type {ReactNode} from "react";

interface AlertProps {
  children: ReactNode;
  variant: "success" | "error" | "warning" | "info";
}

const variantClasses: Record<AlertProps["variant"], string> = {
  success: "bg-green-800 text-green-200",
  error: "bg-red-800 text-red-200",
  warning: "bg-yellow-800 text-yellow-200",
  info: "bg-blue-800 text-blue-200",
};

function Alert(
  {children, variant = "info"}: AlertProps
) {
  return (
    <span
      className={"px-3 py-0.5 rounded-full " + variantClasses[variant]}
    >
      {children}
    </span>
  )
}

export default Alert;
