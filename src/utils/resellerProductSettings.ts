const RESELLER_PRICING_MODE_INHERIT = 'inherit'
const RESELLER_PRICING_MODE_MARKUP_PERCENT = 'markup_percent'
const RESELLER_PRICING_MODE_FIXED_MARKUP = 'fixed_markup'
const RESELLER_PRICING_MODE_FIXED_PRICE = 'fixed_price'

type ResellerProductSettingDataLike = {
  effective_price_amount?: string
}

type ResellerProductSettingPayloadItem = {
  sku_id: number
  is_listed: boolean
  pricing_mode: string
  markup_percent: string
  fixed_markup_amount: string
  fixed_price_amount: string
  sort_order: number
}

type ResellerProductSettingUpdatePayload = {
  settings: ResellerProductSettingPayloadItem[]
}

export type ResellerProductSettingFormItem = {
  sku_id: number
  is_listed?: boolean
  pricing_mode?: string
  markup_percent?: string
  fixed_markup_amount?: string
  fixed_price_amount?: string
  sort_order?: number
}

const moneyOrZero = (value?: string) => {
  const normalized = String(value || '').trim()
  return normalized || '0.00'
}

export const getResellerPricingModeLabelKey = (mode?: string) => {
  if (mode === RESELLER_PRICING_MODE_INHERIT) return 'inherit'
  if (mode === RESELLER_PRICING_MODE_MARKUP_PERCENT) return 'markupPercent'
  if (mode === RESELLER_PRICING_MODE_FIXED_MARKUP) return 'fixedMarkup'
  if (mode === RESELLER_PRICING_MODE_FIXED_PRICE) return 'fixedPrice'
  return 'unknown'
}

export const normalizeResellerProductSettingForm = (raw: ResellerProductSettingFormItem): Required<ResellerProductSettingFormItem> => ({
  sku_id: Number(raw.sku_id || 0),
  is_listed: raw.is_listed !== false,
  pricing_mode: raw.pricing_mode || RESELLER_PRICING_MODE_INHERIT,
  markup_percent: moneyOrZero(raw.markup_percent),
  fixed_markup_amount: moneyOrZero(raw.fixed_markup_amount),
  fixed_price_amount: moneyOrZero(raw.fixed_price_amount),
  sort_order: Number(raw.sort_order || 0),
})

export const buildResellerProductSettingPayload = (items: ResellerProductSettingFormItem[]): ResellerProductSettingUpdatePayload => ({
  settings: items.map((item): ResellerProductSettingPayloadItem => {
    const normalized = normalizeResellerProductSettingForm(item)
    return {
      sku_id: normalized.sku_id,
      is_listed: normalized.is_listed,
      pricing_mode: normalized.pricing_mode,
      markup_percent: moneyOrZero(normalized.markup_percent),
      fixed_markup_amount: moneyOrZero(normalized.fixed_markup_amount),
      fixed_price_amount: moneyOrZero(normalized.fixed_price_amount),
      sort_order: normalized.sort_order,
    }
  }),
})

export const summarizeEffectivePrice = (setting?: ResellerProductSettingDataLike | null) => {
  const value = String(setting?.effective_price_amount || '').trim()
  return value || '-'
}
