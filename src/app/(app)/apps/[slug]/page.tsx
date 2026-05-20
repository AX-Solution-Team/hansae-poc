"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3,
  Activity, Layers, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Download, Package, Ruler, ShoppingBag,
  ClipboardCheck, Factory, Loader2, Bot, RefreshCw,
  FileText, Truck, XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"
import { toast } from "sonner"

/* =================================================================
   Agent Configuration
   ================================================================= */

type AgentConfig = {
  name: string
  desc: string
  steps: string[]
  outputFile: string
  outputSize: string
}

const AGENTS: Record<string, AgentConfig> = {
  "design-zara-trousers": {
    name: "ZARA Trousers 신제품 분석",
    desc: "ZARA 트라우저 카테고리 최신 제품 크롤링 및 트렌드 분석",
    steps: ["브랜드 사이트 크롤링", "제품 데이터 수집", "트렌드 점수 산출", "분석 리포트 생성"],
    outputFile: "zara_trend_products.xlsx", outputSize: "245 KB",
  },
  "design-target-trousers": {
    name: "Target Trousers 신제품 분석",
    desc: "Target 트라우저 카테고리 최신 제품 크롤링 및 트렌드 분석",
    steps: ["브랜드 사이트 크롤링", "제품 데이터 수집", "트렌드 점수 산출", "분석 리포트 생성"],
    outputFile: "target_trend_products.xlsx", outputSize: "238 KB",
  },
  "design-walmart-trousers": {
    name: "Walmart Trousers 신제품 분석",
    desc: "Walmart 트라우저 카테고리 최신 제품 크롤링 및 트렌드 분석",
    steps: ["브랜드 사이트 크롤링", "제품 데이터 수집", "트렌드 점수 산출", "분석 리포트 생성"],
    outputFile: "walmart_trend_products.xlsx", outputSize: "231 KB",
  },
  "design-alvanon": {
    name: "Alvanon 3D Fit 분석",
    desc: "Alvanon 3D 바디 스캔 데이터 기반 핏 분석 및 사이즈 추천",
    steps: ["3D 스캔 데이터 로드", "바디 측정값 분석", "핏 스코어 산출", "사이즈 차트 생성"],
    outputFile: "alvanon_fit_analysis.xlsx", outputSize: "189 KB",
  },
  "design-linesheet": {
    name: "Wholesale Linesheet 생성",
    desc: "시즌별 도매 라인시트 자동 생성 (스타일/가격/MOQ)",
    steps: ["제품 마스터 조회", "가격 정책 적용", "라인시트 구성", "PDF/Excel 생성"],
    outputFile: "wholesale_linesheet_SS25.xlsx", outputSize: "312 KB",
  },
  "po-order-recap": {
    name: "PO 오더리캡 자동화",
    desc: "바이어 PO를 파싱하여 오더리캡 자동 생성",
    steps: ["PO 파일 파싱", "오더 데이터 정규화", "리캡 테이블 구성", "요약 시트 생성"],
    outputFile: "order_recap_2024Q2.xlsx", outputSize: "287 KB",
  },
  "po-pocn": {
    name: "POCN 확인서 처리",
    desc: "PO Change Notice 변경사항 추출 및 확인서 자동 생성",
    steps: ["POCN 데이터 추출", "변경사항 비교(DIFF)", "확인서 생성", "승인 요청 준비"],
    outputFile: "pocn_report_2024Q2.xlsx", outputSize: "156 KB",
  },
  "po-pivot": {
    name: "PO Style × Week 피벗",
    desc: "PO 데이터를 스타일×주차 피벗 테이블로 변환",
    steps: ["PO 데이터 로드", "스타일별 그룹핑", "주차별 집계", "피벗 테이블 생성"],
    outputFile: "po_style_week_pivot.xlsx", outputSize: "198 KB",
  },
  "po-download": {
    name: "바이어 PO 다운로드",
    desc: "바이어 포탈에서 최신 PO를 자동 다운로드 및 정규화",
    steps: ["바이어 포탈 연결", "PO 목록 조회", "신규 PO 다운로드", "데이터 정규화"],
    outputFile: "buyer_po_download_20240520.xlsx", outputSize: "342 KB",
  },
  "po-sample-pdf-excel": {
    name: "PO PDF→Excel 변환",
    desc: "PDF 형식 PO를 구조화된 Excel로 자동 변환",
    steps: ["PDF 파싱", "테이블 영역 인식", "데이터 추출", "Excel 변환"],
    outputFile: "po_converted_from_pdf.xlsx", outputSize: "215 KB",
  },
  "po-trim-order": {
    name: "Trim 발주 대시보드",
    desc: "Trim 자재 발주 현황 및 리드타임 모니터링",
    steps: ["Trim 발주 데이터 수집", "리드타임 분석", "재고 현황 확인", "대시보드 갱신"],
    outputFile: "trim_order_dashboard.xlsx", outputSize: "178 KB",
  },
  "sales-report": {
    name: "일별 매출 리포트",
    desc: "일별/주별/월별 매출 현황 리포트 자동 생성",
    steps: ["매출 데이터 수집", "기간별 집계", "전기 대비 분석", "리포트 생성"],
    outputFile: "daily_sales_report_20240520.xlsx", outputSize: "267 KB",
  },
  "comm-stock-alert": {
    name: "한세실업 주가 알림",
    desc: "한세실업(105630) 주가 모니터링 및 임계값 알림",
    steps: ["시세 데이터 수집", "기술적 지표 계산", "임계값 비교", "알림 생성"],
    outputFile: "stock_alert_report.xlsx", outputSize: "134 KB",
  },
  "prod-inspection": {
    name: "검사 리포트 자동화",
    desc: "AQL 2.5 기준 검사 데이터 수집 및 리포트 자동 생성",
    steps: ["검사 데이터 로드", "AQL 2.5 기준 판정", "불량 유형 분류", "검사 리포트 생성"],
    outputFile: "inspection_report_2024Q2.xlsx", outputSize: "203 KB",
  },
  "prod-erp-monitor": {
    name: "ERP 생산현황 모니터링",
    desc: "ERP 시스템 연동 실시간 생산라인 현황 모니터링",
    steps: ["ERP 시스템 연결", "생산라인 현황 조회", "가동률 분석", "모니터링 대시보드 생성"],
    outputFile: "erp_production_status.xlsx", outputSize: "176 KB",
  },
  "bi-daily": {
    name: "BI Daily 대시보드",
    desc: "한세실업 주가 및 시장 데이터 일일 대시보드",
    steps: ["시장 데이터 수집", "주가 지표 계산", "섹터 비교 분석", "대시보드 갱신"],
    outputFile: "bi_daily_20240520.xlsx", outputSize: "156 KB",
  },
}

