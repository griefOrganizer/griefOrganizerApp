export type AddressSuggestion = {
    id: string
    line1: string            // "123 Main St"
    line2: string            // "Raleigh, NC 27601, United States of America"
    county: string | null    // "Wake County"
    state: string | null     // "North Carolina"
}

const KEY = process.env.EXPO_PUBLIC_GEOAPIFY_KEY

export async function searchAddresses(text: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
    if (!KEY) throw new Error('Missing EXPO_PUBLIC_GEOAPIFY_KEY in .env')

    const url =
        'https://api.geoapify.com/v1/geocode/autocomplete' +
        `?text=${encodeURIComponent(text)}` +
        '&filter=countrycode:us' +        // US addresses only
        '&format=json' +
        '&limit=5' +                      // still have 3 left after duplicates are removed if limit=5
        `&apiKey=${encodeURIComponent(KEY)}`

    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`Address lookup failed (${res.status})`)
    const json = await res.json()

        const seen = new Set<string>()
    return (json.results ?? [])
        .map((r: any, i: number) => ({
            id: String(r.place_id ?? i),
            line1: r.address_line1 ?? r.formatted ?? '',
            line2: (r.address_line2 ?? '').replace(/,?\s*United States of America$/, ''),
            county: r.county ?? null,
            state: r.state ?? null,
        }))
        .filter((s: AddressSuggestion) => {          // drop duplicates of the same place
            const key = `${s.line1}|${s.county}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .slice(0, 3)                                 // only the top 3
}