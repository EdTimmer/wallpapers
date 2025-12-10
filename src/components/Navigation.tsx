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
      <Link to="/galaxy" className="button" style={{ cursor: 'pointer', border: location.pathname === '/galaxy' ? '1px solid white' : '1px solid transparent' }}>
        Galaxy
      </Link>
      <Link to="/prismatic-galaxy" className="button" style={{ cursor: 'pointer', border: location.pathname === '/prismatic-galaxy' ? '1px solid white' : '1px solid transparent' }}>
        Prismatic Galaxy
      </Link>
      <Link to="/squares" className="button" style={{ cursor: 'pointer', border: location.pathname === '/squares' ? '1px solid white' : '1px solid transparent' }}>
        Squares
      </Link>
      <Link to="/dot-grid" className="button" style={{ cursor: 'pointer', border: location.pathname === '/dot-grid' ? '1px solid white' : '1px solid transparent' }}>
        Dot Grid
      </Link>
      <Link to="/aurora-squares" className="button" style={{ cursor: 'pointer', border: location.pathname === '/aurora-squares' ? '1px solid white' : '1px solid transparent' }}>
        Aurora Squares
      </Link>

      <Link to="/aurora-dot-grid" className="button" style={{ cursor: 'pointer', border: location.pathname === '/aurora-dot-grid' ? '1px solid white' : '1px solid transparent' }}>
        Aurora Dot Grid
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