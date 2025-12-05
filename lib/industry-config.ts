export type Industry = 'isp' | 'healthcare' | 'retail' | 'finance' | 'custom'

export interface IndustryConfig {
  industry: Industry
  name: string
  contentTypes: string[]
  actions: {
    type: string
    label: string
    patterns: RegExp[]
    apiRoute: string
    icon?: string
  }[]
}

export const ISP_CONFIG: IndustryConfig = {
  industry: 'isp',
  name: 'ISP Support',
  contentTypes: [
    'scenario',
    'work_order',
    'equipment',
    'outage',
    'policy',
    'reference',
    'subscriber',
  ],
  actions: [
    {
      type: 'reset-router',
      label: 'Reset Router',
      patterns: [/\b(reset|restart).*router\b/i],
      apiRoute: '/api/actions/reset-router',
    },
    {
      type: 'speed-test',
      label: 'Speed Test',
      patterns: [
        /\b(run|perform|execute|speed\s+test).*speed\s+test\b/i,
        /\bspeed\s+test\b/i,
      ],
      apiRoute: '/api/actions/speed-test',
    },
    {
      type: 'restart-equipment',
      label: 'Restart Equipment',
      patterns: [/\b(restart|reboot).*(?:equipment|ONT|modem)\b/i],
      apiRoute: '/api/actions/restart-equipment',
    },
  ],
}

export function getIndustryConfig(): IndustryConfig {
  if (typeof window !== 'undefined') {
    return ISP_CONFIG
  }
  const industry = (process.env.INDUSTRY || 'isp') as Industry
  switch (industry) {
    case 'isp':
      return ISP_CONFIG
    default:
      return ISP_CONFIG
  }
}

export const industryConfig = getIndustryConfig()
