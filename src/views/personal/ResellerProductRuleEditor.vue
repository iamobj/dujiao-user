<template>
  <div class="space-y-3">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div class="min-w-0">
        <div class="truncate text-sm font-bold theme-text-primary">{{ label }}</div>
        <div class="text-xs theme-text-muted">{{ t('personalCenter.reseller.productSettings.basePrice') }} {{ basePrice }}</div>
      </div>
      <label class="inline-flex items-center gap-2 text-sm theme-text-primary">
        <input
          :checked="modelValue.is_listed"
          type="checkbox"
          class="h-4 w-4 rounded border"
          @change="updateBoolean('is_listed', $event)"
        />
        {{ t('personalCenter.reseller.productSettings.listed') }}
      </label>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <label class="sr-only">{{ t('personalCenter.reseller.productSettings.pricingMode') }}</label>
      <select :value="modelValue.pricing_mode" class="form-input-lg" @change="updateString('pricing_mode', $event)">
        <option value="inherit">{{ t('personalCenter.reseller.productSettings.inherit') }}</option>
        <option value="markup_percent">{{ t('personalCenter.reseller.productSettings.markupPercent') }}</option>
        <option value="fixed_markup">{{ t('personalCenter.reseller.productSettings.fixedMarkup') }}</option>
        <option value="fixed_price">{{ t('personalCenter.reseller.productSettings.fixedPrice') }}</option>
      </select>
      <input
        :value="modelValue.markup_percent"
        type="text"
        inputmode="decimal"
        class="form-input-lg"
        :placeholder="t('personalCenter.reseller.productSettings.markupPercentField')"
        @input="updateString('markup_percent', $event)"
      />
      <input
        :value="modelValue.fixed_markup_amount"
        type="text"
        inputmode="decimal"
        class="form-input-lg"
        :placeholder="t('personalCenter.reseller.productSettings.fixedMarkupField')"
        @input="updateString('fixed_markup_amount', $event)"
      />
      <input
        :value="modelValue.fixed_price_amount"
        type="text"
        inputmode="decimal"
        class="form-input-lg"
        :placeholder="t('personalCenter.reseller.productSettings.fixedPriceField')"
        @input="updateString('fixed_price_amount', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ResellerProductSettingPayloadItem } from '../../api/types'

const props = defineProps<{
  label: string
  basePrice: string
  modelValue: ResellerProductSettingPayloadItem
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: ResellerProductSettingPayloadItem): void
}>()

const { t } = useI18n()

const updateValue = <K extends keyof ResellerProductSettingPayloadItem>(
  key: K,
  value: ResellerProductSettingPayloadItem[K],
) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

const eventTargetValue = (event: Event) => (event.target as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() || ''

const updateString = (
  key: 'pricing_mode' | 'markup_percent' | 'fixed_markup_amount' | 'fixed_price_amount',
  event: Event,
) => {
  updateValue(key, eventTargetValue(event))
}

const updateBoolean = (key: 'is_listed', event: Event) => {
  updateValue(key, Boolean((event.target as HTMLInputElement | null)?.checked))
}
</script>
