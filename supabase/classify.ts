// Shared email classifier for gmail-scan.
// Pure TypeScript with no imports, so it runs in Deno (Edge Functions) and can be tested anywhere.
//
// How it decides, in order:
//   1. Skip emails that are never useful (from the user themselves, job sites, newsletters, ads)
//   2. Known companies (Venmo, Delta, LinkedIn...) get their category directly
//   3. Everything else is scored on keywords, after removing email footers ("Privacy Policy", "Unsubscribe")
//   4. Money categories need proof it's a real account (an account number, or a bill/statement subject)
//   5. Mass marketing email is dropped unless it proves an account or membership exists
//   6. Personal notes only count when a real person wrote them

export type Category =
    | 'bank' | 'credit_card' | 'investment' | 'retirement' | 'insurance' | 'housing'
    | 'utility' | 'phone_internet' | 'subscription' | 'membership' | 'online_account'
    | 'health' | 'other_bill' | 'personal'

export type EmailInput = {
    subject: string
    body: string            // plain text of the email (or the snippet if that's all we have)
    fromName: string
    fromEmail: string
    date: string            // ISO date the email was sent
    labels?: string[]       // Gmail labels, e.g. CATEGORY_PROMOTIONS
    listUnsubscribe?: boolean   // true if the email has a "List-Unsubscribe" header (mass email)
    precedence?: string     // "bulk" or "list" for mass email
    userEmail?: string      // the connected inbox, so we can skip emails the user sent themselves
}

export type Extracted = {
    category: Category
    organization: string
    accountLast4: string | null
    details: {
        type?: string
        amountDue?: number
        balance?: number
        premium?: number
        charge?: number
        dueDate?: string
        renewalDate?: string
        why?: string        // short explanation of the decision, to make testing easier
    }
    score: number
}

// ---------- Known companies ----------
// A known sender always means the person has an account there, even if the email is marketing.
// cardAware: the company does both bank accounts and credit cards, so the email's words decide which.
type Known = { name: string; category: Category; cardAware?: boolean }
export const KNOWN: Record<string, Known> = {
    // Banks and money apps
    'venmo.com': { name: 'Venmo', category: 'bank' },
    'paypal.com': { name: 'PayPal', category: 'bank' },
    'cash.app': { name: 'Cash App', category: 'bank' },
    'plaid.com': { name: 'Plaid', category: 'bank' },
    'chase.com': { name: 'Chase', category: 'bank', cardAware: true },
    'wellsfargo.com': { name: 'Wells Fargo', category: 'bank', cardAware: true },
    'bankofamerica.com': { name: 'Bank of America', category: 'bank', cardAware: true },
    'capitalone.com': { name: 'Capital One', category: 'bank', cardAware: true },
    'citi.com': { name: 'Citi', category: 'bank', cardAware: true },
    'usbank.com': { name: 'U.S. Bank', category: 'bank', cardAware: true },
    'pnc.com': { name: 'PNC', category: 'bank', cardAware: true },
    'ally.com': { name: 'Ally Bank', category: 'bank' },
    'americanexpress.com': { name: 'American Express', category: 'credit_card' },
    'discover.com': { name: 'Discover', category: 'credit_card' },
    // Investments
    'fidelity.com': { name: 'Fidelity', category: 'investment' },
    'vanguard.com': { name: 'Vanguard', category: 'investment' },
    'schwab.com': { name: 'Charles Schwab', category: 'investment' },
    'robinhood.com': { name: 'Robinhood', category: 'investment' },
    // Subscriptions
    'linkedin.com': { name: 'LinkedIn', category: 'subscription' },
    'uber.com': { name: 'Uber', category: 'subscription' },
    'lyft.com': { name: 'Lyft', category: 'subscription' },
    'notability.com': { name: 'Notability', category: 'subscription' },
    'anthropic.com': { name: 'Anthropic (Claude)', category: 'subscription' },
    'openai.com': { name: 'OpenAI (ChatGPT)', category: 'subscription' },
    'netflix.com': { name: 'Netflix', category: 'subscription' },
    'spotify.com': { name: 'Spotify', category: 'subscription' },
    'hulu.com': { name: 'Hulu', category: 'subscription' },
    'disneyplus.com': { name: 'Disney+', category: 'subscription' },
    'max.com': { name: 'Max', category: 'subscription' },
    'peacocktv.com': { name: 'Peacock', category: 'subscription' },
    'paramountplus.com': { name: 'Paramount+', category: 'subscription' },
    'adobe.com': { name: 'Adobe', category: 'subscription' },
    'dropbox.com': { name: 'Dropbox', category: 'subscription' },
    // Online accounts (no regular bill, but should be closed)
    'delta.com': { name: 'Delta Air Lines', category: 'online_account' },
    'united.com': { name: 'United Airlines', category: 'online_account' },
    'aa.com': { name: 'American Airlines', category: 'online_account' },
    'southwest.com': { name: 'Southwest Airlines', category: 'online_account' },
    'airbnb.com': { name: 'Airbnb', category: 'online_account' },
    'amazon.com': { name: 'Amazon', category: 'online_account' },
    // Health
    'cvs.com': { name: 'CVS Pharmacy', category: 'health' },
    'walgreens.com': { name: 'Walgreens', category: 'health' },
    // Housing
    'rentmanager.com': { name: 'Rent payments (Rent Manager)', category: 'housing' },
    'zillow.com': { name: 'Zillow Rentals', category: 'housing' },
}

