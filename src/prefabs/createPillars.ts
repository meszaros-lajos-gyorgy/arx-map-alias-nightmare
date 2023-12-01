import { Texture, Vector3 } from 'arx-level-generator'
import { scaleUV, toArxCoordinateSystem } from 'arx-level-generator/tools/mesh'
import { any } from 'arx-level-generator/utils/faux-ramda'
import { randomBetween } from 'arx-level-generator/utils/random'
import { quadtree as d3Quadtree } from 'd3-quadtree'
import { Box2, Box3, CylinderGeometry, Mesh, MeshBasicMaterial, Vector2 } from 'three'
import { TerrainItem } from '@/types.js'

const randomPointInArea = (area: Box2) => {
  const x = randomBetween(area.min.x, area.max.x)
  const y = randomBetween(area.min.y, area.max.y)
  return new Vector2(x, y)
}

/**
 * Poisson-disc distribution using Mitchell’s best-candidate
 *
 * @see https://stackoverflow.com/a/24947180/1806628
 * @see https://bost.ocks.org/mike/algorithms/
 * @see https://gist.github.com/mbostock/981b42034400e48ac637
 */
const createBestCandidateSampler = (area: Box2, numCandidates: number, numSamplesMax: number) => {
  const quadtree = d3Quadtree().extent([
    [area.min.x, area.min.y],
    [area.max.x, area.max.y],
  ])

  const p = randomPointInArea(area)
  quadtree.add([p.x, p.y])

  let numSamples = 0

  return () => {
    numSamples++

    if (numSamples > numSamplesMax) {
      return null
    }

    let bestCandidate: Vector2 | null = null
    let bestDistance = 0

    for (var i = 0; i < numCandidates; i++) {
      const c = randomPointInArea(area)
      const [x, y] = quadtree.find(c.x, c.y) as [number, number]
      const closest = new Vector2(x, y)

      const d = closest.distanceToSquared(c)

      if (d > bestDistance) {
        bestDistance = d
        bestCandidate = c
      }
    }

    if (bestCandidate === null) {
      return null
    }

    quadtree.add([bestCandidate.x, bestCandidate.y])

    return bestCandidate
  }
}

const createPillar = (pos: Vector3, pillarSize: Vector2) => {
  let geometry = new CylinderGeometry(pillarSize.x, pillarSize.x, pillarSize.y, 3, 4)
  geometry = toArxCoordinateSystem(geometry)

  scaleUV(new Vector2(pillarSize.x / 100, pillarSize.y / 100), geometry)

  const material = new MeshBasicMaterial({ map: Texture.stoneHumanAkbaa4F })
  const pillar = new Mesh(geometry, material)

  pillar.geometry.translate(pos.x, pos.y, pos.z)

  return pillar
}

export const createPillars = (numberOfPillars: number, terrainBBox: Box3, boundingBoxes: Box3[]): TerrainItem => {
  const terrainSize = Vector3.fromThreeJsVector3(terrainBBox.max.clone().sub(terrainBBox.min))
  const terrainCenter = Vector3.fromThreeJsVector3(terrainBBox.min.clone().add(terrainSize.clone().divideScalar(2)))
  const margin = 1500

  const pillars: Mesh[] = []

  const area = new Box2(
    new Vector2(terrainBBox.min.x - margin, terrainBBox.min.z - margin),
    new Vector2(terrainBBox.max.x + margin, terrainBBox.max.z + margin),
  )
  const getSample = createBestCandidateSampler(area, 10, numberOfPillars)

  const samples: Vector2[] = []

  let sample = getSample()
  while (sample !== null) {
    samples.push(sample)
    sample = getSample()
  }

  const pillarSize = new Vector2(5, 5000)

  let pos: Vector3
  let pillarBBox: Box3

  samples.forEach((s) => {
    pos = new Vector3(s.x, terrainCenter.y, s.y)

    pillarBBox = new Box3(
      new Vector3(pos.x - pillarSize.x / 2, pos.y - pillarSize.y / 2, pos.z - pillarSize.x / 2),
      new Vector3(pos.x + pillarSize.x / 2, pos.y + pillarSize.y / 2, pos.z + pillarSize.x / 2),
    )

    if (any((bbox) => bbox.intersectsBox(pillarBBox), boundingBoxes)) {
      return
    }

    const pillar = createPillar(pos, pillarSize)
    pillars.push(pillar)
  })

  return {
    meshes: pillars,
    entities: [],
    lights: [],
    zones: [],
  }
}
