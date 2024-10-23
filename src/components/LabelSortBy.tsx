import React, { FC, ReactNode } from 'react';

interface LabelSortByProps {
  field: string;
  value: 'asc' | 'desc' | null;
  children: ReactNode;
  allowSort: boolean;
}

const LabelSortBy: FC<LabelSortByProps> = ({ value, children, allowSort }) => {
  return (
    <>
      {allowSort && (
        <span>
          {children}
          {value === 'asc' && <i></i>}
          {value === 'desc' && <i></i>}
        </span>
      )}
      {!allowSort && <>{children}</>}
    </>
  );
};

export default LabelSortBy;