/* =================================================================
   Mock Data
   ================================================================= */

const PRODUCTS: Record<string, { style: string; name: string; cat: string; fabric: string; color: string; fob: number; trend: number }[]> = {
  ZARA: [
    { style: "ZR-T-2401", name: "Wide Leg Palazzo", cat: "Trousers", fabric: "Cotton Twill", color: "Navy", fob: 18.5, trend: 92 },
    { style: "ZR-T-2402", name: "Slim Fit Chino", cat: "Trousers", fabric: "Stretch Cotton", color: "Black", fob: 16.8, trend: 88 },
    { style: "ZR-T-2403", name: "Cargo Jogger", cat: "Pants", fabric: "Nylon Blend", color: "Olive", fob: 21.0, trend: 95 },
    { style: "ZR-T-2404", name: "Pleated Dress Pant", cat: "Trousers", fabric: "Poly Blend", color: "Charcoal", fob: 22.5, trend: 79 },
    { style: "ZR-T-2405", name: "Relaxed Straight", cat: "Denim", fabric: "Cotton Denim", color: "Indigo", fob: 19.0, trend: 91 },
    { style: "ZR-T-2406", name: "High Waist Wide", cat: "Trousers", fabric: "Linen Mix", color: "Ivory", fob: 20.0, trend: 86 },
    { style: "ZR-T-2407", name: "Tapered Ankle", cat: "Pants", fabric: "Tech Fabric", color: "Gray", fob: 17.5, trend: 83 },
    { style: "ZR-T-2408", name: "Cropped Flare", cat: "Trousers", fabric: "Cotton Sateen", color: "Tan", fob: 15.0, trend: 77 },
  ],
  TARGET: [
    { style: "TG-T-2401", name: "Essential Chino", cat: "Trousers", fabric: "Cotton Twill", color: "Khaki", fob: 14.5, trend: 84 },
    { style: "TG-T-2402", name: "Athletic Jogger", cat: "Pants", fabric: "Polyester", color: "Black", fob: 12.0, trend: 90 },
    { style: "TG-T-2403", name: "Carpenter Pant", cat: "Pants", fabric: "Canvas", color: "Brown", fob: 16.0, trend: 76 },
    { style: "TG-T-2404", name: "Pull-On Wide Leg", cat: "Trousers", fabric: "Rayon Blend", color: "Navy", fob: 13.5, trend: 82 },
    { style: "TG-T-2405", name: "Stretch Slim", cat: "Trousers", fabric: "Twill", color: "Charcoal", fob: 15.0, trend: 88 },
    { style: "TG-T-2406", name: "Pleated Front", cat: "Trousers", fabric: "Polyester", color: "Gray", fob: 11.5, trend: 71 },
    { style: "TG-T-2407", name: "Cargo Utility", cat: "Pants", fabric: "Cotton", color: "Olive", fob: 17.5, trend: 85 },
    { style: "TG-T-2408", name: "Relaxed Straight", cat: "Denim", fabric: "Denim", color: "Medium Wash", fob: 14.0, trend: 79 },
  ],
  WALMART: [
    { style: "WM-T-2401", name: "Value Chino", cat: "Trousers", fabric: "Cotton", color: "Khaki", fob: 9.5, trend: 72 },
    { style: "WM-T-2402", name: "Basic Cargo", cat: "Pants", fabric: "Polyester", color: "Black", fob: 8.0, trend: 68 },
    { style: "WM-T-2403", name: "Stretch Jegging", cat: "Denim", fabric: "Spandex Mix", color: "Dark Wash", fob: 10.5, trend: 81 },
    { style: "WM-T-2404", name: "Pull-On Pant", cat: "Trousers", fabric: "Rayon", color: "Navy", fob: 7.5, trend: 65 },
    { style: "WM-T-2405", name: "Work Pant", cat: "Pants", fabric: "Canvas", color: "Brown", fob: 11.0, trend: 74 },
    { style: "WM-T-2406", name: "Classic Fit", cat: "Trousers", fabric: "Twill", color: "Gray", fob: 9.0, trend: 70 },
    { style: "WM-T-2407", name: "Relaxed Jean", cat: "Denim", fabric: "Denim", color: "Medium", fob: 12.0, trend: 76 },
    { style: "WM-T-2408", name: "Athletic Short", cat: "Shorts", fabric: "Mesh", color: "Black", fob: 8.5, trend: 69 },
  ],
}

const ALVANON_DATA = [
  { size: "XS", chest: 82, waist: 64, hip: 88, inseam: 74, score: 78, status: "주의" as const },
  { size: "S", chest: 86, waist: 68, hip: 92, inseam: 76, score: 94, status: "적합" as const },
  { size: "M", chest: 90, waist: 72, hip: 96, inseam: 78, score: 96, status: "적합" as const },
  { size: "L", chest: 94, waist: 78, hip: 100, inseam: 79, score: 93, status: "적합" as const },
  { size: "XL", chest: 98, waist: 84, hip: 104, inseam: 80, score: 91, status: "적합" as const },
  { size: "XXL", chest: 104, waist: 90, hip: 110, inseam: 80, score: 85, status: "주의" as const },
]

