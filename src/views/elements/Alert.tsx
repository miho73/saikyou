import type {ReactNode} from "react";

interface AlertProps {
  children: ReactNode;
  variant: "success" | "error" | "warning" | "info";
  detail?: string;
}

const variantClasses: Record<AlertProps["variant"], string> = {
  success: "bg-green-700 text-green-100",
  error: "bg-red-700 text-red-100",
  warning: "bg-yellow-700 text-yellow-100",
  info: "bg-blue-700 text-blue-100",
};

function Alert(
  {children, variant = "info", detail}: AlertProps
) {
  return (
    <span
      className={"px-4 py-1.5 rounded-full " + variantClasses[variant]}
      title={detail}
    >
      {children}
    </span>
  )
}

export default Alert;
