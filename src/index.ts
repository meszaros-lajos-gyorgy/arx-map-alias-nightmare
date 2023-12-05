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
import { Interactivity, Scale, Shadow, Speed } from 'arx-level-generator/scripting/properties'
import { applyTransformations } from 'arx-level-generator/utils'
import { randomBetween, randomSort } from 'arx-level-generator/utils/random'
import { Box3, MathUtils, Mesh, Vector2 } from 'three'
import { getGeometryBoundingBox } from '@/functions.js'
import { bridgeBetween } from '@/prefabs/bridgeBetween.js'
import { createFallInducer } from '@/prefabs/createFallInducer.js'
import { createPillars } from '@/prefabs/createPillars.js'
import { createSpawnZone } from '@/prefabs/createSpawnZone.js'
import { createTerrain } from '@/prefabs/createTerrain.js'
import { TerrainItem } from '@/types.js'
import { islandWithTree, islands } from './data/islands.js'
import { Tree } from './entities/tree.js'
import { createGameStateManager } from './gameStateManager.js'
import { createBed } from './prefabs/createBed.js'

const settings = new Settings()

const map = new ArxMap()
map.config.offset = new Vector3(6000, 0, 6000)
map.player.position.adjustToPlayerHeight()
map.player.withScript()
if (settings.mode === 'development') {
  map.player.script?.properties.push(new Speed(3))
}
map.hud.hide(HudElements.Minimap)
map.hud.hide(HudElements.Healthbar)
map.hud.hide(HudElements.LevelUpIcon)
map.hud.hide(HudElements.StealthIndicator)
map.hud.hide(HudElements.StealingIcon)

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

terrainItems.push(createFallInducer(terrainBBox, islands[0].position as Vector3))

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

map.zones.push(createSpawnZone())

const meshes: Mesh[] = []

const pillars = createPillars(500, terrainBBox, boundingBoxes)

meshes.push(...pillars)

meshes.forEach((mesh) => {
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

const getSize = (size: number | Vector2) => {
  return typeof size === 'number' ? size : Math.min(size.x, size.y)
}

const rootTree = new Tree()
rootTree.script?.makeIntoRoot()
map.entities.push(rootTree)

islands.forEach(({ size, position }) => {
  const scale = getSize(size) / getSize(islandWithTree.size)
  const upsideDownTree = new Tree({
    position: position?.clone().add(new Vector3(0, 255 * scale, 0)),
    orientation: new Rotation(MathUtils.degToRad(180), MathUtils.degToRad(randomBetween(0, 360)), 0),
    scale,
  })
  upsideDownTree.script?.on('init', 'setgroup upside_down_tree')
  map.entities.push(upsideDownTree)
})

const gameStateManager = createGameStateManager(settings)
map.entities.push(gameStateManager)

// ------------------------

const tree = new Tree({
  position: islandWithTree.position?.clone().add(new Vector3(20 + 40, -155 * 1, 20 - 70)),
  scale: 1,
})
tree.script?.on('init', 'setgroup normal_tree')
map.entities.push(tree)

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

// ------------------------

const bed = await createBed(
  {
    position: map.config.offset
      .clone()
      .add(islands[0].position?.clone() ?? new Vector3(0, 0, 0))
      .add(new Vector3(100, 10, -100)),
  },
  settings,
)
map.polygons.push(...bed)

const pillow = new Entity({
  src: 'items/movable/cuscion',
  position: (islands[0].position?.clone() ?? new Vector3(0, 0, 0)).add(new Vector3(80, -50, -170)),
})
pillow.withScript()
pillow.script?.properties.push(Shadow.off)

const dresserLeft = new Entity({
  src: 'fix_inter/chest_dresser_chest',
  position: (islands[0].position?.clone() ?? new Vector3(0, 0, 0)).add(new Vector3(200, 10, -200)),
  orientation: new Rotation(0, MathUtils.degToRad(90), MathUtils.degToRad(10)),
  id: 100,
})
dresserLeft.withScript()
dresserLeft.script?.properties.push(Shadow.off)
const dresserRight = new Entity({
  src: 'fix_inter/chest_dresser_chest',
  position: (islands[0].position?.clone() ?? new Vector3(0, 0, 0)).add(new Vector3(-50, 5, -250)),
  orientation: new Rotation(0, MathUtils.degToRad(95), MathUtils.degToRad(-7)),
  id: 101,
})
dresserRight.withScript()
dresserRight.script?.properties.push(Shadow.off)

const candleOnLeftDrawer = new Entity({
  src: 'items/provisions/candle/candel.asl',
  position: (islands[0].position?.clone() ?? new Vector3(0, 0, 0)).add(new Vector3(220, -75, -180)),
  orientation: new Rotation(MathUtils.degToRad(-90), 0, 0),
})
candleOnLeftDrawer.withScript()
candleOnLeftDrawer.script?.properties.push(Interactivity.off, Shadow.off)

map.entities.push(pillow, dresserLeft, dresserRight, candleOnLeftDrawer)

// ----------------------

map.finalize()
await map.saveToDisk(settings)

console.log('done')
