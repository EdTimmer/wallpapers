import '../App.css'
import { Link } from 'react-router-dom'

interface StyledButtonProps {
  label: string;
  to: string;
  isActive: boolean;
}

const StyledButton = ({ label, to, isActive }: StyledButtonProps) => {
  return (
    <div className={isActive ? "card-border-effect" : ""}>
      <Link to={to} className={`card-content ${isActive ? 'active' : ''}`}>
        <h2 className="styled-button-label">{label}</h2>      
      </Link>
    </div>
  );
};

export default StyledButton;