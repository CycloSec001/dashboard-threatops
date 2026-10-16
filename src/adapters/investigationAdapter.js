import { envelopeValue } from './responseAdapter'

export function normalizeInvestigationSection(section, response) {
  const key = section.replace(/-/g, '_')
  return { section: key, value: envelopeValue(response, key, null), raw: response }
}

export function normalizeInvestigation(responses = {}) {
  return Object.fromEntries(Object.entries(responses).map(([section, response]) => [
    section.replace(/-/g, '_'),
    normalizeInvestigationSection(section, response).value,
  ]))
}
