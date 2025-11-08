import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation();

  return (
    <div className="buttons-container">
      <Link to="/wall-a" className="button" style={{ cursor: 'pointer', border: location.pathname === '/wall-a' ? '1px solid white' : '1px solid transparent' }}>
        Wallpaper A
      </Link>
      <Link to="/wall-b" className="button" style={{ cursor: 'pointer', border: location.pathname === '/wall-b' ? '1px solid white' : '1px solid transparent' }}>
        Wallpaper B
      </Link>
      <Link to="/wall-c" className="button" style={{ cursor: 'pointer', border: location.pathname === '/wall-c' ? '1px solid white' : '1px solid transparent' }}>
        Wallpaper C
      </Link>
      <Link to="/wall-d" className="button" style={{ cursor: 'pointer', border: location.pathname === '/wall-d' ? '1px solid white' : '1px solid transparent' }}>
        Wallpaper D
      </Link>
    </div>
  )
}

export default Navigation