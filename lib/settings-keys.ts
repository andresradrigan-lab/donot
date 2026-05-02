/**
 * Whitelist de claves editables desde /admin/config y su metadata.
 *
 * Las claves de operación crítica viven en .env (DATABASE_URL, JWT_SECRET,
 * MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, RESEND_API_KEY, CLOUDINARY_URL):
 * cambiarlas mal rompe el sistema y son infra del servidor.
 *
 * Las claves del negocio (SEO, GTM/GA4/Meta, datos de contacto, umbrales)
 * SÍ se editan acá para que Fernanda pueda conectar nuevas plataformas
 * sin tocar .env ni redeploy.
 */

export type SettingType = 'string' | 'number' | 'multiline' | 'url' | 'secret'

export type SettingGroup = 'seo' | 'analitica' | 'negocio' | 'envio' | 'pedidos' | 'puntos-retiro'

export interface SettingDef {
  key: string
  label: string
  type: SettingType
  hint?: string
  group: SettingGroup
  /** Las claves "secret" no se devuelven en GET; solo se actualizan si llega
   *  un valor no vacío en PATCH. */
  secret?: boolean
  /** Las claves marcadas como "publicas" pueden leerse desde Server
   *  Components sin auth (ej. SEO meta tags, GTM ID). */
  publicForLayout?: boolean
}

export const SETTING_DEFS: SettingDef[] = [
  // ===== SEO =====
  {
    key: 'seo_site_title',
    label: 'Título del sitio',
    type: 'string',
    hint: 'Aparece en buscadores y al compartir el link.',
    group: 'seo',
    publicForLayout: true,
  },
  {
    key: 'seo_site_description',
    label: 'Descripción para buscadores',
    type: 'multiline',
    hint: '160 caracteres recomendado. La ven en Google y al compartir.',
    group: 'seo',
    publicForLayout: true,
  },
  {
    key: 'seo_keywords',
    label: 'Palabras clave (separadas por coma)',
    type: 'string',
    hint: 'Opcional. Ej: donas, donut, concón, reñaca.',
    group: 'seo',
    publicForLayout: true,
  },
  {
    key: 'seo_og_image',
    label: 'Imagen al compartir (1200×630)',
    type: 'url',
    hint: 'URL absoluta o /uploads/...',
    group: 'seo',
    publicForLayout: true,
  },

  // ===== Analítica / Plataformas =====
  {
    key: 'analytics_gtm_id',
    label: 'Google Tag Manager (GTM-XXXXXX)',
    type: 'string',
    hint: 'Contenedor único. Carga GA4, Pixel, etc.',
    group: 'analitica',
    publicForLayout: true,
  },
  {
    key: 'analytics_ga4_id',
    label: 'GA4 Measurement ID (G-XXXXXX)',
    type: 'string',
    hint: 'Solo si NO usas GTM directamente.',
    group: 'analitica',
    publicForLayout: true,
  },
  {
    key: 'analytics_meta_pixel_id',
    label: 'Meta Pixel ID',
    type: 'string',
    hint: 'Carga el pixel del browser (Facebook/Instagram Ads).',
    group: 'analitica',
    publicForLayout: true,
  },
  {
    key: 'analytics_meta_capi_token',
    label: 'Meta Conversions API Token',
    type: 'secret',
    hint: 'Token server-side. No se muestra completo después de guardar.',
    group: 'analitica',
    secret: true,
  },
  {
    key: 'analytics_search_console_verification',
    label: 'Google Search Console (meta verification)',
    type: 'string',
    hint: 'Solo el valor del meta tag, no el HTML completo.',
    group: 'analitica',
    publicForLayout: true,
  },

  // ===== Negocio (datos del local) =====
  {
    key: 'business_name',
    label: 'Razón social / nombre comercial',
    type: 'string',
    group: 'negocio',
    publicForLayout: true,
  },
  {
    key: 'business_phone',
    label: 'Teléfono público',
    type: 'string',
    group: 'negocio',
    publicForLayout: true,
  },
  {
    key: 'business_address',
    label: 'Dirección del local',
    type: 'multiline',
    hint: 'Aparece en Schema.org LocalBusiness para SEO local.',
    group: 'negocio',
    publicForLayout: true,
  },
  {
    key: 'business_lat',
    label: 'Latitud (Google Maps)',
    type: 'string',
    hint: 'Opcional. Mejora el SEO local.',
    group: 'negocio',
    publicForLayout: true,
  },
  {
    key: 'business_lng',
    label: 'Longitud (Google Maps)',
    type: 'string',
    group: 'negocio',
    publicForLayout: true,
  },

  // ===== Envío =====
  {
    key: 'free_shipping_threshold_clp',
    label: 'Subtotal para envío gratis (CLP)',
    type: 'number',
    hint: 'Sobre este monto el envío sale por la casa.',
    group: 'envio',
  },
  {
    key: 'free_shipping_min_boxes',
    label: 'Mínimo de cajas para envío gratis',
    type: 'number',
    group: 'envio',
  },

  // ===== Pedidos =====
  {
    key: 'order_number_prefix',
    label: 'Prefijo de número de pedido',
    type: 'string',
    hint: 'Ej: DN. Genera "DN-2026-0042".',
    group: 'pedidos',
  },

  // ===== Puntos de retiro =====
  {
    key: 'pickup_address_concon',
    label: 'Dirección retiro Concón',
    type: 'multiline',
    group: 'puntos-retiro',
  },
  {
    key: 'pickup_address_renaca',
    label: 'Dirección retiro Reñaca',
    type: 'multiline',
    group: 'puntos-retiro',
  },

  // ===== Contacto público =====
  {
    key: 'contact_email',
    label: 'Email público',
    type: 'string',
    hint: 'Footer y formulario de contacto.',
    group: 'negocio',
    publicForLayout: true,
  },
  {
    key: 'contact_instagram',
    label: 'Instagram (@handle)',
    type: 'string',
    group: 'negocio',
    publicForLayout: true,
  },
]

export const GROUP_LABELS: Record<SettingGroup, string> = {
  seo: 'SEO',
  analitica: 'Analítica y plataformas',
  negocio: 'Datos del negocio',
  envio: 'Envío',
  pedidos: 'Pedidos',
  'puntos-retiro': 'Puntos de retiro',
}

export const SETTING_KEYS: Set<string> = new Set(SETTING_DEFS.map((s) => s.key))

export const PUBLIC_LAYOUT_KEYS: Set<string> = new Set(
  SETTING_DEFS.filter((s) => s.publicForLayout).map((s) => s.key),
)

export const SECRET_KEYS: Set<string> = new Set(
  SETTING_DEFS.filter((s) => s.secret).map((s) => s.key),
)

export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 6) return '•'.repeat(value.length)
  return `${'•'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`
}
