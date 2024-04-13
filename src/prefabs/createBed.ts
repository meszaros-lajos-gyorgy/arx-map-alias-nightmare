import { $, ArxMap, Settings, Texture, Vector3 } from 'arx-level-generator'
import { Box3 } from 'three'

export const createBed = async ({ position, scale = 1 }: { position: Vector3; scale?: number }, settings: Settings) => {
  const rebelCampMap = await ArxMap.fromOriginalLevel(16, settings)

  const center = new Vector3(8854, 650, 5655)
  const box = new Box3(
    center.clone().add(new Vector3(-200, -100, -200)),
    center.clone().add(new Vector3(200, 100, 200)),
  )

  const adjustment = new Vector3(0, 40, 0)
  const inverseCenter = center.clone().multiplyScalar(-1)

  return $(rebelCampMap.polygons)
    .selectWithinBox(box)
    .selectByTextures([Texture.l3DissidWoodFabric03, Texture.l3DissidWoodFabric04])
    .copy()
    .moveToRoom1()
    .move(inverseCenter)
    .move(adjustment)
    .scale(scale)
    .move(position)
    .get()
}
