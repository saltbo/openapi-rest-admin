import React from "react";
import { FrontendLayout } from "./FrontendLayout";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return <FrontendLayout>{children}</FrontendLayout>;
};
