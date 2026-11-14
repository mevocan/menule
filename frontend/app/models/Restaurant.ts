import { Model } from 'pinia-orm'

export default class Restaurant extends Model {
  static override entity = 'restaurants'

  static override fields() {
    return {
      id: this.number(null),
      user_id: this.number(null),
      name: this.string(''),
      slug: this.string(''),
      theme: this.string(null),
      logo_url: this.string(null),
      published_at: this.string(null),
    }
  }

  declare id: number
  declare user_id: number
  declare name: string
  declare slug: string
  declare theme: string | null
  declare logo_url: string | null
  declare published_at: string | null
}
