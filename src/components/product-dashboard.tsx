'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CircleAlert,
  Database,
  FileText,
  Gauge,
  Minus,
  Plus,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Container } from '@/components/layout/container'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'scanner', label: 'Scanner', icon: BarChart3 },
  { id: 'guide', label: 'Weekly guide', icon: BookOpen },
  { id: 'portfolio', label: 'Paper portfolio', icon: Wallet },
] as const

type TabId = (typeof tabs)[number]['id']

type Holding = {
  ticker: string
  name: string
  shares: number
  price: number
  change: number
  market: 'KR'
}

const scannerRows = [
  {
    ticker: '069500',
    name: 'KODEX 200',
    strategy: 'Momentum',
    percentile: 98.4,
    score: 87.2,
    change: 14.44,
    industry: 'Broad market',
    status: '신규',
  },
  {
    ticker: '102110',
    name: 'TIGER 200',
    strategy: 'Momentum',
    percentile: 96.8,
    score: 84.9,
    change: 14.4,
    industry: 'Broad market',
    status: '유지',
  },
  {
    ticker: '229200',
    name: 'KODEX 코스닥150',
    strategy: 'Oversold',
    percentile: 95.7,
    score: 81.6,
    change: 12.91,
    industry: 'Growth',
    status: '관찰',
  },
  {
    ticker: '360750',
    name: 'TIGER 미국S&P500',
    strategy: 'Oversold',
    percentile: 91.2,
    score: 74.1,
    change: -4.21,
    industry: 'US equity',
    status: '제외',
  },
]

const initialHoldings: Holding[] = [
  {
    ticker: '069500',
    name: 'KODEX 200',
    shares: 30,
    price: 113420,
    change: 14.44,
    market: 'KR',
  },
  {
    ticker: '229200',
    name: 'KODEX 코스닥150',
    shares: 40,
    price: 14080,
    change: 12.91,
    market: 'KR',
  },
]

const formatKrw = (value: number) =>
  `₩${Math.round(value).toLocaleString('ko-KR')}`

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold tracking-[0.24em] text-amber-300/70 uppercase">
      {children}
    </p>
  )
}

function StatusPill({ status }: { status: string }) {
  const positive = status === '신규' || status === '유지'
  return (
    <Badge
      variant="outline"
      className={
        positive
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
          : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
      }
    >
      {status}
    </Badge>
  )
}

