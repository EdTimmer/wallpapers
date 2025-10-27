import HexTile from './HexTile';

interface Props {
  position?: [number, number, number];
  count?: number;
  spacing?: number;
}

const HexTilesRow = ({ position = [0, 0, 0], count = 5, spacing = 0.65 }: Props) => {
  
  const generateTiles = () => {
    const tiles = [];
    // Calculate offset to center the tiles
    const offset = ((count - 1) * spacing) / 2;
    
    for (let i = 0; i < count; i++) {
      const xPosition = position[0] + (i * spacing) - offset;
      tiles.push(
        <HexTile 
          key={i} 
          position={[xPosition, position[1], position[2]]} 
          scale={0.356} 
        />
      );
    }
    return tiles;
  };

  return (
    <group>
      {generateTiles()}
    </group>
  );
};

export default HexTilesRow;
