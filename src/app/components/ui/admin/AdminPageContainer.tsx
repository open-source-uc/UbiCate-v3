import { ReactNode } from 'react';

interface AdminPageContainerProps {
  title: string;
  children: ReactNode;
  actionButton?: ReactNode;
}

export const AdminPageContainer: React.FC<AdminPageContainerProps> = ({ 
  title, 
  children, 
  actionButton 
}) => {
  return (
    <div style={{ 
      padding: "24px",
      maxHeight: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ 
        marginBottom: "24px" 
      }}>
        <h1 style={{ 
          fontSize: "2rem", 
          color: "#0176DE", 
          margin: 0,
          marginBottom: actionButton ? "12px" : 0,
          fontWeight: "600"
        }}>
          {title}
        </h1>
        {actionButton && (
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end" 
          }}>
            <div style={{ 
              fontSize: "0.875rem",
              transform: "scale(0.9)"
            }}>
              {actionButton}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
};

export default AdminPageContainer;