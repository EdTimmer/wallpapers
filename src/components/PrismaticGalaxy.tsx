import PrismaticBurst from './PrismaticBurst'
import GalaxySimple from './GalaxySimple'

const BURST_PLANE_Z = 0
const GALAXY_PLANE_Z = 0.03

export default function PrismaticGalaxy() {
	return (
		<group>
			<group position={[0, 0, BURST_PLANE_Z]}>
				<PrismaticBurst colors={['#000000', '#000000', '#000000']} speed={0.5} intensity={2.0} animType={1} distort={0} noiseAmount={0.05} rayCount={0} opacity={1.0} pixelRatio={0.5} />
			</group>
			<group position={[0, 0, GALAXY_PLANE_Z]}>
				<GalaxySimple focal={[0.5, 0.5]} rotation={[1.0, 0.0]} starSpeed={0.5} density={1} hueShift={140} disableAnimation={false} speed={1.0} mouseInteraction={true} glowIntensity={0.5} saturation={0.0} mouseRepulsion={false} repulsionStrength={2} twinkleIntensity={0.3} rotationSpeed={0.1} autoCenterRepulsion={0} transparent={true} opacity={1.0} />
			</group>
		</group>
	)
}