function Overview({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <Card className="overflow-hidden border-white/10 bg-white/[0.055] text-white shadow-2xl shadow-black/20">
        <CardHeader className="border-b border-white/10 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <SectionLabel>Signal desk / 08 Sep 2026</SectionLabel>
              <CardTitle className="mt-3 text-2xl tracking-tight text-white">
                오늘의 시장 신호
              </CardTitle>
            </div>
            <Badge className="border-amber-300/30 bg-amber-300/10 text-amber-200">
              Conditional Go
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 pt-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-sm text-slate-300">
              Momentum · 한국 승인 유니버스
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              KODEX 200
            </p>
            <p className="mt-1 font-mono text-sm text-slate-400">
              069500 · 98.4 percentile
            </p>
            <div className="mt-7 flex items-end gap-3">
              <span className="font-mono text-3xl text-emerald-300">
                +14.44%
              </span>
              <span className="mb-1 text-xs text-slate-400">
                승인 기간 가격수익률
              </span>
            </div>
          </div>
          <div className="border-l border-white/10 pl-5">
            <p className="text-xs text-slate-400">Next action</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Thesis 유지와 위험·보상 개선이 확인될 때만 추가매수합니다.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6 border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onNavigate('guide')}
            >
              가이드 열기 <ArrowUpRight />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-300/20 bg-amber-300/[0.07] text-white shadow-xl shadow-amber-950/10">
        <CardHeader className="pb-3">
          <SectionLabel>Data status</SectionLabel>
          <CardTitle className="mt-3 text-lg text-white">
            데이터 신뢰도
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-sm text-slate-300">한국 ETF universe</span>
            <span className="font-mono text-sm text-emerald-300">5 / 5</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-sm text-slate-300">Latest as_of</span>
            <span className="font-mono text-sm text-white">2026-09-08</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Quality flags</span>
            <span className="font-mono text-sm text-amber-200">1 warning</span>
          </div>
          <div className="flex gap-2 pt-2 text-xs text-slate-400">
            <ShieldCheck className="size-4 text-emerald-300" />
            API source · raw snapshot locked
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.055] text-white lg:col-span-2">
        <CardHeader className="flex-row items-end justify-between border-b border-white/10 pb-5">
          <div>
            <SectionLabel>Weekly guide / v1</SectionLabel>
            <CardTitle className="mt-3 text-xl text-white">
              Top 3 · 이번 주 후보
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-200 hover:bg-amber-200/10 hover:text-amber-100"
            onClick={() => onNavigate('scanner')}
          >
            전체 Scanner 보기 <ArrowUpRight />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 pt-5 md:grid-cols-3">
          {scannerRows.slice(0, 3).map((row, index) => (
            <div
              key={row.ticker}
              className="rounded-xl border border-white/10 bg-black/10 p-4"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-slate-500">
                  0{index + 1}
                </span>
                <StatusPill status={row.status} />
              </div>
              <p className="mt-6 font-mono text-xs text-amber-200">
                {row.ticker}
              </p>
              <p className="mt-1 font-medium text-white">{row.name}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="font-mono text-lg text-emerald-300">
                  +{row.change.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-500">{row.strategy}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Scanner() {
  return (
    <Card className="border-white/10 bg-white/[0.055] text-white">
      <CardHeader className="border-b border-white/10 pb-5">
        <div className="flex items-end justify-between">
          <div>
            <SectionLabel>Strategy scanner / strategy-v0.2</SectionLabel>
            <CardTitle className="mt-3 text-xl text-white">
              후보를 억지로 채우지 않습니다
            </CardTitle>
          </div>
          <span className="font-mono text-xs text-slate-500">
            as_of 2026-09-08
          </span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="font-mono text-[10px] tracking-[0.18em] text-slate-500 uppercase">
            <tr>
              <th className="pb-3">Instrument</th>
              <th className="pb-3">Strategy</th>
              <th className="pb-3">Percentile</th>
              <th className="pb-3">Score</th>
              <th className="pb-3">Return</th>
              <th className="pb-3">State</th>
            </tr>
          </thead>
          <tbody>
            {scannerRows.map(row => (
              <tr key={row.ticker} className="border-t border-white/10">
                <td className="py-4">
                  <p className="font-mono text-xs text-amber-200">
                    {row.ticker}
                  </p>
                  <p className="mt-1 font-medium text-white">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.industry}</p>
                </td>
                <td className="py-4 text-slate-300">{row.strategy}</td>
                <td className="py-4 font-mono text-slate-200">
                  {row.percentile.toFixed(1)}
                </td>
                <td className="py-4 font-mono text-slate-200">
                  {row.score.toFixed(1)}
                </td>
                <td
                  className={`py-4 font-mono ${row.change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}
                >
                  {row.change >= 0 ? '+' : ''}
                  {row.change.toFixed(2)}%
                </td>
                <td className="py-4">
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-400">
          <CircleAlert className="size-4 text-amber-300" />
          G0~G4 실패, 중복률, 상관계수, Thesis 누락 후보는 제외 사유와 함께
          보관됩니다.
        </div>
      </CardContent>
    </Card>
  )
}

function Guide() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
      <Card className="border-white/10 bg-white/[0.055] text-white">
        <CardHeader className="border-b border-white/10 pb-5">
          <SectionLabel>Immutable weekly guide / v1</SectionLabel>
          <CardTitle className="mt-3 text-2xl text-white">
            KODEX 200 · Momentum
          </CardTitle>
          <p className="font-mono text-xs text-slate-500">
            069500 · snapshot-20260908 · approved 01:00 UTC
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <p className="text-xs tracking-[0.18em] text-amber-300/70 uppercase">
              Thesis
            </p>
            <p className="mt-2 leading-7 text-slate-200">
              상대강도와 거래 유동성이 유지되며 한국 대형주 추세가 훼손되지
              않았습니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <p className="text-xs text-emerald-300">Trigger</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Thesis 유지 + 위험·보상 개선 시 추가매수 검토
              </p>
            </div>
            <div className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] p-4">
              <p className="text-xs text-rose-300">Invalidation</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                구조적 손상 또는 G2 품질 차단 발생 시 발행 무효
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/[0.055] text-white">
        <CardHeader>
          <SectionLabel>Risk contract</SectionLabel>
          <CardTitle className="mt-3 text-lg text-white">고정된 제약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            '개별 ETF 위험 한도 8%',
            '총 투자 비중 90% 이하',
            '가격·환율·분배금 기여도 분리',
            '원본 수정 금지 · 정정은 새 버전',
          ].map(item => (
            <div
              key={item}
              className="flex items-center gap-3 border-b border-white/10 pb-3 text-slate-300"
            >
              <ShieldCheck className="size-4 text-emerald-300" />
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Portfolio() {
  const [holdings, setHoldings] = useState(initialHoldings)
  const totalValue = useMemo(
    () =>
      holdings.reduce(
        (sum, holding) => sum + holding.shares * holding.price,
        0
      ),
    [holdings]
  )
  const totalGain = useMemo(
    () =>
      holdings.reduce(
        (sum, holding) =>
          sum + holding.shares * holding.price * (holding.change / 100),
        0
      ),
    [holdings]
  )
  const trade = (ticker: string, delta: number) => {
    setHoldings(current =>
      current
        .map(holding =>
          holding.ticker === ticker
            ? { ...holding, shares: Math.max(0, holding.shares + delta) }
            : holding
        )
        .filter(holding => holding.shares > 0)
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-white/10 bg-white/[0.055] text-white">
        <CardHeader className="border-b border-white/10 pb-5">
          <SectionLabel>Paper portfolio / KRW</SectionLabel>
          <CardTitle className="mt-3 text-xl text-white">
            가상 포트폴리오
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Market value</p>
              <p className="mt-1 font-mono text-xl text-white">
                {formatKrw(totalValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Unrealized P/L</p>
              <p className="mt-1 font-mono text-xl text-emerald-300">
                +{formatKrw(totalGain)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cash reserve</p>
              <p className="mt-1 font-mono text-xl text-amber-200">10.0%</p>
            </div>
          </div>
          <div className="space-y-3">
            {holdings.map(holding => (
              <div
                key={holding.ticker}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/10 p-4"
              >
                <div>
                  <p className="font-mono text-xs text-amber-200">
                    {holding.ticker}
                  </p>
                  <p className="mt-1 font-medium text-white">{holding.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-white">
                    {holding.shares} shares
                  </p>
                  <p className="font-mono text-xs text-emerald-300">
                    +{holding.change.toFixed(2)}%
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => trade(holding.ticker, -1)}
                    aria-label={`${holding.ticker} reduce`}
                  >
                    <Minus />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => trade(holding.ticker, 1)}
                    aria-label={`${holding.ticker} add`}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <Database className="size-3" /> Simulation only · no real orders are
            sent
          </p>
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/[0.055] text-white">
        <CardHeader>
          <SectionLabel>Attribution</SectionLabel>
          <CardTitle className="mt-3 text-lg text-white">성과 기여도</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Price</span>
              <span className="font-mono text-emerald-300">+12.8%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[76%] rounded-full bg-emerald-300" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Dividend</span>
              <span className="font-mono text-amber-200">+1.1%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[24%] rounded-full bg-amber-300" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>FX</span>
              <span className="font-mono text-slate-300">0.0%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[2%] rounded-full bg-slate-400" />
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
            모든 성과는 `as_of 2026-09-08` 기준이며 가격·환율·분배금이 분리
            기록됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ProductDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const content = {
    overview: <Overview onNavigate={setActiveTab} />,
    scanner: <Scanner />,
    guide: <Guide />,
    portfolio: <Portfolio />,
  }[activeTab]

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#07111f] text-white">
      <div className="absolute inset-x-0 top-16 -z-0 h-80 bg-[radial-gradient(circle_at_18%_0%,rgba(245,158,11,0.13),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.08),transparent_34%)]" />
      <Container className="relative z-10 py-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>ETF GUIDE / INTERNAL ALPHA</SectionLabel>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              신호를 보고, 근거를 고정하고, 가상으로 검증합니다.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              한국 승인 유니버스의 최신성·품질·전략 버전을 한 화면에서 확인하는
              운영용 투자 가이드입니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />{' '}
            data pipeline healthy
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Signal Guide views"
          className="mb-7 flex flex-wrap gap-2 border-b border-white/10 pb-3"
        >
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === tab.id ? 'bg-amber-300 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          tabIndex={0}
          aria-label={`${activeTab} content`}
        >
          {content}
        </div>
        <footer className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>ruleset strategy-v0.2 · universe korean-etf-universe-v1</span>
          <span className="flex items-center gap-2">
            <FileText className="size-3" /> evidence-backed · simulation only
          </span>
        </footer>
      </Container>
    </main>
  )
}