// Senders that are never useful here: account security notices, mail previews, newsletters, job sites
const IGNORE_DOMAINS = new Set([
    'google.com', 'usps.com', 'usps.gov', 'substack.com', 'medium.com', 'opentable.com',
    'squareup.com', 'indeed.com', 'avature.net', 'coderpad.io', 'acquiretm.com', 'greenhouse.io',
    'lever.co', 'myworkday.com', 'handshake.com', 'joinhandshake.com', 'eventbrite.com', 'lineleap.com',
])
// Parts of a sender's address that mean job alerts or marketing
const IGNORE_SENDER = /(job[s-]?alert|jobs-noreply|jobalerts|careers?|recruit|talent|hiring|marketing|promo|deals|newsletter|offers?)/i

// Email providers people use personally. A sender at one of these could be a person OR a small business.
const PERSONAL_PROVIDERS = /(^|\.)(gmail|googlemail|yahoo|outlook|hotmail|live|icloud|me|aol|proton|protonmail)\.(com|me)$|\.edu$/i

// Addresses and names that are automated, not a person
const AUTOMATED = /(no-?reply|do-?not-?reply|donotreply|notification|alert|mailer|bounce|^info$|^news|^hello$|^team$|^support$|^updates?$|^service$|^billing$|^account|^style$|^appserv$)/i

// ---------- Category keywords (matched as whole words) ----------
// [phrase, points]. Subject matches count 3x, body matches 1x.
type Scored = Exclude<Category, 'personal' | 'other_bill' | 'online_account'>
const KEYWORDS: Record<Scored, [string, number][]> = {
    bank: [
        ['credit union', 5], ['checking', 4], ['savings account', 4], ['direct deposit', 4],
        ['ending balance', 4], ['available balance', 4], ['account alert', 4], ['bank', 2], ['deposit', 2],
    ],
    credit_card: [
        ['credit card', 3], ['rewards card', 4], ['card statement', 4], ['card services', 3],
        ['minimum payment', 5], ['statement balance', 4], ['new balance', 3],
    ],
    investment: [
        ['brokerage', 4], ['investment account', 5], ['portfolio', 3], ['dividend', 3], ['shares', 2],
    ],
    retirement: [
        ['retirement', 5], ['pension', 5], ['401\\(k\\)', 5], ['403\\(b\\)', 5], ['ira', 3], ['annuity', 4],
    ],
    insurance: [
        ['insurance', 3], ['policyholder', 5], ['insurance policy', 5], ['auto policy', 5],
        ['policy number', 5], ['policy', 3], ['premium', 2], ['coverage', 2], ['deductible', 3],
    ],
    housing: [
        ['rent', 4], ['rent payment', 6], ['lease', 4], ['landlord', 4], ['tenant', 4], ['resident portal', 4],
        ['property management', 5], ['mortgage', 5], ['escrow', 4], ['hoa', 4],
    ],
    utility: [
        ['electric', 4], ['electricity', 4], ['energy', 3], ['gas', 4], ['water', 2], ['sewer', 4],
        ['service address', 3], ['utility', 4], ['utilities', 4], ['kwh', 4], ['meter', 3],
    ],
    phone_internet: [
        ['wireless', 4], ['internet', 3], ['broadband', 4], ['lines on plan', 5], ['data plan', 4],
        ['phone bill', 5], ['mobile plan', 4],
    ],
    subscription: [
        ['subscription', 5], ['renews', 3], ['auto-renew', 4], ['next billing date', 5], ['billing period', 4],
        ['your plan', 3], ['pro plan', 4], ['premium plan', 4], ['free trial', 3], ['trial ends', 4],
        ['manage or cancel', 3], ['streaming', 3], ['thanks for being a member', 3],
    ],
    membership: [
        ['membership', 4], ['your membership', 5], ['gym', 5], ['yoga', 5], ['pilates', 5], ['fitness', 4],
        ['wellness center', 5], ['class schedule', 4], ['classes', 2], ['studio', 2], ['swim', 3],
        ['country club', 5], ['member since', 3],
    ],
    health: [
        ['pharmacy', 6], ['prescription', 6], ['refill', 5], ['rx', 4], ['ready for pickup', 3],
        ['patient', 3], ['appointment', 3], ['clinic', 3], ['doctor', 3],
    ],
}

