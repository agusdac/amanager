export type SourceId = 'hilko' | 'sheet' | 'notion' | 'confluence' | 'other'

export function defaultUploadKind(source: SourceId): 'csv' | 'zip' {
  return source === 'hilko' ? 'zip' : 'csv'
}