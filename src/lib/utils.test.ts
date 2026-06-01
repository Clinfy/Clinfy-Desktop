import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    const shouldHide = false

    expect(cn('px-2', shouldHide && 'hidden', 'px-4', ['text-sm'])).toBe('px-4 text-sm')
  })
})