const LINESHEET_DATA = [
  { style: "LS-2401", desc: "Wide Leg Palazzo", fabric: "Cotton Twill", colors: "Navy / Black / Ivory", sizes: "S–XL", wholesale: 24.5, msrp: 49.99, moq: 500, lead: "45일" },
  { style: "LS-2402", desc: "Slim Chino", fabric: "Stretch Cotton", colors: "Khaki / Black / Gray", sizes: "S–XXL", wholesale: 22.0, msrp: 44.99, moq: 800, lead: "40일" },
  { style: "LS-2403", desc: "Cargo Jogger", fabric: "Nylon Blend", colors: "Olive / Black", sizes: "S–XL", wholesale: 26.0, msrp: 54.99, moq: 600, lead: "50일" },
  { style: "LS-2404", desc: "Pleated Dress", fabric: "Poly Blend", colors: "Charcoal / Navy", sizes: "S–XL", wholesale: 28.0, msrp: 59.99, moq: 400, lead: "45일" },
  { style: "LS-2405", desc: "Relaxed Straight", fabric: "Cotton Denim", colors: "Indigo / Black", sizes: "28–36", wholesale: 23.0, msrp: 46.99, moq: 700, lead: "42일" },
  { style: "LS-2406", desc: "High Waist Wide", fabric: "Linen Mix", colors: "Ivory / Sand", sizes: "S–XL", wholesale: 25.0, msrp: 52.99, moq: 500, lead: "48일" },
  { style: "LS-2407", desc: "Tapered Ankle", fabric: "Tech Fabric", colors: "Gray / Black / Navy", sizes: "S–XXL", wholesale: 21.5, msrp: 42.99, moq: 900, lead: "38일" },
  { style: "LS-2408", desc: "Cropped Flare", fabric: "Cotton Sateen", colors: "Tan / White", sizes: "S–L", wholesale: 19.0, msrp: 38.99, moq: 600, lead: "40일" },
]

const PO_ORDERS = [
  { po: "PO-24050001", style: "ZR-T-2401", desc: "Wide Leg Palazzo", color: "Navy", s: 120, m: 250, l: 200, xl: 80, price: 18.5, delivery: "2024-06-15", status: "CONFIRMED" as const },
  { po: "PO-24050002", style: "ZR-T-2402", desc: "Slim Fit Chino", color: "Black", s: 180, m: 320, l: 280, xl: 120, price: 16.8, delivery: "2024-06-20", status: "CONFIRMED" as const },
  { po: "PO-24050003", style: "ZR-T-2403", desc: "Cargo Jogger", color: "Olive", s: 100, m: 200, l: 180, xl: 70, price: 21.0, delivery: "2024-06-20", status: "PENDING" as const },
  { po: "PO-24050004", style: "ZR-T-2404", desc: "Pleated Dress", color: "Charcoal", s: 80, m: 150, l: 120, xl: 50, price: 22.5, delivery: "2024-06-25", status: "CONFIRMED" as const },
  { po: "PO-24050005", style: "ZR-T-2405", desc: "Relaxed Straight", color: "Indigo", s: 200, m: 350, l: 300, xl: 150, price: 19.0, delivery: "2024-07-01", status: "CONFIRMED" as const },
  { po: "PO-24050006", style: "TG-T-2401", desc: "Essential Chino", color: "Khaki", s: 300, m: 500, l: 450, xl: 200, price: 14.5, delivery: "2024-06-18", status: "CONFIRMED" as const },
  { po: "PO-24050007", style: "TG-T-2402", desc: "Athletic Jogger", color: "Black", s: 250, m: 400, l: 350, xl: 150, price: 12.0, delivery: "2024-06-22", status: "PENDING" as const },
  { po: "PO-24050008", style: "TG-T-2405", desc: "Stretch Slim", color: "Charcoal", s: 150, m: 280, l: 240, xl: 100, price: 15.0, delivery: "2024-07-05", status: "CONFIRMED" as const },
]

const POCN_CHANGES = [
  { po: "PO-24050001", style: "ZR-T-2401", type: "수량변경", field: "Total Qty", before: "650", after: "720", date: "2024-05-18" },
  { po: "PO-24050003", style: "ZR-T-2403", type: "납기변경", field: "Delivery", before: "06/20", after: "07/01", date: "2024-05-17" },
  { po: "PO-24050002", style: "ZR-T-2402", type: "수량변경", field: "M Size", before: "320", after: "380", date: "2024-05-16" },
  { po: "PO-24050005", style: "ZR-T-2405", type: "가격변경", field: "Unit Price", before: "$19.00", after: "$18.50", date: "2024-05-15" },
  { po: "PO-24050006", style: "TG-T-2401", type: "수량변경", field: "Total Qty", before: "1,450", after: "1,200", date: "2024-05-14" },
  { po: "PO-24050004", style: "ZR-T-2404", type: "납기변경", field: "Delivery", before: "06/25", after: "06/30", date: "2024-05-14" },
  { po: "PO-24050007", style: "TG-T-2402", type: "컬러변경", field: "Color", before: "Black", after: "Black/Navy", date: "2024-05-13" },
  { po: "PO-24050008", style: "TG-T-2405", type: "납기변경", field: "Delivery", before: "07/05", after: "07/10", date: "2024-05-12" },
]

const PIVOT_STYLES = ["ZR-T-2401", "ZR-T-2402", "ZR-T-2403", "TG-T-2401", "TG-T-2402"]
const PIVOT_WEEKS = ["W23", "W24", "W25", "W26", "W27", "W28", "W29", "W30"]
const PIVOT_DATA = [
  [80, 120, 150, 200, 180, 140, 100, 80],
  [100, 150, 200, 250, 220, 180, 130, 100],
  [60, 80, 110, 140, 120, 100, 80, 60],
  [150, 200, 280, 350, 300, 250, 200, 150],
  [120, 160, 200, 250, 220, 180, 140, 120],
]

const SALES_DATA = [
  { date: "05/07", value: 2450 }, { date: "05/08", value: 3120 },
  { date: "05/09", value: 2890 }, { date: "05/10", value: 3540 },
  { date: "05/11", value: 1820 }, { date: "05/12", value: 1450 },
  { date: "05/13", value: 3680 }, { date: "05/14", value: 4210 },
  { date: "05/15", value: 3950 }, { date: "05/16", value: 4580 },
  { date: "05/17", value: 3870 }, { date: "05/18", value: 2150 },
  { date: "05/19", value: 1980 }, { date: "05/20", value: 4120 },
]

