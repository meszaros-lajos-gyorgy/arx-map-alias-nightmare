import { Color, Entity, Settings } from 'arx-level-generator'
import { useDelay } from 'arx-level-generator/scripting/hooks'
import { PlayerControls, PlayerInterface } from 'arx-level-generator/scripting/properties'

export const createGameStateManager = (settings: Settings) => {
  const manager = Entity.marker.withScript()

  if (settings.mode === 'production') {
    manager.script?.on('init', () => {
      const { delay } = useDelay()

      return `
        worldfade out 0 ${Color.black.toScriptColor()}
        ${PlayerControls.off}
        ${PlayerInterface.slideOut}
        ${delay(100)} speak -p [alia_nightmare2] ${PlayerControls.on} ${PlayerInterface.on}
        ${delay(2400)} worldfade in 1000
      `
    })
  }

  return manager
}
