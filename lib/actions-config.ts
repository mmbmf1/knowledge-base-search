export interface ActionConfig {
  type: string
  label: string
  patterns: RegExp[]
  apiRoute: string
}

// Action patterns that can be detected in resolution steps
export const ACTIONS: ActionConfig[] = [
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
]

export function getActions(): ActionConfig[] {
  return ACTIONS
}
