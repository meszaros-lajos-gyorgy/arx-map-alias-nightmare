import { Ambience, Vector3 } from 'arx-level-generator'
import { createZone } from 'arx-level-generator/tools'
import { MAIN_AMBIENCE, MAIN_COLOR } from '@/config.js'

export const createSpawnZone = (position: Vector3 = new Vector3(0, 0, 0)) => {
  return createZone({
    name: 'spawn',
    position,
    drawDistance: 4000,
    backgroundColor: MAIN_COLOR.clone(),
    ambience: Ambience.fromAudio('main-ambiance', MAIN_AMBIENCE),
  })
}
