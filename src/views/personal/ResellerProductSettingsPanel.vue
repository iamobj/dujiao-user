<template>
  <div class="theme-personal-card">
    <div v-if="panelAlert" class="mb-5 rounded-xl border px-4 py-3 text-sm shadow-sm" :class="pageAlertClass(panelAlert.level)">
      {{ panelAlert.message }}
    </div>

    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-xl font-bold theme-text-primary">{{ t('personalCenter.reseller.productSettings.title') }}</h2>
        <p class="mt-1 text-sm theme-text-muted">{{ t('personalCenter.reseller.productSettings.subtitle') }}</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border theme-btn-secondary px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
        @click="loadRows"
      >
        {{ t('orders.filters.refresh') }}
      </button>
    </div>

    <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
      <input
        v-model.trim="filters.keyword"
        type="text"
        class="form-input-lg"
        :placeholder="t('personalCenter.reseller.productSettings.searchPlaceholder')"
        @keyup.enter="loadRows"
      />
      <button
        type="button"
        class="theme-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
        @click="loadRows"
      >
        {{ t('orders.filters.search') }}
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="idx in 3" :key="idx" class="h-20 animate-pulse rounded-xl border theme-surface-muted"></div>
    </div>

    <div v-else-if="rows.length === 0" class="rounded-xl border border-dashed theme-surface-soft px-4 py-8 text-sm theme-text-muted">
      {{ t('personalCenter.reseller.productSettings.empty') }}
    </div>

    <div v-else class="space-y-3">
      <div v-for="row in rows" :key="row.product.id" class="rounded-xl border theme-surface-soft p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0">
            <div class="truncate font-bold theme-text-primary">{{ getProductTitle(row.product.title) }}</div>
            <div class="mt-1 break-all text-xs theme-text-muted">#{{ row.product.id }} / {{ row.product.slug }}</div>
            <div class="mt-2 flex flex-wrap gap-2 text-sm theme-text-muted">
              <span>{{ t('personalCenter.reseller.productSettings.basePrice') }} {{ row.product.price_amount }}</span>
              <span>{{ t('personalCenter.reseller.productSettings.effectivePrice') }} {{ summarizeEffectivePrice(row.product_setting) }}</span>
            </div>
          </div>
          <button
            type="button"
            class="theme-btn-primary rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="detailLoading || saving"
            @click="openEditor(row.product.id)"
          >
            {{ t('personalCenter.reseller.productSettings.edit') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="editing" class="mt-6 rounded-xl border theme-surface-soft p-4">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-bold theme-text-primary">{{ t('personalCenter.reseller.productSettings.editorTitle') }}</h3>
          <div class="mt-1 truncate text-xs theme-text-muted">{{ getProductTitle(editing.product.title) }}</div>
        </div>
        <button
          type="button"
          class="rounded-lg border theme-btn-secondary px-3 py-1.5 text-xs font-semibold"
          @click="editing = null"
        >
          {{ t('common.cancel') }}
        </button>
      </div>

      <div v-if="detailLoading" class="h-24 animate-pulse rounded-xl border theme-surface-muted"></div>
      <div v-else class="space-y-4">
        <ResellerProductRuleEditor
          v-model="productForm"
          :label="t('personalCenter.reseller.productSettings.productLevelRule')"
          :base-price="editing.product.price_amount"
        />
        <div v-for="sku in editing.skus" :key="sku.id" class="rounded-xl border theme-surface-soft p-3">
          <ResellerProductRuleEditor
            :model-value="skuFormFor(sku.id)"
            :label="buildSkuLabel(sku)"
            :base-price="sku.base_price_amount"
            @update:model-value="updateSkuForm(sku.id, $event)"
          />
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="theme-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving"
            @click="saveEditing"
          >
            {{ saving ? t('personalCenter.reseller.productSettings.saving') : t('personalCenter.reseller.productSettings.save') }}
          </button>
          <button
            type="button"
            class="rounded-xl border theme-btn-secondary px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving"
            @click="resetProductRule"
          >
            {{ t('personalCenter.reseller.productSettings.resetProductRule') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { resellerAPI } from '../../api/reseller'
import type {
  ResellerProductSettingData,
  ResellerProductSettingDetailData,
  ResellerProductSettingPayloadItem,
  ResellerProductSettingProductData,
  ResellerProductSettingSKUData,
} from '../../api/types'
import { pageAlertClass, type PageAlert } from '../../utils/alerts'
import { getLocalizedText } from '../../utils/resellerSiteConfig'
import {
  buildResellerProductSettingPayload,
  normalizeResellerProductSettingForm,
  summarizeEffectivePrice,
} from '../../utils/resellerProductSettings'
import ResellerProductRuleEditor from './ResellerProductRuleEditor.vue'

const { t, locale } = useI18n()

const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const rows = ref<ResellerProductSettingDetailData[]>([])
const editing = ref<ResellerProductSettingDetailData | null>(null)
const panelAlert = ref<PageAlert | null>(null)
const productForm = ref<ResellerProductSettingPayloadItem>(normalizeResellerProductSettingForm({ sku_id: 0 }))
const skuForms = reactive<Record<number, ResellerProductSettingPayloadItem>>({})

const filters = reactive({
  keyword: '',
})

const unwrapData = <T,>(response: any): T | null => response?.data?.data || null

const clearSkuForms = () => {
  Object.keys(skuForms).forEach((key) => {
    delete skuForms[Number(key)]
  })
}

const formFromSetting = (
  setting: ResellerProductSettingData | undefined,
  skuID: number,
): ResellerProductSettingPayloadItem =>
  normalizeResellerProductSettingForm({
    sku_id: skuID,
    is_listed: setting?.is_listed,
    pricing_mode: setting?.pricing_mode,
    markup_percent: setting?.markup_percent,
    fixed_markup_amount: setting?.fixed_markup_amount,
    fixed_price_amount: setting?.fixed_price_amount,
    sort_order: setting?.sort_order,
  })

const applyDetailToEditor = (detail: ResellerProductSettingDetailData) => {
  productForm.value = formFromSetting(detail.product_setting, 0)
  clearSkuForms()
  detail.skus.forEach((sku) => {
    skuForms[sku.id] = formFromSetting(sku.setting, sku.id)
  })
  editing.value = detail
}

const skuFormFor = (skuID: number): ResellerProductSettingPayloadItem => {
  if (!skuForms[skuID]) {
    skuForms[skuID] = formFromSetting(undefined, skuID)
  }
  return skuForms[skuID]
}

const updateSkuForm = (skuID: number, value: ResellerProductSettingPayloadItem) => {
  skuForms[skuID] = value
}

const showAlert = (level: PageAlert['level'], message: string) => {
  panelAlert.value = { level, message }
}

const getProductTitle = (title: ResellerProductSettingProductData['title']) =>
  getLocalizedText(title, String(locale.value))

const loadRows = async () => {
  loading.value = true
  panelAlert.value = null
  try {
    const params: Record<string, string> = {}
    if (filters.keyword.trim()) params.keyword = filters.keyword.trim()
    const response = await resellerAPI.productSettings(params)
    rows.value = unwrapData<ResellerProductSettingDetailData[]>(response) || []
  } catch (err: any) {
    rows.value = []
    showAlert('error', err?.message || t('personalCenter.reseller.productSettings.loadFailed'))
  } finally {
    loading.value = false
  }
}

const openEditor = async (productID: number) => {
  detailLoading.value = true
  panelAlert.value = null
  const existing = rows.value.find((row) => row.product.id === productID)
  if (existing) {
    applyDetailToEditor(existing)
  }
  try {
    const response = await resellerAPI.productSettingDetail(productID)
    const detail = unwrapData<ResellerProductSettingDetailData>(response)
    if (detail) {
      applyDetailToEditor(detail)
    }
  } catch (err: any) {
    showAlert('error', err?.message || t('personalCenter.reseller.productSettings.loadFailed'))
  } finally {
    detailLoading.value = false
  }
}

const buildSkuLabel = (sku: ResellerProductSettingSKUData) => {
  const spec = Object.values(sku.spec_values || {})
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(' / ')
  const fallback = sku.sku_code || `#${sku.id}`
  return `${t('personalCenter.reseller.productSettings.skuLevelRule')} · ${spec || fallback}`
}

const saveEditing = async () => {
  if (!editing.value) return
  saving.value = true
  panelAlert.value = null
  try {
    const payload = buildResellerProductSettingPayload([
      productForm.value,
      ...editing.value.skus.map((sku) => skuFormFor(sku.id)),
    ])
    const response = await resellerAPI.updateProductSettings(editing.value.product.id, payload)
    const detail = unwrapData<ResellerProductSettingDetailData>(response)
    if (detail) {
      applyDetailToEditor(detail)
    }
    await loadRows()
    showAlert('success', t('personalCenter.reseller.productSettings.saveSuccess'))
  } catch (err: any) {
    showAlert('error', err?.message || t('personalCenter.reseller.productSettings.saveFailed'))
  } finally {
    saving.value = false
  }
}

const resetProductRule = async () => {
  if (!editing.value) return
  saving.value = true
  panelAlert.value = null
  try {
    const productID = editing.value.product.id
    const response = await resellerAPI.resetProductSetting(productID, 0)
    const detail = unwrapData<ResellerProductSettingDetailData>(response)
    if (detail) {
      applyDetailToEditor(detail)
    } else {
      await openEditor(productID)
    }
    await loadRows()
    showAlert('success', t('personalCenter.reseller.productSettings.resetSuccess'))
  } catch (err: any) {
    showAlert('error', err?.message || t('personalCenter.reseller.productSettings.resetFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(loadRows)
</script>
