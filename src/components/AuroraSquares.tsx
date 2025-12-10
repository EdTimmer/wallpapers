import Aurora from './Aurora'
import Squares from './Squares'

const BURST_PLANE_Z = 0
const GALAXY_PLANE_Z = 0.03

export default function AuroraSquares() {
	return (
		<group>
			<group position={[0, 0, BURST_PLANE_Z]}>
        <Aurora speed={0.47} intensity={0.8} blend={1.0} saturation={1.0} scale={1.4} verticalOffset={0.05} firstColor='#ddff00' secondColor='#00b30c' thirdColor='#00bfff' opacity={1.0} grainAmount={0.0} vignette={0.0} fadeSpeed={0.1} distortionRadius={0.01} distortionStrength={0.0} />
			</group>

			<group position={[0, 0, GALAXY_PLANE_Z]}>
			  <Squares speed={0.31} squareSize={71} direction='up' borderColor='#1a1a1a' />
			</group>
		</group>
	)
}
