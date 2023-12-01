import {
  ArxMap,
  DONT_QUADIFY,
  Entity,
  HudElements,
  Rotation,
  SHADING_SMOOTH,
  Settings,
  Vector3,
} from 'arx-level-generator'
import { Rune } from 'arx-level-generator/prefabs/entity'
import { Speed } from 'arx-level-generator/scripting/properties'
import { applyTransformations } from 'arx-level-generator/utils'
import { randomSort } from 'arx-level-generator/utils/random'
import { Box3, MathUtils } from 'three'
import { getGeometryBoundingBox } from '@/functions.js'
import { bridgeBetween } from '@/prefabs/bridgeBetween.js'
import { createColumns } from '@/prefabs/createColumns.js'
import { createFallInducer } from '@/prefabs/createFallInducer.js'
import { createSpawnZone } from '@/prefabs/createSpawnZone.js'
import { createTerrain } from '@/prefabs/createTerrain.js'
import { TerrainItem } from '@/types.js'
import { islandWithTree, islands } from './data/islands.js'
import { createGameStateManager } from './gameStateManager.js'
import { createTree } from './prefabs/createTree.js'

const settings = new Settings()

const map = new ArxMap()
map.config.offset = new Vector3(6000, 0, 6000)
map.player.position.adjustToPlayerHeight()
map.player.withScript()
if (settings.mode === 'development') {
  map.player.script?.properties.push(new Speed(3))
}
map.hud.hide(HudElements.Minimap)

await map.i18n.addFromFile('./i18n.json', settings)

// ----------------------

const rootRune = new Rune('aam', { arxTutorialEnabled: false })
rootRune.script?.makeIntoRoot()

const lootRootEntities = [rootRune] as Entity[]

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

  createTerrain(islandWithTree),
]

const boundingBoxes = terrainItems.flatMap(({ meshes }) => meshes).map((mesh) => getGeometryBoundingBox(mesh.geometry))

const terrainBBox = boundingBoxes.reduce((acc, curr) => {
  acc.expandByPoint(curr.min)
  acc.expandByPoint(curr.max)
  return acc
}, new Box3())

// if (settings.mode === 'production') {
terrainItems.push(createColumns(500, terrainBBox, boundingBoxes))
// }
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

const tree = await createTree({
  position: islandWithTree.position?.clone(),
})
tree.forEach((mesh) => {
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

const gameStateManager = createGameStateManager(settings)
map.entities.push(gameStateManager)

const krahoz = new Entity({ src: 'items/quest_item/krahoz' })
krahoz.withScript()
krahoz.script?.on('inventoryuse', () => {
  return `
    play activate_scroll
    sendevent got_krahoz ${gameStateManager.ref} nop
    destroy self
    refuse
  `
})
map.entities.push(krahoz)

const zohark = new Entity({ src: 'items/quest_item/zohark' })
zohark.withScript()
zohark.script?.on('inventoryuse', () => {
  return `
    play activate_scroll
    sendevent got_zohark ${gameStateManager.ref} nop
    destroy self
    refuse
  `
})
map.entities.push(zohark)

const chest = new Entity({
  src: 'fix_inter/chest_metal',
  position: islandWithTree.position?.clone().add(new Vector3(70, 0, 70)),
  orientation: new Rotation(0, MathUtils.degToRad(40), 0),
})
chest.withScript()
chest.script?.on('init', () => {
  return `
    set §unlock 1
    inventory addfromscene ${krahoz.ref}
    inventory addfromscene ${zohark.ref}
  `
})
map.entities.push(chest)

// ----------------------

map.finalize()
await map.saveToDisk(settings)

console.log('done')
