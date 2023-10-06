import { getVertices } from 'arx-level-generator/tools/mesh'
import { Box3, BufferGeometry, Vector2 } from 'three'

const tau = Math.PI * 2
const quarterPi = Math.PI / 4
const halfPi = Math.PI / 2

export const getVectorRadians = (v: Vector2) => {
  return (tau + Math.atan2(v.y, v.x)) % tau
}

export const getSquarePolarRadius = (phi: number) => {
  let phiInPiBy4Range = phi

  while (phiInPiBy4Range > quarterPi) {
    phiInPiBy4Range -= halfPi
  }

  while (phiInPiBy4Range < -quarterPi) {
    phiInPiBy4Range += halfPi
  }

  return 1 / Math.cos(phiInPiBy4Range)
}

export const getIntersectionAtAngle = (origin: Vector2, rectangle: Vector2, alpha: number) => {
  const v = new Vector2((Math.cos(alpha) * rectangle.x) / 2, (Math.sin(alpha) * rectangle.y) / 2)
  return v.multiplyScalar(getSquarePolarRadius(alpha)).add(origin)
}

export const getGeometryBoundingBox = (geometry: BufferGeometry) => {
  const bbox = new Box3()
  const vertices = getVertices(geometry)

  vertices.forEach(({ vector }) => {
    bbox.expandByPoint(vector)
  })

  return bbox
}
