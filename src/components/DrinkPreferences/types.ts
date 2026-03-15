export type WineChoice = 'white' | 'red' | 'sparkling' | 'rose' | 'skip'
export type BeerChoice = 'light_crisp' | 'belgian_blonde' | 'no_beer'
export type CocktailChoice = 'agave' | 'aperitivo' | 'classic_mixers' | 'whiskey' | 'beer_wine_only'
export type NonAlcoholicChoice = 'af_wine' | 'af_beer' | 'mocktails' | 'sparkling_water'

export type DrinkPreferencesData = {
  id: string
  firstName: string
  guestName: string
  submissionId?: string
  email: string
  wine: WineChoice[]
  beer: BeerChoice[]
  cocktail: CocktailChoice[]
  favoriteCocktail: string
  nonAlcoholic: NonAlcoholicChoice[]
  comments: string
  timestamp: number
}
