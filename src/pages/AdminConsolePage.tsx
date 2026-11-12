import React from 'react';
import { AdminModal } from '../components/AdminModal.tsx';
import type { Category, Authority } from '../types.ts';

interface AdminConsolePageProps {
  onBack: () => void;
  categories: Category[];
  authorities: Authority[];
  onRefreshData: () => void;
}

export const AdminConsolePage: React.FC<AdminConsolePageProps> = ({
  onBack,
  categories,
  authorities,
  onRefreshData,
}) => {
  return (
    <AdminModal
      isOpen={true}
      onClose={onBack}
      categories={categories}
      authorities={authorities}
      onRefreshData={onRefreshData}
      fullPage={true}
    />
  );
};
