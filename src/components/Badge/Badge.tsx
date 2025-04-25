import React from 'react';
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './Badge.css';

interface BadgeProps {
  type: 'warning' | 'error';
  count: number;
}

const Badge: React.FC<BadgeProps> = ({ type, count }) => {
  if (count === 0) return null;

  const icon = type === 'warning' ? <WarningOutlined /> : <ExclamationCircleOutlined />;
  const text = type === 'warning' ? 'warn' : 'errors';
  const className = `badge ${type}`;

  return (
    <div className={className}>
      {icon}
      <span className="badge-text">{text}: {count}</span>
    </div>
  );
};

export default Badge; 