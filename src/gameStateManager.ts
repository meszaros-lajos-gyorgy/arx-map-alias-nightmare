import { Color, Entity, Settings } from 'arx-level-generator'
import { ScriptSubroutine } from 'arx-level-generator/scripting'
import { Sound, SoundFlags } from 'arx-level-generator/scripting/classes'
import { useDelay } from 'arx-level-generator/scripting/hooks'
import { Cinemascope, PlayerControls, PlayerInterface, Variable } from 'arx-level-generator/scripting/properties'

export const createGameStateManager = (settings: Settings) => {
  const manager = Entity.marker.withScript()

  if (settings.mode === 'production') {
    const readyHandler = new ScriptSubroutine(
      'ready',
      () => {
        return `
          ${Cinemascope.slideOut} ${PlayerInterface.on} ${PlayerControls.on}
        `
      },
      'goto',
    )

    manager.script?.subroutines.push(readyHandler)

    manager.script?.on('init', () => {
      const { delay } = useDelay()

      return `
        worldfade out 0 ${Color.black.toScriptColor()}
        ${Cinemascope.slideIn}
        ${PlayerControls.off}
        ${PlayerInterface.slideOut}
        ${delay(100)} speak -p [alia_nightmare2] ${readyHandler.invoke()}
        ${delay(2492)} worldfade in 700
      `
    })
  }

  manager.script?.on('init', () => {
    return `sendevent -g upside_down_tree hide nop`
  })

  const gotZohark = new Variable('bool', 'got_zohark', false)
  const gotKrahoz = new Variable('bool', 'got_krahoz', false)

  manager.script?.properties.push(gotZohark, gotKrahoz)

  const screamingSound = new Sound('dragon_hit', SoundFlags.EmitFromPlayer | SoundFlags.VaryPitch)
  const loudBangSound = new Sound('dwarf_crusher', SoundFlags.EmitFromPlayer | SoundFlags.VaryPitch)

  const checkForBothRings = new ScriptSubroutine(
    'check_for_both_rings',
    () => {
      const { delay } = useDelay()

      return `
        set §total_number_of_rings 0

        if (${gotZohark.name} == 1) {
          inc §total_number_of_rings 1
        }
        if (${gotKrahoz.name} == 1) {
          inc §total_number_of_rings 1
        }

        if (§total_number_of_rings < 2) {
          ${screamingSound.play()}
          ${loudBangSound.play()}
          quake 200 4000 1
          worldfade out 50 ${Color.white.toScriptColor()}
          ${delay(50)} sendevent -g upside_down_tree show nop
          ${delay(0)} worldfade in 500
          return
        }

        ${PlayerControls.off}
        ${PlayerInterface.slideOut}
        worldfade out 1000 ${Color.white.toScriptColor()}
        speak -p [iserbius_akbaa_die] endgame
      `
    },
    'gosub',
  )

  manager.script?.subroutines.push(checkForBothRings)

  manager.script?.on('got_zohark', () => {
    return `
      set ${gotZohark.name} 1
      ${checkForBothRings.invoke()}
    `
  })

  manager.script?.on('got_krahoz', () => {
    return `
      set ${gotKrahoz.name} 1
      ${checkForBothRings.invoke()}
    `
  })

  return manager
}
