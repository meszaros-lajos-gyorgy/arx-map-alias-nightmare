import { Entity, EntityConstructorPropsWithoutSrc, EntityModel, Texture } from 'arx-level-generator'
import { useDelay } from 'arx-level-generator/scripting/hooks'
import { Platform } from 'arx-level-generator/scripting/properties'
import { toArxCoordinateSystem } from 'arx-level-generator/tools/mesh'
import { MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'

// keep the platform size below 500x500
// and make sure to have smaller polygons than 100x100 (>width/100 and >height/100)
// otherwise you'll fall through at random points
// TODO: what is the biggest platform you can have where it is guaranteed that nothing falls through?
let geometry = new PlaneGeometry(400, 400, 5, 5)
geometry = toArxCoordinateSystem(geometry)
geometry.rotateX(MathUtils.degToRad(90))
const material = new MeshBasicMaterial({ map: Texture.l1DragonIceGround08 })
const mesh = new Mesh(geometry, material)

export class Test extends Entity {
  constructor({ ...props }: EntityConstructorPropsWithoutSrc = {}) {
    super({
      src: 'fix_inter/test',
      model: EntityModel.fromThreeJsObj(mesh, {
        filename: 'test.ftl',
      }),
      ...props,
    })

    this.withScript()

    this.script?.properties.push(Platform.on)

    this.script?.on('init', () => {
      const { loop } = useDelay()

      const moveLoop = loop(500, Infinity)

      return `
        setelevator on // this only works for the Y axis and if movement is done via an animation
        // TODO: is there a way to move the player with the platform?
        ${moveLoop} move 0 0 1
      `
    })
  }
}
