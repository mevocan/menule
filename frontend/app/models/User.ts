import { Model } from 'pinia-orm'
import Restaurant from './Restaurant'

export default class User extends Model {
  static override entity = 'users'

  static override fields() {
    return {
      id: this.number(null),
      name: this.string(''),
      email: this.string(''),
      restaurant: this.hasOne(Restaurant, 'user_id'),
    }
  }

  declare id: number
  declare name: string
  declare email: string
  declare restaurant: Restaurant | null
}
