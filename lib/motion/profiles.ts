import type { MotionProfileData } from '@/lib/schema/types'

export const defaultPulse: MotionProfileData = {
  pulse_speed: 1.0,
  easing_type: 'easeInOut',
  opacity_min: 0.4,
  opacity_max: 0.9,
  scale_min: 0.95,
  scale_max: 1.05,
  duration: 2.5,
  loop: true,
}

export const slowPulse: MotionProfileData = {
  ...defaultPulse,
  pulse_speed: 0.5,
  duration: 4.0,
}

export const fastPulse: MotionProfileData = {
  ...defaultPulse,
  pulse_speed: 2.0,
  duration: 1.2,
}

export function resolveMotionProfile(profile: MotionProfileData): MotionProfileData {
  return { ...defaultPulse, ...profile }
}
