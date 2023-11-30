import { Entity, Light, Material, Rotation, Texture, Vector3 } from 'arx-level-generator'
import { createBox, createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { createLight } from 'arx-level-generator/tools'
import { connectEdgeTo, makeBumpy, scaleUV, transformEdge } from 'arx-level-generator/tools/mesh'
import { randomBetween } from 'arx-level-generator/utils/random'
import { Mesh, Vector2 } from 'three'
import { MathUtils } from 'three/src/math/MathUtils.js'
import { MAIN_COLOR } from '@/config.js'
import { TerrainItem, createTerrainProps } from '@/types.js'

export const createTerrain = ({
  size,
  position = new Vector3(0, 0, 0),
  angleY = 0,
  orientation,
  hasBumps = true,
  hasLight = true,
  texture = Texture.stoneHumanAkbaa2F,
  type,
  loot = [],
  lightIntensity = 1,
  lightOffset = new Vector3(0, 0, 0),
}: createTerrainProps): TerrainItem => {
  const meshes: Mesh[] = []
  const lights: Light[] = []
  const entities: Entity[] = []

  const s = typeof size === 'number' ? new Vector2(size, size) : size

  if (type === 'island') {
    const islandTop = createPlaneMesh({ size, texture })
    if (hasBumps) {
      transformEdge(new Vector3(0, 15, 0), islandTop)
      makeBumpy(5, 60, true, islandTop.geometry)
    }

    if (typeof orientation !== 'undefined') {
      islandTop.geometry.rotateX(orientation.x)
      islandTop.geometry.rotateY(orientation.y)
      islandTop.geometry.rotateZ(orientation.z)
    } else {
      islandTop.geometry.rotateY(MathUtils.degToRad(angleY))
    }

    islandTop.geometry.translate(position.x, position.y, position.z)

    // ---------------

    const islandBottom = createPlaneMesh({ size, texture })
    if (hasBumps) {
      makeBumpy([0, -100], 10, true, islandBottom.geometry)
      makeBumpy([0, -60], 40, true, islandBottom.geometry)
      makeBumpy([0, -20], 60, true, islandBottom.geometry)
    }

    if (typeof orientation !== 'undefined') {
      // TODO: rotation needs to be reversed as the island bottom is flipped upside down
      islandBottom.geometry.rotateX(orientation.x)
      islandBottom.geometry.rotateY(orientation.y)
      islandBottom.geometry.rotateZ(orientation.z)
    } else {
      islandBottom.geometry.rotateY(MathUtils.degToRad(-angleY))
    }

    // rotate it upside down
    islandBottom.geometry.rotateX(MathUtils.degToRad(180))

    islandBottom.geometry.translate(position.x, position.y + 85, position.z)

    // -------------------------------

    connectEdgeTo(islandBottom.geometry, islandTop.geometry)

    meshes.push(islandTop, islandBottom)
  } else {
    // TODO: rotate face textures
    // https://stackoverflow.com/a/50859810/1806628
    const bridge = createBox({
      position: new Vector3(0, 0, 0),
      size: new Vector3(s.x, 10, s.y),
      materials: texture instanceof Texture ? Material.fromTexture(texture) : texture,
    })

    scaleUV(new Vector2(s.x / 100, s.y / 100), bridge.geometry)

    if (typeof orientation !== 'undefined') {
      const { x, y, z } = orientation.reorder('XYZ')

      bridge.geometry.rotateX(x)
      bridge.geometry.rotateY(y)
      bridge.geometry.rotateZ(z)
    } else {
      bridge.geometry.rotateY(MathUtils.degToRad(angleY))
    }

    bridge.geometry.translate(position.x, position.y, position.z)
    meshes.push(bridge)
  }

  if (hasLight) {
    const radius = Math.max(s.x, s.y) * 1.6
    const light = createLight({
      position: position
        .clone()
        .add(new Vector3(0, -radius / 2, 0))
        .add(lightOffset),
      radius: radius,
      intensity: lightIntensity,
      color: MAIN_COLOR.clone().lighten(30),
    })
    lights.push(light)
  }

  loot.forEach((entity) => {
    const lateralOffset = new Vector3(randomBetween(-s.x / 4, s.x / 4), 0, randomBetween(-s.y / 4, s.y / 4))
    entity.position = position.clone().add(lateralOffset)
    entity.orientation = new Rotation(0, MathUtils.degToRad(randomBetween(0, 360)), 0)
    entities.push(entity)
  })

  return {
    meshes,
    lights,
    entities,
    zones: [],
  }
}
