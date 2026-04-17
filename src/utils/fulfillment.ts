type TranslateFn = (key: string, params?: Record<string, any>) => string

export type FulfillmentLabelScope = 'orderDetail'

export const fulfillmentTypeLabel = (t: TranslateFn, type?: string, scope: FulfillmentLabelScope = 'orderDetail', displayAsAuto = false) => {
  if (!type) return '-'
  const baseKey = `${scope}.fulfillmentTypes`
  const map: Record<string, string> = {
    manual: t(`${baseKey}.manual`),
    auto: t(`${baseKey}.auto`),
    upstream: t(`${baseKey}.manual`),
  }
  const resolvedType = displayAsAuto ? 'auto' : type
  return map[resolvedType] || resolvedType
}

export const fulfillmentStatusLabel = (t: TranslateFn, status?: string, scope: FulfillmentLabelScope = 'orderDetail') => {
  if (!status) return '-'
  const baseKey = `${scope}.fulfillmentStatuses`
  const map: Record<string, string> = {
    pending: t(`${baseKey}.pending`),
    delivered: t(`${baseKey}.delivered`),
  }
  return map[status] || status
}
