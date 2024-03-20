import { Entity, EntityConstructorPropsWithoutSrc, EntityModel, Texture, Vector3 } from 'arx-level-generator'
import { toArxCoordinateSystem } from 'arx-level-generator/tools/mesh'
import { Mesh, MeshBasicMaterial, TorusGeometry } from 'three'

let geometry = new TorusGeometry(10, 3, 16, 100)
geometry = toArxCoordinateSystem(geometry)
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
  }
}
