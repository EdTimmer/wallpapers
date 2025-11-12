import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2, Raycaster } from 'three'
import { useControls, button } from 'leva'
import vertexShader from '@shaders/wallShadersA/vertex_cells_a.glsl'
import fragmentShader from '@shaders/wallShadersA/fragment_cells_a.glsl'

interface ClickedCell {
  cellID: Vector2
  strength: number
  age: number
}

export default function WallA() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)
  const [clickedCells, setClickedCells] = useState<ClickedCell[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const { camera, gl } = useThree()

  const DEFAULTS = {
    'Res X': 6230,
    'Res Y': 9440,
    'Anim Speed': 0.3,
    'Fade Speed': 0.5,
    'Click': '#ff00fd',
    'Click Intensity': 0.7,
    'Base': '#33cc80',
    'Base Intensity': 0.3
  }

  const [{ 'Res X': resolutionX, 'Res Y': resolutionY, 'Anim Speed': animationSpeed, 'Fade Speed': fadeSpeed, Base: baseColor, 'Base Intensity': colorIntensity, Click: clickColor, 'Click Intensity': clickColorIntensity }, set] = useControls('CellsA', () => ({
    'Res X': { value: DEFAULTS['Res X'], min: 1000, max: 10000, step: 10 },
    'Res Y': { value: DEFAULTS['Res Y'], min: 1000, max: 14000, step: 10 },
    'Anim Speed': { value: DEFAULTS['Anim Speed'], min: 0, max: 5, step: 0.1 },
    'Base': { value: DEFAULTS['Base'] },    
    'Base Intensity': { value: DEFAULTS['Base Intensity'], min: 0, max: 1, step: 0.01 },
    'Click': { value: DEFAULTS['Click'] },
    'Click Intensity': { value: DEFAULTS['Click Intensity'], min: 0, max: 1, step: 0.01 },
    'Fade Speed': { value: DEFAULTS['Fade Speed'], min: 0.1, max: 3, step: 0.1 },
    
    'Reset All': button(() => set(DEFAULTS))
  }))

  const uniforms = useMemo(
    () => ({
      resolution: { value: new Vector2(1920, 1080) },
      time: { value: 0 },
      uClickedCells: { value: Array(20).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(20).fill(0) },
      uClickCount: { value: 0 },
      uClickColor: { value: [1.0, 0.0, 0.0] },
      uColorIntensity: { value: 0.3 },
      uClickColorIntensity: { value: 0.3 },
      uBaseColor: { value: [0.2, 0.8, 0.5] }
    }),
    []
  )

  useEffect(() => {
    const getCellIDFromEvent = (event: MouseEvent): Vector2 | null => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new Raycaster()
      raycaster.setFromCamera(new Vector2(x, y), camera)
      
      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current)
        
        if (intersects.length > 0 && intersects[0].uv) {
          const uv = intersects[0].uv
          
          // Calculate cell ID based on UV and resolution
          const center = new Vector2(uv.x - 0.5, uv.y - 0.5)
          const scaledUV = new Vector2(
            center.x * resolutionX / 100.0,
            center.y * resolutionY / 100.0
          )
          const cellID = new Vector2(
            Math.floor(scaledUV.x),
            Math.floor(scaledUV.y)
          )
          return cellID
        }
      }
      return null
    }

    const addOrUpdateCell = (cellID: Vector2) => {
      setClickedCells(prev => {
        // Check if this cell is already clicked
        const existing = prev.find(
          cell => cell.cellID.x === cellID.x && cell.cellID.y === cellID.y
        )
        
        if (existing) {
          // Reset strength to full if already exists
          return prev.map(cell =>
            cell.cellID.x === cellID.x && cell.cellID.y === cellID.y
              ? { ...cell, strength: 1.0, age: 0 }
              : cell
          )
        } else {
          // Add new cell
          const newCell: ClickedCell = {
            cellID,
            strength: 1.0,
            age: 0
          }
          return [...prev, newCell].slice(-20) // Keep last 20 cells
        }
      })
    }

    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true)
      const cellID = getCellIDFromEvent(event)
      if (cellID) {
        addOrUpdateCell(cellID)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const cellID = getCellIDFromEvent(event)
        if (cellID) {
          addOrUpdateCell(cellID)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    gl.domElement.addEventListener('mouseleave', handleMouseUp)
    
    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('mouseup', handleMouseUp)
      gl.domElement.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [camera, gl, resolutionX, resolutionY, isDragging])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value = new Vector2(resolutionX, resolutionY)
      
      // Convert click color hex to RGB array (0-1 range)
      const clickHex = clickColor.replace('#', '')
      const cr = parseInt(clickHex.substring(0, 2), 16) / 255
      const cg = parseInt(clickHex.substring(2, 4), 16) / 255
      const cb = parseInt(clickHex.substring(4, 6), 16) / 255
      materialRef.current.uniforms.uClickColor.value = [cr, cg, cb]
      
      // Convert base color hex to RGB array (0-1 range)
      const baseHex = baseColor.replace('#', '')
      const br = parseInt(baseHex.substring(0, 2), 16) / 255
      const bg = parseInt(baseHex.substring(2, 4), 16) / 255
      const bb = parseInt(baseHex.substring(4, 6), 16) / 255
      materialRef.current.uniforms.uBaseColor.value = [br, bg, bb]
      
      materialRef.current.uniforms.uColorIntensity.value = colorIntensity
      materialRef.current.uniforms.uClickColorIntensity.value = clickColorIntensity
    }
  }, [resolutionX, resolutionY, clickColor, colorIntensity, clickColorIntensity, baseColor])

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime * animationSpeed
      
      // Fade out clicked cells over time
      setClickedCells(prev => {
        return prev
          .map(cell => ({
            ...cell,
            age: cell.age + delta,
            strength: Math.max(0, cell.strength - delta * fadeSpeed)
          }))
          .filter(cell => cell.strength > 0.01)
      })
      
      // Update shader uniforms
      const cellIDs = Array(20).fill(new Vector2(0, 0))
      const strengths = Array(20).fill(0)
      
      clickedCells.forEach((cell, index) => {
        if (index < 20) {
          cellIDs[index] = cell.cellID
          strengths[index] = cell.strength
        }
      })
      
      materialRef.current.uniforms.uClickedCells.value = cellIDs
      materialRef.current.uniforms.uClickStrengths.value = strengths
      materialRef.current.uniforms.uClickCount.value = Math.min(clickedCells.length, 20)
    }
  })

  return (
    <mesh ref={meshRef} scale={2.0}>
      <planeGeometry args={[120, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
