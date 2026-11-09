// Validates user input. Especially helpful for profile detail changes 
// (involved in DetailCard component and UserDetails.tsx page)


export const digitsOnly = (v: string) => v.replace(/\D/g, '')

export function formatPhone(v: string) {
    const d = digitsOnly(v).slice(0, 10)
    if (d.length < 4) return d
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

// Phone's local date, not UTC, so evening picks don't shift a day
export function toISODate(d: Date) {
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}
export function fromISODate(s: string) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}

const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/
const PHONE_PATTERN = /^[2-9]\d{2}[2-9]\d{6}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_BIRTHDAY = new Date(1900, 0, 1)

export function validateName(value: string, label: string) {
    const v = value.trim()
    if (!v) return ''
    if (v.length > 50) return `${label} must be 50 characters or fewer.`
    if (!NAME_PATTERN.test(v)) return `${label} can only use letters, spaces, hyphens and apostrophes.`
    return ''
}
export function validatePlace(value: string, label: string) {
    const v = value.trim()
    if (v.length > 50) return `${label} must be 50 characters or fewer.`
    return ''
}
export function validatePhone(value: string) {
    const d = digitsOnly(value)
    if (!d) return ''
    if (d.length !== 10) return 'Phone number must be 10 digits.'
    if (!PHONE_PATTERN.test(d)) return 'That doesn\'t look like a valid US phone number.'
    return ''
}
export function validateEmail(value: string) {
    const v = value.trim()
    if (!v) return ''
    if (!EMAIL_PATTERN.test(v)) return 'That doesn\'t look like an email address.'
    return ''
}
export function validateBirthday(date: Date | null) {
    if (!date) return ''
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (date > today) return 'Date of birth can\'t be in the future.'
    if (date < MIN_BIRTHDAY) return 'Please choose a date after 1900.'
    return ''
}