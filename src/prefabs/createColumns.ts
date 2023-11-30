import { Texture, Vector3 } from 'arx-level-generator'
import { scaleUV, toArxCoordinateSystem } from 'arx-level-generator/tools/mesh'
import { any } from 'arx-level-generator/utils/faux-ramda'
import { randomBetween } from 'arx-level-generator/utils/random'
import { Box3, CylinderGeometry, Mesh, MeshBasicMaterial, Vector2 } from 'three'
import { TerrainItem } from '@/types.js'

export const createColumns = (numberOfColumns: number, terrainBBox: Box3, boundingBoxes: Box3[]): TerrainItem => {
  const terrainSize = terrainBBox.max.clone().sub(terrainBBox.min)
  const terrainCenter = terrainBBox.min.clone().add(terrainSize.clone().divideScalar(2))
  const margin = 1500

  const columnSize = new Vector2(5, 5000)

  const columns: Mesh[] = []

  for (let i = 0; i < numberOfColumns; i++) {
    let pos: Vector3
    let columnBBox: Box3

    do {
      pos = new Vector3(
        randomBetween(terrainBBox.min.x - margin, terrainBBox.max.x + margin),
        terrainCenter.y,
        randomBetween(terrainBBox.min.z - margin, terrainBBox.max.z + margin),
      )
      columnBBox = new Box3(
        new Vector3(pos.x - columnSize.x / 2, pos.y - columnSize.y / 2, pos.z - columnSize.x / 2),
        new Vector3(pos.x + columnSize.x / 2, pos.y + columnSize.y / 2, pos.z + columnSize.x / 2),
      )
    } while (any((bbox) => bbox.intersectsBox(columnBBox), boundingBoxes))

    let geometry = new CylinderGeometry(columnSize.x, columnSize.x, columnSize.y, 3, 4)
    geometry = toArxCoordinateSystem(geometry)

    scaleUV(new Vector2(columnSize.x / 100, columnSize.y / 100), geometry)

    const material = new MeshBasicMaterial({ map: Texture.stoneHumanAkbaa4F })
    const column = new Mesh(geometry, material)

    column.geometry.translate(pos.x, pos.y, pos.z)

    columns.push(column)
  }

  return {
    meshes: columns,
    entities: [],
    lights: [],
    zones: [],
  }
}
