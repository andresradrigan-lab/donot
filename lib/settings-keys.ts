/**
 * Whitelist de claves editables desde /admin/config y su metadata.
 * Las claves sensibles (MP, Webpay, Khipu, Resend, Cloudinary, GA4, Pixel,
 * CAPI, JWT) viven en .env y NUNCA en BD para minimizar superficie de
 * leak.
 */

export type SettingType = 'string' | 'number' | 'multiline'

export interface SettingDef {
  key: string
  label: string
  type: SettingType
  hint?: string
  group: 'envio' | 'contacto' | 'pedidos' | 'puntos-retiro'
}

export const SETTING_DEFS: SettingDef[] = [
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
    hint: 'Sobre esta cantidad de cajas el envío sale por la casa.',
    group: 'envio',
  },
  {
    key: 'order_number_prefix',
    label: 'Prefijo de número de pedido',
    type: 'string',
    hint: 'Ej: DN. Genera "DN-2026-0042".',
    group: 'pedidos',
  },
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
  {
    key: 'contact_email',
    label: 'Email público',
    type: 'string',
    hint: 'Se muestra en footer y formulario de contacto.',
    group: 'contacto',
  },
  {
    key: 'contact_instagram',
    label: 'Instagram (@handle)',
    type: 'string',
    group: 'contacto',
  },
]

export const GROUP_LABELS: Record<SettingDef['group'], string> = {
  envio: 'Envío',
  contacto: 'Contacto',
  pedidos: 'Pedidos',
  'puntos-retiro': 'Puntos de retiro',
}

export const SETTING_KEYS: Set<string> = new Set(SETTING_DEFS.map((s) => s.key))
