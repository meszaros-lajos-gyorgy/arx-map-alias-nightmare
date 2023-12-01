import { DoubleOf } from 'arx-convert/utils'
import { Texture, Vector3 } from 'arx-level-generator'
import { scaleUV, toArxCoordinateSystem } from 'arx-level-generator/tools/mesh'
import { none } from 'arx-level-generator/utils/faux-ramda'
import { randomBetween } from 'arx-level-generator/utils/random'
import { quadtree as d3Quadtree } from 'd3-quadtree'
import { Box2, Box3, CylinderGeometry, Mesh, MeshBasicMaterial, Vector2 } from 'three'
import { TerrainItem } from '@/types.js'

const randomPointInArea = (area: Box2) => {
  const x = randomBetween(area.min.x, area.max.x)
  const y = randomBetween(area.min.y, area.max.y)
  return new Vector2(x, y)
}

const tupleToVector2 = ([x, y]: DoubleOf<number>) => {
  return new Vector2(x, y)
}

const vector2ToTuple = (p: Vector2) => {
  return [p.x, p.y] as DoubleOf<number>
}

const nullVector = new Vector2(0, 0)

/**
 * Poisson-disc distribution using Mitchell’s best-candidate
 *
 * @see https://stackoverflow.com/a/24947180/1806628
 * @see https://bost.ocks.org/mike/algorithms/
 * @see https://gist.github.com/mbostock/981b42034400e48ac637
 */
const fillArea = (area: Box2, numberOfCandidates: number, numberOfSamples: number) => {
  const quadtree = d3Quadtree().extent([vector2ToTuple(area.min), vector2ToTuple(area.max)])

  quadtree.add(vector2ToTuple(randomPointInArea(area)))

  const points: Vector2[] = []

  for (let i = 0; i < numberOfSamples; i++) {
    let bestCandidate = nullVector
    let bestDistance = 0

    for (let j = 0; j < numberOfCandidates; j++) {
      const candidate = randomPointInArea(area)
      const closestPoint = tupleToVector2(quadtree.find(candidate.x, candidate.y) as DoubleOf<number>)
      const distance = closestPoint.distanceToSquared(candidate)

      if (distance > bestDistance) {
        bestDistance = distance
        bestCandidate = candidate
      }
    }

    quadtree.add(vector2ToTuple(bestCandidate))

    points.push(bestCandidate)
  }

  return points
}

const createPillar = (pos: Vector3, pillarSize: Vector2) => {
  let geometry = new CylinderGeometry(pillarSize.x, pillarSize.x, pillarSize.y, 3, 4)
  geometry = toArxCoordinateSystem(geometry)
  geometry.translate(pos.x, pos.y, pos.z)

  scaleUV(new Vector2(pillarSize.x / 100, pillarSize.y / 100), geometry)

  const material = new MeshBasicMaterial({ map: Texture.stoneHumanAkbaa4F })

  return new Mesh(geometry, material)
}

const getPillarBBox = (pos: Vector3, pillarSize: Vector2) => {
  const pillarBBoxMin = new Vector3(pillarSize.x / 2, pillarSize.y / 2, pillarSize.x / 2)
  const pillarBBoxMax = new Vector3(pillarSize.x / 2, pillarSize.y / 2, pillarSize.x / 2)

  return new Box3(pos.clone().sub(pillarBBoxMin), pos.clone().add(pillarBBoxMax))
}

/**
 * Fills up a given area with pillars
 *
 * An extra margin of 1500 units around the outskirts of the map will be added in all 4 directions
 *
 * @param numberOfPillars how many pillars to be added
 * @param area the area containing all islands and bridges
 * @param excludedZones a list of individual areas around each island and bridge
 */
export const createPillars = (numberOfPillars: number, area: Box3, excludedZones: Box3[]): TerrainItem => {
  const areaSize = area.max.clone().sub(area.min)
  const areaCenter = area.min.clone().add(areaSize.clone().divideScalar(2))
  const margin = 1500

  const area2DWithMargin = new Box2(
    new Vector2(area.min.x - margin, area.min.z - margin),
    new Vector2(area.max.x + margin, area.max.z + margin),
  )

  const pillarSize = new Vector2(5, 5000)
  const points = fillArea(area2DWithMargin, 10, numberOfPillars)

  const pillars = points.reduce((pillars, point) => {
    const pos = new Vector3(point.x, areaCenter.y, point.y)
    const pillarBBox = getPillarBBox(pos, pillarSize)

    if (none((bbox) => bbox.intersectsBox(pillarBBox), excludedZones)) {
      pillars.push(createPillar(pos, pillarSize))
    }

    return pillars
  }, [] as Mesh[])

  return {
    meshes: pillars,
    entities: [],
    lights: [],
    zones: [],
  }
}
