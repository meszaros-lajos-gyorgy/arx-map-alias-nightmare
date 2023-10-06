import { Entity, Light, Rotation, TextureOrMaterial, Vector3, Zone } from 'arx-level-generator'
import { Mesh, Vector2 } from 'three'

export type createTerrainProps = {
  size: Vector2 | number
  /**
   * default value is new Vector(0, 0, 0)
   */
  position?: Vector3
  /**
   * rotation on the Y axis in degrees
   *
   * default value is 0
   */
  angleY?: number
  /**
   * used internally by createBridge()
   *
   * when specified angleY gets ignored
   */
  orientation?: Rotation
  /**
   * default value is true
   */
  hasBumps?: boolean
  /**
   * default value is true
   */
  hasLight?: boolean
  texture?: TextureOrMaterial
  type: 'island' | 'bridge'
  /**
   * default value is empty array (no loot)
   */
  loot?: Entity[]
}

export type TerrainItem = {
  meshes: Mesh[]
  lights: Light[]
  entities: Entity[]
  zones: Zone[]
}
