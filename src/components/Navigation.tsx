import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation();

  return (
    <div className="buttons-container">
      <Link to="/aurora" className="button" style={{ cursor: 'pointer', border: location.pathname === '/aurora' ? '1px solid white' : '1px solid transparent' }}>
        Aurora
      </Link>
      <Link to="/prismatic-burst" className="button" style={{ cursor: 'pointer', border: location.pathname === '/prismatic-burst' ? '1px solid white' : '1px solid transparent' }}>
        Prismatic Burst
      </Link>
      <Link to="/wall-a" className="button" style={{ cursor: 'pointer', border: location.pathname === '/wall-a' ? '1px solid white' : '1px solid transparent' }}>
        Wallpaper A
      </Link>
      <Link to="/wall-b" className="button" style={{ cursor: 'pointer', border: location.pathname === '/wall-b' ? '1px solid white' : '1px solid transparent' }}>
        Wallpaper B
      </Link>
      <Link to="/wall-c" className="button" style={{ cursor: 'pointer', border: location.pathname === '/wall-c' ? '1px solid white' : '1px solid transparent' }}>
        Wallpaper C
      </Link>
    </div>
  )
}

export default Navigation