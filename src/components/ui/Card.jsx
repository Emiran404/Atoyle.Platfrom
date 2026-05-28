import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  ...props
}) => {
  const paddings = {
    none: 0,
    sm: '12px',
    md: '16px',
    lg: '24px'
  };

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    padding: paddings[padding],
    transition: hover ? 'all 0.2s ease' : 'none',
    cursor: hover ? 'pointer' : 'default'
  };

  return (
    <div
      style={cardStyle}
      className={className}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = 'var(--color-border-dark)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }} className={className}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }} className={className}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }} className={className}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }} className={className}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export { Card };
