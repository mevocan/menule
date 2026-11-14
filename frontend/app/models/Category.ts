import { Model } from 'pinia-orm'
import Item from './Item'

export default class Category extends Model {
  static override entity = 'categories'

  static override fields() {
    return {
      id: this.number(null),
      name: this.string(''),
      sort_order: this.number(0),
      items: this.hasMany(Item, 'category_id'),
    }
  }

  declare id: number
  declare name: string
  declare sort_order: number
  declare items: Item[]
}
