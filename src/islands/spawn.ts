import { Entity, Polygons, Rotation, Settings, Vector3 } from 'arx-level-generator'
import { Interactivity, Shadow } from 'arx-level-generator/scripting/properties'
import { MathUtils } from 'three'
import { createBed } from '@/prefabs/createBed.js'
import { TerrainItem } from '@/types.js'

export const populateSpawn = async (
  position: Vector3 = new Vector3(0, 0, 0),
  gameStateManager: Entity,
  settings: Settings,
): Promise<TerrainItem> => {
  const bedPosition = position.clone().add(new Vector3(260, 10, -100))
  const dresserLeftPosition = position?.clone().add(new Vector3(160, 10, 390))
  const dresserRightPosition = position?.clone().add(new Vector3(-350, 5, -120))

  let bed: Polygons

  if (settings.mode === 'production') {
    bed = await createBed({ position: bedPosition }, settings)
  } else {
    bed = new Polygons()
  }

  const pillow = new Entity({
    src: 'items/movable/cuscion',
    position: bedPosition.clone().add(new Vector3(-20, -60, -70)),
  })
  pillow.withScript()

  const dresserLeft = new Entity({
    src: 'fix_inter/chest_dresser_chest',
    position: dresserLeftPosition,
    orientation: new Rotation(MathUtils.degToRad(-5), MathUtils.degToRad(23), MathUtils.degToRad(2)),
    id: 100,
  })
  dresserLeft.withScript()
  dresserLeft.script?.properties.push(Interactivity.off)

  const dresserRight = new Entity({
    src: 'fix_inter/chest_dresser_chest',
    position: dresserRightPosition,
    orientation: new Rotation(0, MathUtils.degToRad(-6), MathUtils.degToRad(-7)),
    id: 101,
  })
  dresserRight.withScript()
  dresserRight.script?.properties.push(Interactivity.off)

  const candleOnLeftDrawer = new Entity({
    src: 'items/provisions/candle/candel.asl',
    position: dresserLeftPosition.clone().add(new Vector3(23, -85, -6)),
    orientation: new Rotation(0, MathUtils.degToRad(-63), 0),
  })
  candleOnLeftDrawer.withScript()
  candleOnLeftDrawer.script?.properties.push(Interactivity.off)

  return {
    entities: [pillow, dresserLeft, dresserRight, candleOnLeftDrawer],
    lights: [],
    meshes: [],
    zones: [],
    polygons: [bed],
  }
}
