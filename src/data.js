// Datos ficticios, definidos para tareas de evaluación. NO son minutas oficiales del Casino USM.
export const CAMPUS = ['San Joaquín', 'Vitacura'];
export const DEMO_START = '2026-11-02';
export const DATE_KEYS = Array.from({ length: 19 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 10, 2 + i));
  return date.toISOString().slice(0, 10);
}).filter(key => {
  const day = new Date(`${key}T12:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
});
export const WEEKS = [DATE_KEYS.slice(0, 5), DATE_KEYS.slice(5, 10), DATE_KEYS.slice(10, 15)];

export const DIETS = [
  { id: 'todos', label: 'Todos los menús' },
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'hipocalorico', label: 'Hipocalórico' },
  { id: 'sin-gluten', label: 'Sin gluten*' }
];

const main = [
  { name: 'Pollo al horno con arroz integral', detail: 'Pollo, arroz integral y ensalada chilena.', allergens: [] },
  { name: 'Charquicán de vacuno', detail: 'Carne de vacuno, zapallo, papas y verduras.', allergens: [] },
  { name: 'Pescado al horno con papas cocidas', detail: 'Merluza, papas, zanahoria y limón.', allergens: ['Pescado'] },
  { name: 'Lasaña de carne con ensalada', detail: 'Pasta, carne molida, tomate y queso.', allergens: ['Gluten', 'Lácteos'] },
  { name: 'Cazuela de ave', detail: 'Pollo, zapallo, choclo, papa y arroz.', allergens: [] },
  { name: 'Pastel de papas', detail: 'Carne, puré de papas y ensalada verde.', allergens: ['Lácteos'] },
  { name: 'Reineta con puré', detail: 'Pescado al horno, puré de papas y ensalada.', allergens: ['Pescado', 'Lácteos'] },
  { name: 'Arroz con pollo y verduras', detail: 'Pollo salteado, arroz y verduras.', allergens: [] },
];
const light = [
  { name: 'Pechuga a la plancha con verduras', detail: 'Pollo, zapallo italiano y ensalada mixta.', allergens: [] },
  { name: 'Ensalada tibia de pollo y quinoa', detail: 'Pollo, quinoa, zanahoria y hojas verdes.', allergens: [] },
  { name: 'Pescado al vapor con ensalada', detail: 'Pescado, brócoli y zanahoria.', allergens: ['Pescado'] },
  { name: 'Pavo al horno con vegetales', detail: 'Pavo, zapallo italiano y tomate.', allergens: [] },
  { name: 'Ensalada de pollo con legumbres', detail: 'Pollo, lentejas, pepino y lechuga.', allergens: [] },
  { name: 'Pollo al limón con brócoli', detail: 'Pollo al horno, brócoli y zanahoria.', allergens: [] },
];
const vegetarian = [
  { name: 'Guiso de lentejas con verduras', detail: 'Lentejas, zanahoria, tomate y zapallo.', allergens: [] },
  { name: 'Tortilla de espinacas con arroz', detail: 'Espinaca, huevos, arroz y ensalada.', allergens: ['Huevo'] },
  { name: 'Pasta con verduras asadas', detail: 'Fideos, berenjena, tomate y albahaca.', allergens: ['Gluten'] },
  { name: 'Quinoa con garbanzos', detail: 'Quinoa, garbanzos y verduras salteadas.', allergens: [] },
  { name: 'Hamburguesa de legumbres', detail: 'Porotos negros, ensalada y arroz.', allergens: [] },
  { name: 'Zapallitos italianos rellenos', detail: 'Zapallo italiano, champiñones, arroz y queso.', allergens: ['Lácteos'] },
];
export const TYPE_META = {
  general: { label: 'Tradicional', tint: 'blue', icon: '🍽️' },
  hipocalorico: { label: 'Hipocalórico', tint: 'amber', icon: '🥗' },
  vegetariano: { label: 'Vegetariano', tint: 'green', icon: '🌱' }
};

export function getMenus(date, campus) {
  const datePos = Math.max(0, DATE_KEYS.indexOf(date));
  const campusOffset = campus === 'Vitacura' ? 2 : 0;
  const types = [
    ['general', main[(datePos + campusOffset) % main.length]],
    ['hipocalorico', light[(datePos + campusOffset) % light.length]],
    ['vegetariano', vegetarian[(datePos + campusOffset) % vegetarian.length]],
  ];
  return types.map(([type, recipe]) => ({
    id: `${date}|${campus}|${type}`,
    date, campus, type, title: recipe.name, detail: recipe.detail,
    allergens: recipe.allergens,
    glutenInfo: !recipe.allergens.includes('Gluten'),
  }));
}
export function getMenuById(id) {
  if (!id || typeof id !== 'string') return null;
  const [date, campus] = id.split('|');
  return getMenus(date, campus).find(menu => menu.id === id) || null;
}
export function applyDiet(menus, diet) {
  if (diet === 'todos') return menus;
  if (diet === 'sin-gluten') return menus.filter(menu => menu.glutenInfo);
  return menus.filter(menu => menu.type === diet);
}
export function dateLabel(key, options = {}) {
  const date = new Date(`${key}T12:00:00Z`);
  return new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', ...options }).format(date);
}
export function shortDate(key) { return dateLabel(key, { weekday: 'short', day: 'numeric', month: 'short' }); }
export function longDate(key) { return dateLabel(key, { weekday: 'long', day: 'numeric', month: 'long' }); }
export const INITIAL_RESERVATIONS = [{
  id: 'RES-DEMO-001',
  menuId: `${DATE_KEYS[3]}|San Joaquín|general`,
  date: DATE_KEYS[3], campus: 'San Joaquín',
  createdAt: '2026-10-30T13:20:00',
}];