const TRIM_DATA = [
  { date: "05/07", ordered: 3200, received: 2800 }, { date: "05/08", ordered: 2900, received: 2600 },
  { date: "05/09", ordered: 3500, received: 3100 }, { date: "05/10", ordered: 4100, received: 3800 },
  { date: "05/11", ordered: 2100, received: 2000 }, { date: "05/12", ordered: 1800, received: 1700 },
  { date: "05/13", ordered: 3800, received: 3500 }, { date: "05/14", ordered: 4500, received: 4200 },
  { date: "05/15", ordered: 4200, received: 3900 }, { date: "05/16", ordered: 4800, received: 4500 },
  { date: "05/17", ordered: 4100, received: 3800 }, { date: "05/18", ordered: 2300, received: 2100 },
  { date: "05/19", ordered: 2000, received: 1900 }, { date: "05/20", ordered: 4300, received: 4000 },
]

const STOCK_DATA = [
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

const INSPECTION_DATA = [
  { lot: "LOT-001", line: "Line 3", order: "ORD-2401", style: "Wide Leg Palazzo", sample: 50, major: 1, minor: 2, critical: 0, result: "PASS" as const },
  { lot: "LOT-002", line: "Line 1", order: "ORD-2402", style: "Slim Fit Chino", sample: 80, major: 3, minor: 5, critical: 1, result: "FAIL" as const },
  { lot: "LOT-003", line: "Line 2", order: "ORD-2403", style: "Cargo Jogger", sample: 50, major: 0, minor: 1, critical: 0, result: "PASS" as const },
  { lot: "LOT-004", line: "Line 3", order: "ORD-2404", style: "Pleated Dress", sample: 50, major: 1, minor: 3, critical: 0, result: "PASS" as const },
  { lot: "LOT-005", line: "Line 1", order: "ORD-2405", style: "Relaxed Straight", sample: 80, major: 4, minor: 6, critical: 0, result: "FAIL" as const },
  { lot: "LOT-006", line: "Line 4", order: "ORD-2406", style: "Essential Chino", sample: 50, major: 0, minor: 2, critical: 0, result: "PASS" as const },
  { lot: "LOT-007", line: "Line 2", order: "ORD-2407", style: "Athletic Jogger", sample: 80, major: 1, minor: 3, critical: 0, result: "PASS" as const },
  { lot: "LOT-008", line: "Line 4", order: "ORD-2408", style: "Stretch Slim", sample: 50, major: 2, minor: 4, critical: 1, result: "FAIL" as const },
]

const ERP_DATA = [
  { line: "Line 1", order: "ORD-2401", style: "Wide Leg Palazzo", planned: 2000, completed: 1680, status: "가동중" as const, eta: "05/28" },
  { line: "Line 2", order: "ORD-2402", style: "Slim Fit Chino", planned: 3000, completed: 2850, status: "완료임박" as const, eta: "05/22" },
  { line: "Line 3", order: "ORD-2403", style: "Cargo Jogger", planned: 1500, completed: 900, status: "가동중" as const, eta: "06/05" },
  { line: "Line 4", order: "ORD-2404", style: "Pleated Dress", planned: 1200, completed: 1200, status: "완료" as const, eta: "05/18" },
  { line: "Line 5", order: "ORD-2405", style: "Relaxed Straight", planned: 2500, completed: 1750, status: "가동중" as const, eta: "06/01" },
  { line: "Line 6", order: "ORD-2406", style: "Essential Chino", planned: 4000, completed: 3600, status: "완료임박" as const, eta: "05/24" },
  { line: "Line 7", order: "ORD-2407", style: "Athletic Jogger", planned: 2000, completed: 400, status: "지연" as const, eta: "06/15" },
  { line: "Line 8", order: "ORD-2408", style: "Stretch Slim", planned: 1800, completed: 1080, status: "가동중" as const, eta: "05/30" },
]

const TT = { borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" } as const

/* =================================================================
   Shared Components
   ================================================================= */

type KpiItem = { label: string; value: string; change?: string; positive?: boolean; icon: React.ElementType }

function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className={cn("grid gap-4", items.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
      {items.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  {kpi.change && (
                    <div className="flex items-center gap-1 mt-1">
                      {kpi.positive ? <TrendingUp className="w-3 h-3 text-green-600" /> : <TrendingDown className="w-3 h-3 text-red-600" />}
                      <span className={cn("text-xs font-medium", kpi.positive ? "text-green-600" : "text-red-600")}>{kpi.change}</span>
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
      })}
    </div>
  )
}

function OutputFile({ name, size }: { name: string; size: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-400">{size} · 방금 생성됨</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success("파일 다운로드를 시작합니다 (데모)")}>
          <Download className="w-3.5 h-3.5" />
          다운로드
        </Button>
      </CardContent>
    </Card>
  )
}

function ProcessingView({ config, onDone }: { config: AgentConfig; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const total = config.steps.length

  useEffect(() => {
    const delay = step < total ? 700 : 500
    const timer = setTimeout(() => {
      if (step < total) setStep((s) => s + 1)
      else onDone()
    }, delay)
    return () => clearTimeout(timer)
  }, [step, total, onDone])

  return (
    <div className="flex-1 flex items-center justify-center bg-hansae-surface min-h-[600px]">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-hansae-navy/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-7 h-7 text-hansae-navy" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{config.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{config.desc}</p>
            </div>
            <div className="space-y-3 mb-6">
              {config.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i < step ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : i === step ? (
                    <Loader2 className="w-5 h-5 text-hansae-navy animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                  )}
                  <span className={cn(
                    "text-sm",
                    i < step ? "text-gray-900 font-medium" : i === step ? "text-hansae-navy font-medium" : "text-gray-400"
                  )}>{s}</span>
                </div>
              ))}
            </div>
            <Progress value={(step / total) * 100} className="h-2" />
            <p className="text-xs text-center text-gray-400 mt-2">
              {step < total ? `처리 중... (${step + 1}/${total})` : "완료!"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardHeader({ config, onRerun }: { config: AgentConfig; onRerun: () => void }) {
  return (
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
            <h1 className="text-xl font-bold text-gray-900">{config.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{config.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onRerun}>
              <RefreshCw className="w-3.5 h-3.5" />
              재실행
            </Button>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">실행 완료</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =================================================================
   Dashboard: Design Crawl Brand
   ================================================================= */

function DesignCrawlDashboard({ brand, config }: { brand: string; config: AgentConfig }) {
  const products = PRODUCTS[brand] || PRODUCTS.ZARA
  const avgTrend = Math.round(products.reduce((s, p) => s + p.trend, 0) / products.length)
  const avgFob = (products.reduce((s, p) => s + p.fob, 0) / products.length).toFixed(1)

  return (
    <>
      <KpiGrid items={[
        { label: "분석 제품수", value: `${products.length}개`, icon: Package },
        { label: "평균 트렌드 점수", value: `${avgTrend}점`, change: "+5.2 vs 전월", positive: true, icon: TrendingUp },
        { label: "평균 FOB", value: `$${avgFob}`, icon: DollarSign },
        { label: "상위 카테고리", value: "Trousers", icon: ShoppingBag },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">제품별 트렌드 점수</h3>
          <p className="text-xs text-gray-500 mb-4">{brand} Trousers 카테고리</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="style" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${v}점`, "트렌드"]} />
                <Bar dataKey="trend" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">크롤링 제품 목록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["Style", "제품명", "카테고리", "원단", "컬러", "FOB", "트렌드"].map(h => <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">{h}</th>)}
              </tr></thead>
              <tbody>{products.map(p => (
                <tr key={p.style} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-600">{p.style}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-900">{p.name}</td>
                  <td className="py-2.5 px-4 text-gray-600">{p.cat}</td>
                  <td className="py-2.5 px-4 text-gray-600">{p.fabric}</td>
                  <td className="py-2.5 px-4 text-gray-600">{p.color}</td>
                  <td className="py-2.5 px-4 text-gray-700">${p.fob.toFixed(2)}</td>
                  <td className="py-2.5 px-4"><Badge className={cn("text-xs", p.trend >= 85 ? "bg-green-50 text-green-700" : p.trend >= 70 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700")} variant="outline">{p.trend}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Alvanon 3D Fit
   ================================================================= */

function AlvanonDashboard({ config }: { config: AgentConfig }) {
  const passCount = ALVANON_DATA.filter(d => d.status === "적합").length
  const avgScore = Math.round(ALVANON_DATA.reduce((s, d) => s + d.score, 0) / ALVANON_DATA.length)

  return (
    <>
      <KpiGrid items={[
        { label: "분석 사이즈", value: `${ALVANON_DATA.length}개`, icon: Ruler },
        { label: "평균 핏 점수", value: `${avgScore}점`, change: "+3.1 vs 이전 시즌", positive: true, icon: Activity },
        { label: "적합 판정", value: `${passCount}/${ALVANON_DATA.length}`, icon: CheckCircle2 },
        { label: "주의 사이즈", value: ALVANON_DATA.filter(d => d.status === "주의").map(d => d.size).join(", "), icon: AlertTriangle },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">사이즈별 핏 점수</h3>
          <p className="text-xs text-gray-500 mb-4">Alvanon 3D 바디 스캔 기준 (100점 만점)</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ALVANON_DATA} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="size" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${v}점`, "핏 점수"]} />
                <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="5 5" />
                <Bar dataKey="score" fill="#0EA5E9" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">사이즈별 측정값</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["사이즈", "가슴(cm)", "허리(cm)", "힙(cm)", "인심(cm)", "핏 점수", "판정"].map(h => <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">{h}</th>)}
              </tr></thead>
              <tbody>{ALVANON_DATA.map(d => (
                <tr key={d.size} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-4 font-bold text-gray-900">{d.size}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.chest}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.waist}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.hip}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.inseam}</td>
                  <td className="py-2.5 px-4 font-medium">{d.score}</td>
                  <td className="py-2.5 px-4"><Badge className={cn("text-xs", d.status === "적합" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")} variant="outline">{d.status}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Linesheet
   ================================================================= */

function LinesheetDashboard({ config }: { config: AgentConfig }) {
  const avgW = (LINESHEET_DATA.reduce((s, d) => s + d.wholesale, 0) / LINESHEET_DATA.length).toFixed(1)
  const totalMoq = LINESHEET_DATA.reduce((s, d) => s + d.moq, 0)

  return (
    <>
      <KpiGrid items={[
        { label: "총 스타일", value: `${LINESHEET_DATA.length}개`, icon: ShoppingBag },
        { label: "평균 도매가", value: `$${avgW}`, icon: DollarSign },
        { label: "총 MOQ", value: totalMoq.toLocaleString(), icon: Package },
        { label: "시즌", value: "SS 2025", icon: Layers },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Wholesale Linesheet — SS 2025</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["Style", "제품명", "원단", "컬러 옵션", "사이즈", "도매가", "MSRP", "MOQ", "리드타임"].map(h => <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>{LINESHEET_DATA.map(d => (
                <tr key={d.style} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-600">{d.style}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-900">{d.desc}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.fabric}</td>
                  <td className="py-2.5 px-4 text-gray-600 text-xs">{d.colors}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.sizes}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-900">${d.wholesale.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-gray-600">${d.msrp}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.moq}</td>
                  <td className="py-2.5 px-4 text-gray-600">{d.lead}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: PO Order Recap / Download / PDF-Excel
   ================================================================= */

function PoRecapDashboard({ slug, config }: { slug: string; config: AgentConfig }) {
  const totalQty = PO_ORDERS.reduce((s, o) => s + o.s + o.m + o.l + o.xl, 0)
  const totalAmt = PO_ORDERS.reduce((s, o) => s + (o.s + o.m + o.l + o.xl) * o.price, 0)

  return (
    <>
      <KpiGrid items={[
        { label: "PO 라인수", value: `${PO_ORDERS.length}건`, icon: FileText },
        { label: "총 수량", value: totalQty.toLocaleString(), change: "+8.3% vs 전월", positive: true, icon: Package },
        { label: "총 금액", value: `$${Math.round(totalAmt).toLocaleString()}`, icon: DollarSign },
        { label: "평균 단가", value: `$${(totalAmt / totalQty).toFixed(2)}`, icon: BarChart3 },
      ]} />
      {slug === "po-sample-pdf-excel" && (
        <Card className="border-0 shadow-sm bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">PDF 변환 완료</p>
              <p className="text-xs text-blue-600">3페이지 · 2개 테이블 추출 · 변환 정확도 98.5% · 처리시간 2.3초</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">스타일별 오더 수량</h3>
          <p className="text-xs text-gray-500 mb-4">{slug === "po-download" ? "바이어 포탈에서 다운로드된 PO" : slug === "po-sample-pdf-excel" ? "PDF에서 변환된 PO" : "파싱된 PO 오더리캡"}</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PO_ORDERS.map(o => ({ style: o.style, qty: o.s + o.m + o.l + o.xl }))} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="style" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} formatter={(v) => [Number(v).toLocaleString(), "수량"]} />
                <Bar dataKey="qty" fill="#1E3A5F" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">오더 상세</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["PO#", "Style", "제품명", "컬러", "S", "M", "L", "XL", "합계", "단가", "금액", "납기", "상태"].map(h => <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>{PO_ORDERS.map(o => {
                const total = o.s + o.m + o.l + o.xl
                return (
                  <tr key={o.po} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{o.po}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{o.style}</td>
                    <td className="py-2.5 px-3 text-gray-900">{o.desc}</td>
                    <td className="py-2.5 px-3 text-gray-600">{o.color}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-right">{o.s}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-right">{o.m}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-right">{o.l}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-right">{o.xl}</td>
                    <td className="py-2.5 px-3 font-medium text-right">{total.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-gray-700">${o.price.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-medium">${(total * o.price).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-xs">{o.delivery}</td>
                    <td className="py-2.5 px-3"><Badge className={cn("text-xs", o.status === "CONFIRMED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")} variant="outline">{o.status}</Badge></td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: POCN
   ================================================================= */

function PocnDashboard({ config }: { config: AgentConfig }) {
  const qtyC = POCN_CHANGES.filter(c => c.type === "수량변경").length
  const delC = POCN_CHANGES.filter(c => c.type === "납기변경").length
  const etcC = POCN_CHANGES.length - qtyC - delC

  return (
    <>
      <KpiGrid items={[
        { label: "변경 건수", value: `${POCN_CHANGES.length}건`, icon: ClipboardCheck },
        { label: "수량 변경", value: `${qtyC}건`, icon: Package },
        { label: "납기 변경", value: `${delC}건`, icon: Truck },
        { label: "기타 변경", value: `${etcC}건`, icon: Activity },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">POCN 변경사항</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["PO#", "Style", "변경 유형", "항목", "변경 전", "변경 후", "일자"].map(h => <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">{h}</th>)}
              </tr></thead>
              <tbody>{POCN_CHANGES.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-600">{c.po}</td>
                  <td className="py-2.5 px-4 font-mono text-xs">{c.style}</td>
                  <td className="py-2.5 px-4"><Badge className={cn("text-xs", c.type === "수량변경" ? "bg-blue-50 text-blue-700" : c.type === "납기변경" ? "bg-purple-50 text-purple-700" : c.type === "가격변경" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")} variant="outline">{c.type}</Badge></td>
                  <td className="py-2.5 px-4 text-gray-600">{c.field}</td>
                  <td className="py-2.5 px-4 text-red-600 line-through">{c.before}</td>
                  <td className="py-2.5 px-4 text-green-700 font-medium">{c.after}</td>
                  <td className="py-2.5 px-4 text-gray-500 text-xs">{c.date}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: PO Pivot
   ================================================================= */

function PivotDashboard({ config }: { config: AgentConfig }) {
  const totalQty = PIVOT_DATA.flat().reduce((a, b) => a + b, 0)

  return (
    <>
      <KpiGrid items={[
        { label: "스타일수", value: `${PIVOT_STYLES.length}`, icon: ShoppingBag },
        { label: "기간", value: `${PIVOT_WEEKS.length}주차`, icon: Layers },
        { label: "총 계획 수량", value: totalQty.toLocaleString(), icon: Package },
        { label: "주간 평균", value: Math.round(totalQty / PIVOT_WEEKS.length).toLocaleString(), icon: BarChart3 },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Style × Week 피벗 테이블</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Style</th>
                {PIVOT_WEEKS.map(w => <th key={w} className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">{w}</th>)}
                <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-700">합계</th>
              </tr></thead>
              <tbody>
                {PIVOT_STYLES.map((style, si) => {
                  const row = PIVOT_DATA[si]
                  return (
                    <tr key={style} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-4 font-mono text-xs font-medium text-gray-900">{style}</td>
                      {row.map((val, wi) => <td key={wi} className={cn("py-2.5 px-3 text-right text-gray-600", val >= 250 && "text-hansae-navy font-medium")}>{val}</td>)}
                      <td className="py-2.5 px-4 text-right font-bold text-gray-900">{row.reduce((a, b) => a + b, 0).toLocaleString()}</td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50/80 font-bold">
                  <td className="py-2.5 px-4 text-xs text-gray-700">합계</td>
                  {PIVOT_WEEKS.map((_, wi) => <td key={wi} className="py-2.5 px-3 text-right text-gray-700">{PIVOT_DATA.reduce((s, row) => s + row[wi], 0)}</td>)}
                  <td className="py-2.5 px-4 text-right text-gray-900">{totalQty.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Trim Order
   ================================================================= */

function TrimDashboard({ config }: { config: AgentConfig }) {
  const totalOrd = TRIM_DATA.reduce((s, d) => s + d.ordered, 0)
  const totalRec = TRIM_DATA.reduce((s, d) => s + d.received, 0)

  return (
    <>
      <KpiGrid items={[
        { label: "총 발주량", value: totalOrd.toLocaleString(), icon: Package },
        { label: "총 입고량", value: totalRec.toLocaleString(), icon: Truck },
        { label: "입고율", value: `${((totalRec / totalOrd) * 100).toFixed(1)}%`, change: "+2.1% vs 전주", positive: true, icon: Activity },
        { label: "미입고", value: (totalOrd - totalRec).toLocaleString(), icon: AlertTriangle },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Trim 발주 vs 입고 추이</h3>
          <p className="text-xs text-gray-500 mb-4">14일간 현황</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRIM_DATA} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ordered" name="발주" fill="#1E3A5F" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="received" name="입고" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Sales Report
   ================================================================= */

function SalesDashboard({ config }: { config: AgentConfig }) {
  const today = SALES_DATA[SALES_DATA.length - 1].value
  const week = SALES_DATA.slice(-7).reduce((s, d) => s + d.value, 0)
  const total = SALES_DATA.reduce((s, d) => s + d.value, 0)

  return (
    <>
      <KpiGrid items={[
        { label: "오늘 매출", value: `₩${today.toLocaleString()}만`, change: "+12.3% vs 어제", positive: true, icon: DollarSign },
        { label: "주간 매출", value: `₩${week.toLocaleString()}만`, change: "+8.7% vs 전주", positive: true, icon: BarChart3 },
        { label: "14일 매출", value: `₩${total.toLocaleString()}만`, change: "-2.1% vs 전기", positive: false, icon: TrendingUp },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">14일 매출 추이</h3>
          <p className="text-xs text-gray-500 mb-4">단위: 만원</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_DATA} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${Number(v).toLocaleString()} 만원`, "매출"]} />
                <Bar dataKey="value" fill="#1E3A5F" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Stock Alert
   ================================================================= */

function StockAlertDashboard({ config }: { config: AgentConfig }) {
  const latest = STOCK_DATA[STOCK_DATA.length - 1]
  const prev = STOCK_DATA[STOCK_DATA.length - 2]
  const change = ((latest.close - prev.close) / prev.close * 100).toFixed(1)
  const first = STOCK_DATA[0]
  const period = ((latest.close - first.close) / first.close * 100).toFixed(1)
  const threshold = 22000

  return (
    <>
      <KpiGrid items={[
        { label: "현재가", value: `${latest.close.toLocaleString()}원`, change: `${change}% vs 전일`, positive: Number(change) >= 0, icon: DollarSign },
        { label: "30일 등락", value: `${Number(period) >= 0 ? "+" : ""}${period}%`, positive: Number(period) >= 0, icon: TrendingUp },
        { label: "알림 임계값", value: `${threshold.toLocaleString()}원`, icon: AlertTriangle },
        { label: "상태", value: latest.close >= threshold ? "임계값 도달" : "정상 범위", icon: Activity },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">30일 주가 추이 — 한세실업 (105630)</h3>
          <p className="text-xs text-gray-500 mb-4">알림 임계값: {threshold.toLocaleString()}원 (빨간 점선)</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={STOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis domain={["dataMin - 500", "dataMax + 500"]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${Number(v).toLocaleString()}원`, "종가"]} />
                <ReferenceLine y={threshold} stroke="#EF4444" strokeDasharray="8 4" />
                <Line type="monotone" dataKey="close" stroke="#1E3A5F" strokeWidth={2} dot={{ fill: "#1E3A5F", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Inspection
   ================================================================= */

function InspectionDashboard({ config }: { config: AgentConfig }) {
  const passCount = INSPECTION_DATA.filter(d => d.result === "PASS").length
  const totalDefects = INSPECTION_DATA.reduce((s, d) => s + d.major + d.minor + d.critical, 0)
  const criticalCount = INSPECTION_DATA.reduce((s, d) => s + d.critical, 0)

  return (
    <>
      <KpiGrid items={[
        { label: "검사 LOT", value: `${INSPECTION_DATA.length}건`, icon: ClipboardCheck },
        { label: "합격률", value: `${((passCount / INSPECTION_DATA.length) * 100).toFixed(1)}%`, change: "-5.1% vs 전월", positive: false, icon: Activity },
        { label: "총 불량", value: `${totalDefects}건`, icon: XCircle },
        { label: "Critical", value: `${criticalCount}건`, icon: AlertTriangle },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">LOT별 불량 현황</h3>
          <p className="text-xs text-gray-500 mb-4">AQL 2.5 기준 (스택 차트)</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INSPECTION_DATA.map(d => ({ lot: d.lot, minor: d.minor, major: d.major, critical: d.critical }))} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="lot" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="minor" name="Minor" stackId="a" fill="#FBBF24" maxBarSize={30} />
                <Bar dataKey="major" name="Major" stackId="a" fill="#F97316" maxBarSize={30} />
                <Bar dataKey="critical" name="Critical" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">검사 LOT 상세</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["LOT", "라인", "오더", "스타일", "샘플", "Major", "Minor", "Critical", "판정"].map(h => <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">{h}</th>)}
              </tr></thead>
              <tbody>{INSPECTION_DATA.map(d => (
                <tr key={d.lot} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-3 font-mono text-xs font-medium">{d.lot}</td>
                  <td className="py-2.5 px-3 text-gray-600">{d.line}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{d.order}</td>
                  <td className="py-2.5 px-3 text-gray-900">{d.style}</td>
                  <td className="py-2.5 px-3 text-gray-600">{d.sample}</td>
                  <td className="py-2.5 px-3 text-orange-600 font-medium">{d.major}</td>
                  <td className="py-2.5 px-3 text-yellow-600">{d.minor}</td>
                  <td className="py-2.5 px-3 text-red-600 font-bold">{d.critical}</td>
                  <td className="py-2.5 px-3"><Badge className={cn("text-xs", d.result === "PASS" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")} variant="outline">{d.result}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: ERP Monitor
   ================================================================= */

function ErpMonitorDashboard({ config }: { config: AgentConfig }) {
  const avgRate = (ERP_DATA.reduce((s, d) => s + (d.completed / d.planned) * 100, 0) / ERP_DATA.length).toFixed(1)
  const delayedLines = ERP_DATA.filter(d => d.status === "지연").length
  const totalWip = ERP_DATA.reduce((s, d) => s + (d.planned - d.completed), 0)

  return (
    <>
      <KpiGrid items={[
        { label: "생산라인", value: `${ERP_DATA.length}개`, icon: Factory },
        { label: "평균 가동률", value: `${avgRate}%`, change: "+1.5% vs 전주", positive: true, icon: Activity },
        { label: "지연 라인", value: `${delayedLines}개`, icon: AlertTriangle },
        { label: "잔여 WIP", value: totalWip.toLocaleString(), icon: Package },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">라인별 진행률</h3>
          <p className="text-xs text-gray-500 mb-4">계획 대비 완료율 (%)</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ERP_DATA.map(d => ({ line: d.line, rate: Math.round((d.completed / d.planned) * 100) }))} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="line" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} width={55} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${v}%`, "진행률"]} />
                <Bar dataKey="rate" fill="#0D9488" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">생산라인 현황</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["라인", "오더", "스타일", "계획", "완료", "진행률", "상태", "ETA"].map(h => <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">{h}</th>)}
              </tr></thead>
              <tbody>{ERP_DATA.map(d => {
                const rate = Math.round((d.completed / d.planned) * 100)
                return (
                  <tr key={d.line} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-medium text-gray-900">{d.line}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-600">{d.order}</td>
                    <td className="py-2.5 px-4 text-gray-700">{d.style}</td>
                    <td className="py-2.5 px-4 text-gray-600 text-right">{d.planned.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-gray-600 text-right">{d.completed.toLocaleString()}</td>
                    <td className="py-3 px-4 w-[120px]">
                      <div className="flex items-center gap-2">
                        <Progress value={rate} className="h-2 flex-1" />
                        <span className="text-xs text-gray-600 w-8">{rate}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4"><Badge className={cn("text-xs", d.status === "완료" ? "bg-green-50 text-green-700" : d.status === "완료임박" ? "bg-blue-50 text-blue-700" : d.status === "가동중" ? "bg-gray-100 text-gray-700" : "bg-red-50 text-red-700")} variant="outline">{d.status}</Badge></td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs">{d.eta}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: BI Daily
   ================================================================= */

function BiDashboard({ config }: { config: AgentConfig }) {
  const latest = STOCK_DATA[STOCK_DATA.length - 1]
  const prev = STOCK_DATA[STOCK_DATA.length - 2]
  const change = ((latest.close - prev.close) / prev.close * 100).toFixed(1)
  const first = STOCK_DATA[0]
  const period = ((latest.close - first.close) / first.close * 100).toFixed(1)

  return (
    <>
      <KpiGrid items={[
        { label: "종가", value: latest.close.toLocaleString(), change: `${change}% vs 전일`, positive: Number(change) >= 0, icon: DollarSign },
        { label: "30일 등락률", value: `${Number(period) >= 0 ? "+" : ""}${period}%`, positive: Number(period) >= 0, icon: TrendingUp },
        { label: "거래량", value: "342,580", change: "+23.4% vs 전일", positive: true, icon: Activity },
        { label: "시가총액", value: "5,142억", change: "+1.2% vs 전주", positive: true, icon: Layers },
      ]} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">30일 주가 추이</h3>
              <p className="text-xs text-gray-500 mt-0.5">한세실업 (105630) 종가 기준</p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">+{period}%</Badge>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={STOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis domain={["dataMin - 500", "dataMax + 500"]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${Number(v).toLocaleString()} 원`, "종가"]} />
                <Line type="monotone" dataKey="close" stroke="#C41E3A" strokeWidth={2} dot={{ fill: "#C41E3A", r: 3 }} activeDot={{ r: 5, fill: "#C41E3A" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Router + Main Page
   ================================================================= */

function DashboardRouter({ slug, config }: { slug: string; config: AgentConfig }) {
  if (slug.startsWith("design-") && slug.endsWith("-trousers")) {
    const brand = slug.includes("zara") ? "ZARA" : slug.includes("target") ? "TARGET" : "WALMART"
    return <DesignCrawlDashboard brand={brand} config={config} />
  }
  switch (slug) {
    case "design-alvanon": return <AlvanonDashboard config={config} />
    case "design-linesheet": return <LinesheetDashboard config={config} />
    case "po-order-recap":
    case "po-download":
    case "po-sample-pdf-excel": return <PoRecapDashboard slug={slug} config={config} />
    case "po-pocn": return <PocnDashboard config={config} />
    case "po-pivot": return <PivotDashboard config={config} />
    case "po-trim-order": return <TrimDashboard config={config} />
    case "sales-report": return <SalesDashboard config={config} />
    case "comm-stock-alert": return <StockAlertDashboard config={config} />
    case "prod-inspection": return <InspectionDashboard config={config} />
    case "prod-erp-monitor": return <ErpMonitorDashboard config={config} />
    case "bi-daily": return <BiDashboard config={config} />
    default: return <div className="p-8 text-center text-gray-500">대시보드를 준비 중입니다</div>
  }
}

export default function AppDashboardPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const config = AGENTS[slug]
  const [ready, setReady] = useState(false)

  const handleDone = useCallback(() => {
    setReady(true)
    toast.success("에이전트 실행이 완료되었습니다")
  }, [])

  const handleRerun = useCallback(() => {
    setReady(false)
  }, [])

  if (!config) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-gray-200 px-8 py-5">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500"><ArrowLeft className="w-3.5 h-3.5" />마켓플레이스로 돌아가기</Button>
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">이 에이전트에 대한 전용 페이지가 없습니다: {slug}</p>
          <Link href="/marketplace" className="mt-4"><Button variant="outline" size="sm">마켓플레이스로 이동</Button></Link>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex flex-col h-full">
        <ProcessingView config={config} onDone={handleDone} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader config={config} onRerun={handleRerun} />
      <div className="flex-1 overflow-y-auto bg-hansae-surface p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <DashboardRouter slug={slug} config={config} />
        </div>
      </div>
    </div>
  )
}
