import { ArxPolygonFlags } from 'arx-convert/types'
import { Material, Rotation, Texture, Vector3 } from 'arx-level-generator'
import { MathUtils, Vector2 } from 'three'
import { getIntersectionAtAngle, getVectorRadians } from '@/functions.js'
import { createTerrainProps } from '@/types.js'

export const bridgeBetween = (a: createTerrainProps, b: createTerrainProps): createTerrainProps => {
  const aSize = typeof a.size === 'number' ? new Vector2(a.size, a.size) : a.size
  const bSize = typeof b.size === 'number' ? new Vector2(b.size, b.size) : b.size

  const aPos = a.position?.clone() ?? new Vector3(0, 0, 0)
  const bPos = b.position?.clone() ?? new Vector3(0, 0, 0)

  const aAngle = MathUtils.degToRad(a.angleY ?? 0)
  const bAngle = MathUtils.degToRad(b.angleY ?? 0)

  // ----

  const a2b = bPos.clone().sub(aPos)
  const angleBetweenAandB = getVectorRadians(new Vector2(a2b.x, a2b.z))

  const aTargetVec2 = getIntersectionAtAngle(new Vector2(aPos.x, aPos.z), aSize, angleBetweenAandB + aAngle)
  const aTarget = new Vector3(aTargetVec2.x - aPos.x, 0, aTargetVec2.y - aPos.z)
  aTarget.applyEuler(new Rotation(0, aAngle, 0))
  aTarget.add(aPos)

  if (a.hasBumps ?? true) {
    aTarget.y += 30
  }

  // ----

  const b2a = aPos.clone().sub(bPos)
  const angleBetweenBandA = getVectorRadians(new Vector2(b2a.x, b2a.z))

  const bTargetVec2 = getIntersectionAtAngle(new Vector2(bPos.x, bPos.z), bSize, angleBetweenBandA + bAngle)
  const bTarget = new Vector3(bTargetVec2.x - bPos.x, 0, bTargetVec2.y - bPos.z)
  bTarget.applyEuler(new Rotation(0, bAngle, 0))
  bTarget.add(bPos)

  if (b.hasBumps ?? true) {
    bTarget.y += 30
  }

  // ----

  const a2bLength = bTarget.clone().sub(aTarget)

  const heightDiffAltitude = aPos.y - bPos.y
  const heightDiffBase = a2bLength.length()
  const heightAngle = Math.atan(heightDiffAltitude / heightDiffBase)

  const rotationAltitude = aPos.x - bPos.x
  const rotationBase = aPos.z - bPos.z
  const rotationAngle =
    Math.atan(rotationAltitude / rotationBase) +
    (MathUtils.radToDeg(angleBetweenAandB) > 180 ? MathUtils.degToRad(180) : 0)

  const rotation = new Rotation(heightAngle, rotationAngle, 0)

  // ----

  return {
    size: new Vector2(100, heightDiffBase + 50),
    position: aTarget.clone().add(a2bLength.clone().divideScalar(2)),
    orientation: rotation,
    texture: Material.fromTexture(Texture.l4DwarfWoodBoard02, {
      flags: ArxPolygonFlags.DoubleSided,
    }),
    hasBumps: false,
    hasLight: false,
    type: 'bridge',
  }
}
