import { useLocation } from 'react-router-dom'
import StyledButton from './StyledButton';

function Navigation() {
  const location = useLocation();

  return (
    <div className="buttons-container">
      <StyledButton
        label="Aurora"
        to="/aurora"
        isActive={location.pathname === '/aurora'}
      />
      <StyledButton
        label="Prismatic Burst"
        to="/prismatic-burst"
        isActive={location.pathname === '/prismatic-burst'}
      />
      <StyledButton
        label="Galaxy"
        to="/galaxy"
        isActive={location.pathname === '/galaxy'}
      />
      <StyledButton
        label="Prismatic Galaxy"
        to="/prismatic-galaxy"
        isActive={location.pathname === '/prismatic-galaxy'}
      />
      <StyledButton
        label="Squares"
        to="/squares"
        isActive={location.pathname === '/squares'}
      />
      <StyledButton
        label="Dot Grid"
        to="/dot-grid"
        isActive={location.pathname === '/dot-grid'}
      />
      <StyledButton
        label="Aurora Squares"
        to="/aurora-squares"
        isActive={location.pathname === '/aurora-squares'}
      />
      <StyledButton
        label="Aurora Dot Grid"
        to="/aurora-dot-grid"
        isActive={location.pathname === '/aurora-dot-grid'}
      />
      <StyledButton
        label="Wallpaper A"
        to="/wall-a"
        isActive={location.pathname === '/wall-a'}
      />
      <StyledButton
        label="Wallpaper B"
        to="/wall-b"
        isActive={location.pathname === '/wall-b'}
      />
      <StyledButton
        label="Wallpaper C"
        to="/wall-c"
        isActive={location.pathname === '/wall-c'}
      />
    </div>
  )
}

export default Navigation