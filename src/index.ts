import { ArxMap, DONT_QUADIFY, Entity, HudElements, SHADING_SMOOTH, Settings, Vector3 } from 'arx-level-generator'
import { Rune } from 'arx-level-generator/prefabs/entity'
import { applyTransformations } from 'arx-level-generator/utils'
import { randomSort } from 'arx-level-generator/utils/random'
import { Box3 } from 'three'
import { getGeometryBoundingBox } from '@/functions.js'
import { bridgeBetween } from '@/prefabs/bridgeBetween.js'
import { createColumns } from '@/prefabs/createColumns.js'
import { createFallInducer } from '@/prefabs/createFallInducer.js'
import { createSpawnZone } from '@/prefabs/createSpawnZone.js'
import { createTerrain } from '@/prefabs/createTerrain.js'
import { TerrainItem } from '@/types.js'
import { createIslands } from './data/createIslands.js'

const settings = new Settings()

const map = new ArxMap()
map.config.offset = new Vector3(6000, 0, 6000)
map.player.position.adjustToPlayerHeight()
map.player.withScript()
map.hud.hide(HudElements.Minimap)

await map.i18n.addFromFile('./i18n.json', settings)

// ----------------------

const rootRune = new Rune('aam', { arxTutorialEnabled: false })
rootRune.script?.makeIntoRoot()

const lootRootEntities = [rootRune] as Entity[]

const islands = createIslands()
islands[0].loot?.push(...lootRootEntities)

const allLoot = randomSort([
  new Rune('mega'),
  new Rune('spacium'),
  new Rune('movis'),
  // TODO
] as Entity[])

const islandIdxs = randomSort([...islands.keys()])
allLoot.forEach((entity, idx) => {
  const island = islands[islandIdxs[idx % islands.length]]
  island.loot?.push(entity)
})

const terrainItems: TerrainItem[] = [
  ...islands.map((island) => createTerrain(island)),

  createTerrain(bridgeBetween(islands[0], islands[1])),
  createTerrain(bridgeBetween(islands[0], islands[2])),
  createTerrain(bridgeBetween(islands[0], islands[4])),
  createTerrain(bridgeBetween(islands[0], islands[6])),
  createTerrain(bridgeBetween(islands[1], islands[2])),
  createTerrain(bridgeBetween(islands[1], islands[3])),
  createTerrain(bridgeBetween(islands[2], islands[5])),
  createTerrain(bridgeBetween(islands[3], islands[7])),
  createTerrain(bridgeBetween(islands[4], islands[7])),
]

const boundingBoxes = terrainItems.flatMap(({ meshes }) => meshes).map((mesh) => getGeometryBoundingBox(mesh.geometry))

const terrainBBox = boundingBoxes.reduce((acc, curr) => {
  acc.expandByPoint(curr.min)
  acc.expandByPoint(curr.max)
  return acc
}, new Box3())

terrainItems.push(createColumns(200, terrainBBox, boundingBoxes))
terrainItems.push(createFallInducer(terrainBBox, islands[0].position ?? new Vector3(0, 0, 0)))

terrainItems
  .flatMap(({ meshes }) => meshes)
  .forEach((mesh) => {
    applyTransformations(mesh)
    mesh.translateX(map.config.offset.x)
    mesh.translateY(map.config.offset.y)
    mesh.translateZ(map.config.offset.z)
    applyTransformations(mesh)
    map.polygons.addThreeJsMesh(mesh, {
      tryToQuadify: DONT_QUADIFY,
      shading: SHADING_SMOOTH,
    })
  })

terrainItems.forEach(({ lights, entities, zones }) => {
  map.lights.push(...lights)
  map.entities.push(...entities)
  map.zones.push(...zones)
})

map.zones.push(createSpawnZone(new Vector3(0, 0, 0)))

// ----------------------

map.finalize()
await map.saveToDisk(settings)

console.log('done')
