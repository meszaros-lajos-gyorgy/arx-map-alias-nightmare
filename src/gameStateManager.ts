import { Color, Entity, Settings } from 'arx-level-generator'
import { ScriptSubroutine } from 'arx-level-generator/scripting'
import { useDelay } from 'arx-level-generator/scripting/hooks'
import { Cinemascope, PlayerControls, PlayerInterface } from 'arx-level-generator/scripting/properties'

export const createGameStateManager = (settings: Settings) => {
  const manager = Entity.marker.withScript()

  if (settings.mode === 'production') {
    const readyHandler = new ScriptSubroutine(
      'ready',
      () => {
        return `
          ${PlayerControls.on}
          ${PlayerInterface.on}
          ${Cinemascope.off}
        `
      },
      'goto',
    )

    manager.script?.subroutines.push(readyHandler)

    manager.script?.on('init', () => {
      const { delay } = useDelay()

      return `
        worldfade out 0 ${Color.black.toScriptColor()}
        ${Cinemascope.on}
        ${PlayerControls.off}
        ${PlayerInterface.slideOut}
        ${delay(100)} worldfade in 1000
        ${delay(0)} speak -p [alia_nightmare2] ${readyHandler.invoke()}
      `
    })
  }

  return manager
}
