export type HomeFeatureItem = {
  id: 'person-abmc' | 'gender-abmc'
  label: string
  description: string
  status: 'planned'
}

export type HomeFeature = {
  id: 'person'
  label: string
  description: string
  requiredEndpointKeys: string[]
  items: HomeFeatureItem[]
}

export const HOME_FEATURES: HomeFeature[] = [
  {
    id: 'person',
    label: 'Person',
    description: 'Access person-related workflows and shared reference data.',
    requiredEndpointKeys: ['persons.details', 'genders.details'],
    items: [
      {
        id: 'person-abmc',
        label: 'ABMC de Person',
        description: 'Future area for creating, viewing, updating, and deleting people.',
        status: 'planned',
      },
      {
        id: 'gender-abmc',
        label: 'ABMC de Gender',
        description: 'Future area for managing gender reference data.',
        status: 'planned',
      },
    ],
  },
]

export function isHomeFeatureVisible(feature: HomeFeature, userEndpointKeys: Set<string>) {
  if (!Array.isArray(feature.requiredEndpointKeys) || feature.requiredEndpointKeys.length === 0) {
    return false
  }

  return feature.requiredEndpointKeys.some((endpointKey) => userEndpointKeys.has(endpointKey))
}

export function getVisibleHomeFeatures(
  features: HomeFeature[],
  userEndpointKeys: Set<string>,
) {
  return features.filter((feature) => isHomeFeatureVisible(feature, userEndpointKeys))
}
