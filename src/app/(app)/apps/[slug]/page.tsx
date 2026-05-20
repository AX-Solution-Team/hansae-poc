"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

/* ---- Mock Data: Sales ---- */
const SALES_14_DAYS = [
  { date: "05/07", value: 2450 },
  { date: "05/08", value: 3120 },
  { date: "05/09", value: 2890 },
  { date: "05/10", value: 3540 },
  { date: "05/11", value: 1820 },
  { date: "05/12", value: 1450 },
  { date: "05/13", value: 3680 },
  { date: "05/14", value: 4210 },
  { date: "05/15", value: 3950 },
  { date: "05/16", value: 4580 },
  { date: "05/17", value: 3870 },
  { date: "05/18", value: 2150 },
  { date: "05/19", value: 1980 },
  { date: "05/20", value: 4120 },
]

/* ---- Mock Data: BI (Stock) ---- */
const STOCK_30_DAYS = [
  { date: "04/21", close: 18200 }, { date: "04/22", close: 18450 },
  { date: "04/23", close: 18100 }, { date: "04/24", close: 18350 },
  { date: "04/25", close: 18600 }, { date: "04/28", close: 18900 },
  { date: "04/29", close: 19100 }, { date: "04/30", close: 18750 },
  { date: "05/02", close: 19200 }, { date: "05/07", close: 19450 },
  { date: "05/08", close: 19800 }, { date: "05/09", close: 19650 },
  { date: "05/10", close: 20100 }, { date: "05/11", close: 19900 },
  { date: "05/12", close: 20350 }, { date: "05/13", close: 20550 },
  { date: "05/14", close: 20200 }, { date: "05/15", close: 20800 },
  { date: "05/16", close: 21100 }, { date: "05/17", close: 20950 },
  { date: "05/18", close: 21300 }, { date: "05/19", close: 21550 },
  { date: "05/20", close: 21400 },
]

type KpiCard = {
  label: string
  value: string
  change?: string
  positive?: boolean
  icon: React.ElementType
}

function KpiCardComponent({ kpi }: { kpi: KpiCard }) {
  const Icon = kpi.icon
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            {kpi.change && (
              <div className="flex items-center gap-1 mt-1">
                {kpi.positive ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    kpi.positive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {kpi.change}
                </span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-hansae-navy/5 flex items-center justify-center">
            <Icon className="w-5 h-5 text-hansae-navy" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SalesDashboard({ slug }: { slug: string }) {
  const salesKpis: KpiCard[] = [
    {
      label: "오늘 매출",
      value: "W 4,120만",
      change: "+12.3% vs 어제",
      positive: true,
      icon: DollarSign,
    },
    {
      label: "주간 매출",
      value: "W 24,860만",
      change: "+8.7% vs 전주",
      positive: true,
      icon: BarChart3,
    },
    {
      label: "월간 매출",
      value: "W 89,420만",
      change: "-2.1% vs 전월",
      positive: false,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {salesKpis.map((kpi) => (
          <KpiCardComponent key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">14일 매출 추이</h3>
              <p className="text-xs text-gray-500 mt-0.5">단위: 만원</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {slug}
            </Badge>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_14_DAYS} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString()} 만원`, "매출"]}
                />
                <Bar
                  dataKey="value"
                  fill="#1E3A5F"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BiDashboard() {
  const biKpis: KpiCard[] = [
    {
      label: "종가",
      value: "21,400",
      change: "-0.7% vs 전일",
      positive: false,
      icon: DollarSign,
    },
    {
      label: "등락률",
      value: "+17.6%",
      change: "30일 기준",
      positive: true,
      icon: TrendingUp,
    },
    {
      label: "거래량",
      value: "342,580",
      change: "+23.4% vs 전일",
      positive: true,
      icon: Activity,
    },
    {
      label: "시가총액",
      value: "5,142억",
      change: "+1.2% vs 전주",
      positive: true,
      icon: Layers,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {biKpis.map((kpi) => (
          <KpiCardComponent key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Line Chart */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">30일 주가 추이</h3>
              <p className="text-xs text-gray-500 mt-0.5">한세실업 (105630) 종가 기준</p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
              +17.6%
            </Badge>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={STOCK_30_DAYS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  domain={["dataMin - 500", "dataMax + 500"]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString()} 원`, "종가"]}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#C41E3A"
                  strokeWidth={2}
                  dot={{ fill: "#C41E3A", r: 3 }}
                  activeDot={{ r: 5, fill: "#C41E3A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AppDashboardPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const isBi = slug === "bi-daily"
  const isSales = slug === "sales-report" || slug === "po-trim-order"

  const title = isBi
    ? "BI Daily — 한세실업 (105630)"
    : `Sales Report — ${slug}`

  return (
    <div className="flex flex-col h-full">
      {/* Custom Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-6xl mx-auto">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500 hover:text-gray-900 -ml-2 mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />
              마켓플레이스로 돌아가기
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isBi
                  ? "한세실업 주가 및 시장 데이터 대시보드"
                  : "매출 현황 및 트렌드 분석 대시보드"}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-green-50 text-green-700 border-green-200"
            >
              Live
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-hansae-surface p-8">
        <div className="max-w-6xl mx-auto">
          {isBi ? (
            <BiDashboard />
          ) : isSales ? (
            <SalesDashboard slug={slug} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">
                이 슬러그에 해당하는 대시보드가 없습니다: {slug}
              </p>
              <Link href="/marketplace" className="mt-4">
                <Button variant="outline" size="sm">
                  마켓플레이스로 이동
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
