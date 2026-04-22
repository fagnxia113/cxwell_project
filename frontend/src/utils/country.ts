export const COUNTRY_OPTIONS = [
  { label: '中国 / China', value: 'CN' },
  { label: '美国 / America', value: 'US' },
  { label: '日本 / Japan', value: 'JP' },
  { label: '新加坡 / Singapore', value: 'SG' },
  { label: '马来西亚 / Malaysia', value: 'MY' },
  { label: '泰国 / Thailand', value: 'TH' },
  { label: '越南 / Vietnam', value: 'VN' },
  { label: '印度尼西亚 / Indonesia', value: 'ID' },
  { label: '菲律宾 / Philippines', value: 'PH' },
  { label: '缅甸 / Myanmar', value: 'MM' },
  { label: '柬埔寨 / Cambodia', value: 'KH' },
  { label: '老挝 / Laos', value: 'LA' },
  { label: '文莱 / Brunei', value: 'BN' },
]

export function getCountryLabel(countryCode: string | null | undefined, locale: string = 'zh'): string {
  if (!countryCode) return ''
  const country = COUNTRY_OPTIONS.find(c => c.value === countryCode)
  if (!country) return countryCode

  const [zh, en] = country.label.split(' / ')
  return locale === 'en' ? en : zh
}

export function getCountryBilingual(countryCode: string | null | undefined): string {
  if (!countryCode) return ''
  const country = COUNTRY_OPTIONS.find(c => c.value === countryCode)
  return country?.label || countryCode
}
