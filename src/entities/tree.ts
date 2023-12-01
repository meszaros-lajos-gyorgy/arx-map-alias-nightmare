import { Expand } from 'arx-convert/utils'
import { Entity, EntityConstructorPropsWithoutSrc, EntityModel } from 'arx-level-generator'
import { Collision, Interactivity, Material, Scale, Shadow, StackSize } from 'arx-level-generator/scripting/properties'
import { createTree } from '@/prefabs/createTree.js'

type TreeConstructorProps = Expand<
  EntityConstructorPropsWithoutSrc & {
    /**
     * default value is 1
     */
    scale?: number
  }
>

export const treeMesh = await createTree()

export class Tree extends Entity {
  constructor({ scale = 1, ...props }: TreeConstructorProps = {}) {
    super({
      src: 'fix_inter/tree',
      model: EntityModel.fromThreeJsObj(treeMesh[0], {
        filename: 'tree.ftl',
        originIdx: 1,
      }),
      ...props,
    })

    this.withScript()

    this.script?.on('init', () => {
      if (!this.script?.isRoot) {
        return `
          ${new Scale(scale)}
        `
      }

      return ''
    })

    this.script
      ?.whenRoot()
      .on('init', () => [Shadow.off, Material.wood, Interactivity.off, Collision.off, 'setgroup tree'])
      .on('show', () => `objecthide self no`)
      .on('hide', () => `objecthide self yes`)
  }
}
