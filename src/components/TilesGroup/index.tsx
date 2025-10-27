import HexTilesRow from './HexTilesRow';

interface Props {
  rows?: number;
  tilesPerRow?: number;
  verticalSpacing?: number;
  horizontalOffset?: number;
  position?: [number, number, number];
}

const TilesGroup = ({ 
  rows = 3, 
  tilesPerRow = 5, 
  verticalSpacing = 0.565,
  horizontalOffset = 0.325,
  position = [0, 0, 0]
}: Props) => {
  
  const generateRows = () => {
    const rowElements = [];
    // Calculate offset to center the rows vertically
    const yOffset = ((rows - 1) * verticalSpacing) / 2;
    
    for (let i = 0; i < rows; i++) {
      const yPosition = (i * verticalSpacing) - yOffset;
      // Alternate horizontal offset for even/odd rows (for hexagonal pattern)
      const xPosition = i % 2 === 0 ? 0 : horizontalOffset;
      
      rowElements.push(
        <HexTilesRow 
          key={i} 
          position={[xPosition, yPosition, 0]} 
          count={tilesPerRow}
        />
      );
    }
    return rowElements;
  };

  return (
    <group position={position}>
      {generateRows()}
    </group>
  );
};

export default TilesGroup;
