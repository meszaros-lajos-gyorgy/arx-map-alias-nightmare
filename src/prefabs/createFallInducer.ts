import { Entity, Texture, Vector3 } from 'arx-level-generator'
import { createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { ScriptSubroutine } from 'arx-level-generator/scripting'
import { Sound, SoundFlags } from 'arx-level-generator/scripting/classes'
import { ControlZone, Variable } from 'arx-level-generator/scripting/properties'
import { createZone } from 'arx-level-generator/tools'
import { Box3, Vector2 } from 'three'
import { MAIN_COLOR } from '@/config.js'
import { uruLink } from '@/sounds.js'
import { TerrainItem } from '@/types.js'

export const createFallInducer = (terrainBBox: Box3, fallbackToThisPoint: Vector3): TerrainItem => {
  const terrainSize = terrainBBox.max.clone().sub(terrainBBox.min.clone())
  const terrainCenter = terrainBBox.min.clone().add(terrainSize.clone().divideScalar(2))
  const terrainBottomCenter = new Vector3(terrainCenter.x, terrainBBox.max.y, terrainCenter.z)

  const margin = 1000
  const planeDepth = 8000
  const fallDetectorDepth = 1000

  const planeSize = new Vector2(terrainSize.x + margin * 2, terrainSize.z + margin * 2)

  const plane = createPlaneMesh({ size: planeSize, texture: Texture.alpha })
  plane.geometry.translate(terrainBottomCenter.x, terrainBottomCenter.y + planeDepth, terrainBottomCenter.z)

  // ------------------

  const fallDetector = createZone({
    name: 'fall-detector',
    size: new Vector3(planeSize.x, 300, planeSize.y),
    position: new Vector3(terrainCenter.x, -terrainBBox.max.y - fallDetectorDepth, terrainCenter.z),
  })

  // ------------------

  const fallbackPoint = Entity.marker
  fallbackPoint.position = fallbackToThisPoint.clone()

  const uruLinkPlayer = new Sound(uruLink.filename, SoundFlags.EmitFromPlayer)

  const fallSaver = Entity.marker.withScript()
  const isPlayerBeingSaved = new Variable('bool', 'isPlayerBeingSaved', false)
  fallSaver.script?.properties.push(new ControlZone(fallDetector), isPlayerBeingSaved)
  fallSaver.otherDependencies.push(uruLink)

  const fadeOut = new ScriptSubroutine('fadeout', () => {
    return `
      worldfade out 300 ${MAIN_COLOR.clone().darken(50).toScriptColor()}
      ${uruLinkPlayer.play()}
    `
  })
  const fadeIn = new ScriptSubroutine('fadein', () => {
    return `
      teleport -p ${fallbackPoint.ref}
      set ${isPlayerBeingSaved.name} 0
      TIMERfadein -m 1 2000 worldfade in 1000
    `
  })

  fallSaver.script?.on('controlledzone_enter', () => {
    return `
      if (${isPlayerBeingSaved.name} == 1) {
        accept
      }
      set ${isPlayerBeingSaved.name} 1
      ${fadeOut.invoke()}
      TIMERfadein -m 1 300 ${fadeIn.invoke()} nop
    `
  })

  fallSaver.script?.subroutines.push(fadeOut, fadeIn)

  // ------------------

  return {
    meshes: [plane],
    entities: [fallSaver, fallbackPoint],
    lights: [],
    zones: [fallDetector],
  }
}
