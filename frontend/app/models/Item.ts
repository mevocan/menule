import { Model } from 'pinia-orm'

export default class Item extends Model {
  static override entity = 'items'

  static override fields() {
    return {
      id: this.number(null),
      category_id: this.number(null),
      name: this.string(''),
      description: this.string(null),
      price: this.number(null),
      image_url: this.string(null),
      uncertain: this.boolean(false),
      sort_order: this.number(0),
    }
  }

  declare id: number
  declare category_id: number
  declare name: string
  declare description: string | null
  declare price: number | null
  declare image_url: string | null
  declare uncertain: boolean
  declare sort_order: number
}
