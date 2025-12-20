import Aurora from './Aurora'
import DotGrid from './DotGrid'

const BURST_PLANE_Z = 0
const GALAXY_PLANE_Z = 0.03

export default function AuroraDotGrid() {
	return (
		<group>
			<group position={[0, 0, BURST_PLANE_Z]}>
        <Aurora
					speed={0.47}
					intensity={0.8}
					blend={1.0}
					saturation={1.0}
					scale={1.4}
					verticalOffset={0.05}
					firstColor='#ddff00'
					secondColor='#00b30c'
					thirdColor='#00bfff'
					opacity={1.0}
					grainAmount={0.0}
					vignette={0.0}
					vignetteOpacity={1.0}
					fadeSpeed={0.1}
					distortionRadius={0.01}
					distortionStrength={0.0}
				/>
			</group>

			<group position={[0, 0, GALAXY_PLANE_Z]}>
			  <DotGrid
					dotSize={4}
					gap={19}
					baseColor='#1a1a1a'
					activeColor='#ffffff'
					proximity={70}
					activeDuration={1.0}
					mouseInteraction={true}
					activeOpacity={1.0}
					baseOpacity={1.0}
					shockRadius={200}
					shockStrength={2.0}
					shockSpeed={2.6}
				/>
			</group>
		</group>
	)
}
