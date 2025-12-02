import PrismaticBurst from './PrismaticBurst'
import GalaxySimple from './GalaxySimple'

const BURST_PLANE_Z = 0
const GALAXY_PLANE_Z = 0.03

export default function PrismaticGalaxy() {
	return (
		<group>
			<group position={[0, 0, BURST_PLANE_Z]}>
				<PrismaticBurst />
			</group>
			<group position={[0, 0, GALAXY_PLANE_Z]}>
				<GalaxySimple />
			</group>
		</group>
	)
}
