// Lexical map from category-name keywords to a leading emoji.
// Matches whole words in either language (PT/EN). First keyword hit wins,
// so more specific terms must come before generic ones.

type Rule = { emoji: string; keywords: string[] }

const RULES: Rule[] = [
  { emoji: '🍕', keywords: ['pizza', 'pizzaria'] },
  { emoji: '🍔', keywords: ['burger', 'hamburger', 'hambúrguer', 'hamburgueria'] },
  { emoji: '🌮', keywords: ['taco', 'tacos', 'taqueria', 'mexicano', 'mexican'] },
  { emoji: '🌯', keywords: ['burrito', 'wrap'] },
  { emoji: '🍣', keywords: ['sushi', 'sashimi', 'temaki', 'japonês', 'japones', 'japanese'] },
  { emoji: '🍜', keywords: ['ramen', 'noodle', 'noodles', 'lamen', 'macarrão', 'macarrao', 'pasta'] },
  { emoji: '🥟', keywords: ['dumpling', 'gyoza', 'dim sum', 'dimsum'] },
  { emoji: '🥘', keywords: ['paella', 'wok', 'panela'] },
  { emoji: '🍛', keywords: ['curry', 'caril', 'indiano', 'indian', 'tailandês', 'tailandes', 'thai'] },
  { emoji: '🥗', keywords: ['salad', 'salada', 'veg', 'vegetariano', 'vegetarian', 'vegan', 'vegano'] },
  { emoji: '🥩', keywords: ['steak', 'churrasco', 'churrascaria', 'bbq', 'barbecue', 'grelhado', 'grill', 'carne'] },
  { emoji: '🍗', keywords: ['frango', 'chicken', 'galeto'] },
  { emoji: '🥪', keywords: ['sandwich', 'sanduíche', 'sanduiche', 'sub', 'sub-sandwich'] },
  { emoji: '🌭', keywords: ['hotdog', 'hot dog', 'cachorro-quente', 'cachorro quente'] },
  { emoji: '🍟', keywords: ['fries', 'batata', 'batatas'] },
  { emoji: '🥞', keywords: ['pancake', 'panqueca', 'crepe'] },
  { emoji: '🥐', keywords: ['bakery', 'padaria', 'boulangerie', 'croissant', 'pão', 'pao', 'bread'] },
  { emoji: '🍰', keywords: ['cake', 'bolo', 'confeitaria', 'patisserie', 'pastry', 'sobremesa', 'dessert', 'doceria', 'doce', 'sweets'] },
  { emoji: '🍩', keywords: ['donut', 'doughnut', 'rosquinha'] },
  { emoji: '🍦', keywords: ['ice cream', 'icecream', 'sorvete', 'sorveteria', 'gelato'] },
  { emoji: '☕', keywords: ['coffee', 'café', 'cafe', 'cafeteria', 'cafeteira'] },
  { emoji: '🧉', keywords: ['mate', 'tereré', 'terere'] },
  { emoji: '🍺', keywords: ['bar', 'pub', 'cerveja', 'cervejaria', 'beer', 'brewery', 'boteco', 'botequim'] },
  { emoji: '🍷', keywords: ['wine', 'vinho', 'vinícola', 'vinicola', 'enoteca'] },
  { emoji: '🍹', keywords: ['drink', 'drinks', 'cocktail', 'coquetel'] },
  { emoji: '🐟', keywords: ['fish', 'peixe', 'peixaria', 'seafood', 'frutos do mar'] },
  { emoji: '🦐', keywords: ['shrimp', 'camarão', 'camarao'] },
  { emoji: '🍤', keywords: ['tempura', 'fritura'] },
  { emoji: '🇮🇹', keywords: ['italiano', 'italian', 'italiana', 'itália', 'italia'] },
  { emoji: '🇫🇷', keywords: ['francês', 'frances', 'french', 'bistro', 'bistrô'] },
  { emoji: '🇧🇷', keywords: ['brasileiro', 'brasileira', 'brazilian', 'brasil'] },
  { emoji: '🥯', keywords: ['brunch', 'breakfast', 'café da manhã', 'cafe da manha'] },
  { emoji: '🍽️', keywords: ['restaurant', 'restaurante', 'bistro', 'bistrô', 'lanchonete'] },
]

const DEFAULT_EMOJI = '🍽️'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function categoryEmoji(name: string): string {
  const hay = ' ' + normalize(name) + ' '
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      const needle = ' ' + normalize(kw) + ' '
      if (hay.includes(needle)) return rule.emoji
      // also match as substring for hyphen/joined forms
      if (hay.includes(normalize(kw))) return rule.emoji
    }
  }
  return DEFAULT_EMOJI
}
