import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'LedgerOne — Billing & Inventory for Packaging Businesses'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a', 
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="none"
            style={{ width: '180px', height: '180px' }}
          >
            <rect width="32" height="32" rx="8" fill="#f97316" />
            <path
              d="M8 12l8-5 8 5v10l-8 5-8-5V12z"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M16 7v10"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8 12l8 5 8-5"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 140, fontWeight: 800, letterSpacing: '-0.04em' }}>
            LedgerOne
          </div>
        </div>
        <div style={{ marginTop: '50px', fontSize: 44, color: '#a1a1aa', fontWeight: 500, letterSpacing: '-0.01em' }}>
          Billing & Inventory for Packaging
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
