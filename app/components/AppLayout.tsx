import React from 'react';
import { useLocation } from 'react-router';
import { AdminLayout } from './AdminLayout';
import { FrontendLayout } from './FrontendLayout';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <FrontendLayout>{children}</FrontendLayout>;
};