// Signs an email is NOT about an account or bill
const IGNORE_WORDS: [string, number][] = [
    ['has shipped', 5], ['on the way', 3], ['estimated delivery', 5], ['tracking number', 5], ['order #', 4],
    ['% off', 5], ['shop now', 5], ['sale ends', 5], ['deals', 3], ['limited time', 3], ['free shipping', 4],
    ['settlement', 5], ['class action', 5], ['webinar', 4], ['job alert', 5], ['apply now', 5],
    ['new jobs', 5], ['recommended for you', 4], ['reservation', 4], ['tickets', 3], ['rsvp', 4],
    ['security alert', 5], ['sign-in', 4], ['verification code', 5],
]

// "Is there any money in this?" Used to tell people's notes apart from bills.
const MONEY_SIGNS = /\$\s?\d|\baccount\b|statement|invoice|\bbill\b|payment|policy|balance|\bdue\b/i
// Subject words that mean "this is about an existing account"
const ACCOUNT_SUBJECT = /(statement|bill\b|invoice|payment|\bdue\b|policy|premium|renew|account|deposit|balance|autopay|rent|lease|refill|prescription)/i
// Signs of something that charges again and again
const RECURRING = /(subscription|membership|\bmembers?\b|renew|recurring|billed (monthly|annually|yearly)|next billing|auto-?renew|\bplan\b|class schedule|\bclasses\b|check-?in)/i

const MONEY_CATEGORIES = new Set<Category>([
    'bank', 'credit_card', 'investment', 'retirement', 'insurance', 'housing', 'utility', 'phone_internet',
])

// ---------- Cleaning ----------
// Footers mention "Privacy Policy", "Terms", "Unsubscribe"... which caused most of the wrong "insurance" results.
const FOOTER_LINE = /(unsubscribe|privacy|terms of (use|service)|©|copyright|all rights reserved|view (this email )?(in|on) (your )?browser|manage (your )?(email )?preferences|you('re| are) receiving this|this (email|message) was sent to|update your preferences|do not reply to this)/i
const POLICY_PHRASES = /\b(privacy|cookie|return|refund|shipping|cancellation|community) polic(y|ies)\b|\bpolicy updates?\b|\bour policies\b/gi

function cleanBody(body: string): string {
    const kept: string[] = []
    for (const line of body.split(/\r?\n/)) {
        if (/unsubscribe/i.test(line)) break            // everything after "unsubscribe" is footer
        if (FOOTER_LINE.test(line)) continue
        kept.push(line)
    }
    return kept.join('\n').replace(POLICY_PHRASES, ' ').slice(0, 3000)
}

function scoreText(subject: string, body: string, phrases: [string, number][]): [number, string[]] {
    let score = 0
    const hits: string[] = []
    for (const [phrase, weight] of phrases) {
        const re = new RegExp(`\\b${phrase}\\b`, 'i')
        const inSubject = re.test(subject)
        const inBody = re.test(body)
        if (inSubject) score += weight * 3
        if (inBody) score += weight
        if (inSubject || inBody) hits.push(phrase.replace(/\\/g, ''))
    }
    return [score, hits]
}

// ---------- Names ----------
const ORG_SUFFIX =
    'Credit Union|Bank|Insurance|Electric|Energy|Gas|Water|Wireless|Internet|' +
    'Card Services|Services|Retirement|Financial|Mutual|Utilities|Telecom|Pharmacy|Fitness|Yoga|Apartments|Properties'
const LEADING_FILLER = /^(Your|The|Hi|Hello|Dear|From|Re|Fwd|Important|Notice)\s+/i
const TRAILING_FILLER = /\s+(monthly|annual|quarterly|weekly|new|latest|online|account)$/i

function cleanOrg(name: string): string {
    let n = name.trim().replace(/[.,:;]+$/, '')
    let prev = ''
    while (n !== prev) {
        prev = n
        n = n.replace(LEADING_FILLER, '').replace(TRAILING_FILLER, '').trim()
    }
    return n
}

function orgFromText(subject: string, body: string): string | null {
    const fwd = body.match(/Forwarded message[\s\S]{0,40}?From:\s*([^<\n]+?)\s*(?:<|Subject:|Date:|\n|$)/i)
    if (fwd) return cleanOrg(fwd[1])

    const suffixRe = new RegExp(`((?:[A-Z][\\w&'-]*\\s){1,4}(?:${ORG_SUFFIX}))\\b`, 'g')
    for (const text of [body, subject]) {
        const matches = [...text.matchAll(suffixRe)].map((m) => cleanOrg(m[1])).filter((m) => m.split(' ').length >= 2)
        if (matches.length) return matches.sort((a, b) => b.length - a.length)[0]
    }

    for (const re of [
        /your\s+(.+?)\s+(?:statement|bill|invoice|policy|membership|subscription|receipt|renewal|payment)/i,
        /^([^:]+?):\s*(?:payment|bill|statement|reminder)/i,
    ]) {
        const m = subject.match(re)
        if (m) {
            const name = cleanOrg(m[1])
            if (name && /[A-Z]/.test(name[0])) return name
        }
    }
    return null
}

// "OpenTable | Sava's" -> "OpenTable", "Amphenol via AcquireTM.com" -> "Amphenol", ignores bare email addresses
function cleanDisplayName(name: string): string | null {
    const n = name.split(/\s+(?:via|\||-|–)\s+/i)[0].replace(/\s+(Team|Notifications?|Alerts?)$/i, '').trim()
    if (!n || n.includes('@')) return null
    return n
}

function prettyDomain(domain: string): string {
    const word = domain.split('.')[0]
    return word.charAt(0).toUpperCase() + word.slice(1)
}

// ---------- Account numbers, amounts, dates ----------
function findAccountLast4(text: string): string | null {
    const patterns = [
        /(?<!payment method:\s{0,3})(?:account|acct|card|policy|member(?:ship)?\s*id|account number)\b[^.\n$]{0,25}?ending\s*(?:in)?\s*[:#]?\s*(\d{4,})/i,
        /(?:account|acct|policy)\s*(?:number|no\.?|#)\s*[:#]?\s*[x*•\s-]*([\d-]{4,})/i,
        /(?<!payment method:\s{0,3}card\s)ending\s+in\s+(\d{4,})/i,
    ]
    for (const re of patterns) {
        const m = text.match(re)
        if (m) {
            const digits = m[1].replace(/\D/g, '')
            if (digits.length >= 4) return digits.slice(-4)
        }
    }
    return null
}

const MONEY = '\\$\\s?([\\d,]+\\.\\d{2})'
const toNumber = (s: string) => Number(s.replace(/,/g, ''))
function findAmount(text: string, labels: string): number | undefined {
    const m = text.match(new RegExp(`(?:${labels})[^$\\n]{0,25}?${MONEY}`, 'i'))
    return m ? toNumber(m[1]) : undefined
}

const MONTHS = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?'
function findDate(text: string, labels: string): string | undefined {
    const m = text.match(new RegExp(`(?:${labels})\\W{0,4}((?:${MONTHS})\\.?\\s+\\d{1,2},?\\s+\\d{4})`, 'i'))
    if (!m) return undefined
    const d = new Date(m[1].replace(/\./g, ''))
    if (isNaN(d.getTime())) return undefined
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function findType(text: string): string | undefined {
    const t = text.toLowerCase()
    if (/reminder/.test(t)) return 'payment reminder'
    if (/renew/.test(t)) return 'renewal'
    if (/receipt|billed/.test(t)) return 'receipt'
    if (/invoice/.test(t)) return 'invoice'
    if (/statement/.test(t)) return 'statement'
    if (/\bbill\b/.test(t)) return 'bill'
    if (/refill|prescription|pickup/.test(t)) return 'pharmacy'
    if (/policy|notice/.test(t)) return 'notice'
    return undefined
}

function extractDetails(subject: string, text: string, why: string): Extracted['details'] {
    return {
        type: findType(subject) ?? findType(text),
        amountDue: findAmount(text, 'amount due|minimum payment due|payment of|invoice totals?|totals?'),
        balance: findAmount(text, 'ending balance|new balance|account balance|available balance|statement balance'),
        premium: findAmount(text, 'premium(?: is)?|6-month premium'),
        charge: findAmount(text, 'amount:|billed|charged'),
        dueDate: findDate(text, 'due date:?|due on|payment due:?|next premium due:?'),
        renewalDate: findDate(text, 'renews on|renewal date:?|next billing date:?'),
        why,
    }
}

// ---------- Main ----------
export function baseDomain(host: string) {
    const labels = host.toLowerCase().split('.')
    return labels.slice(-2).join('.')
}

export function classifyEmail(email: EmailInput): Extracted | null {
    const fromEmail = email.fromEmail.toLowerCase()
    const [localPart, host = ''] = fromEmail.split('@')
    const domain = baseDomain(host)
    const subject = (email.subject ?? '').replace(POLICY_PHRASES, ' ')
    const body = cleanBody(email.body ?? '')
    const text = `${subject}\n${body}`
    const labels = email.labels ?? []

    // 1. Never useful
    if (email.userEmail && fromEmail === email.userEmail.toLowerCase()) return null      // they emailed themselves
    if (IGNORE_DOMAINS.has(domain)) return null
    if (!KNOWN[domain] && (IGNORE_SENDER.test(localPart) || IGNORE_SENDER.test(host))) return null

    const isMass =
        !!email.listUnsubscribe ||
        /bulk|list/i.test(email.precedence ?? '') ||
        labels.some((l) => ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_FORUMS'].includes(l))

    const accountLast4 = findAccountLast4(text)
    const [ignoreScore] = scoreText(subject, body, IGNORE_WORDS)

    // Score every keyword category
    const scores = {} as Record<Scored, number>
    let best: Scored | null = null
    let bestScore = 0
    let bestHits: string[] = []
    for (const cat of Object.keys(KEYWORDS) as Scored[]) {
        const [score, hits] = scoreText(subject, body, KEYWORDS[cat])
        scores[cat] = score
        if (score > bestScore) { best = cat; bestScore = score; bestHits = hits }
    }

    // 2. Known companies
    const known = KNOWN[domain]
    if (known) {
        let category = known.category
        if (known.cardAware && (scores.credit_card ?? 0) > (scores.bank ?? 0)) category = 'credit_card'
        return {
            category,
            organization: known.name,
            accountLast4,
            details: extractDetails(subject, text, `known sender ${domain}`),
            score: 100,
        }
    }

    // 3. Unknown senders: decide by keywords, with safety checks
    const strongAccount = !!accountLast4 || ACCOUNT_SUBJECT.test(subject)
    const recurring = RECURRING.test(text)

    let category: Category | null = null
    let why = ''

    if (best && bestScore >= 4) {
        if (MONEY_CATEGORIES.has(best)) {
            // Money categories need proof of a real account, otherwise it's probably an ad or a footer mention
            if (strongAccount) { category = best; why = `keywords: ${bestHits.join(', ')}` }
        } else if (best === 'subscription' || best === 'membership') {
            if (recurring) { category = best; why = `keywords: ${bestHits.join(', ')}` }
        } else if (best === 'health') {
            if (bestScore >= 6) { category = best; why = `keywords: ${bestHits.join(', ')}` }
        }
    }

    // A clear bill from a company we don't recognize
    if (!category && accountLast4 && new RegExp(MONEY).test(text) && ACCOUNT_SUBJECT.test(subject)) {
        category = 'other_bill'
        why = 'account number and amount'
    }

    // 4. Ads and one-off receipts
    if (category) {
        const membershipProof = category === 'membership' && bestScore >= 8   // a gym's newsletter still means a membership
        if (isMass && !strongAccount && !membershipProof && !(category === 'subscription' && recurring)) return null
        if (ignoreScore >= 5 && ignoreScore >= bestScore) return null
        const oneOffReceipt = /receipt|order/i.test(subject) && !recurring
        if (oneOffReceipt && category !== 'health') return null
    }

    if (category) {
        const personalProvider = PERSONAL_PROVIDERS.test(host)
        const organization = personalProvider
            // Small businesses and forwarded emails come from gmail.com etc., so read the name from the email
            ? (orgFromText(subject, body) ?? (cleanDisplayName(email.fromName) || fromEmail))
            : (cleanDisplayName(email.fromName) ?? orgFromText(subject, body) ?? prettyDomain(domain))
        return { category, organization, accountLast4, details: extractDetails(subject, text, why), score: bestScore }
    }

    // 5. A note from a real person
    const automated = AUTOMATED.test(localPart) || /via|team|notifications?/i.test(email.fromName)
    const inPrimary = labels.length === 0 || labels.includes('CATEGORY_PERSONAL')   // Gmail's "Primary" tab
    if (!automated && !isMass && inPrimary && ignoreScore === 0 && !MONEY_SIGNS.test(text) && (bestScore < 4)) {
        return {
            category: 'personal',
            organization: email.fromName || fromEmail,
            accountLast4: null,
            details: { why: 'personal note' },
            score: 0,
        }
    }

    return null
}