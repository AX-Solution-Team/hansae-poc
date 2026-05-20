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
  FileText, Truck, XCircle, Clock, Tag, Eye,
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
  "fabric-cost-calculator": {
    name: "원단 단가 계산 자동화",
    desc: "복잡한 원단 스펙을 입력하면 최신 원사 가격과 공임 데이터를 반영하여 정확한 예상 단가를 산출",
    steps: ["원단 스펙 분석", "원사 시세 조회", "공임 계산", "최적 소싱처 추천"],
    outputFile: "fabric_cost_estimate.xlsx", outputSize: "98 KB",
  },
  "design-techpack": {
    name: "Tech Pack 데이터 추출",
    desc: "디자이너의 Tech Pack을 AI가 시각적으로 이해하고, BOM을 자동 생성",
    steps: ["문서 스캐닝", "멀티모달 분석", "BOM 데이터 추출", "사양 검증"],
    outputFile: "techpack_bom_extracted.xlsx", outputSize: "145 KB",
  },
  "comm-buyer-email": {
    name: "바이어 메일 자동 응대",
    desc: "바이어의 문의 메일을 분석하여 ERP 데이터 기반 답변 초안을 자동 생성",
    steps: ["이메일 분석", "요청사항 분류", "ERP 데이터 조회", "답변 초안 생성"],
    outputFile: "email_draft_response.docx", outputSize: "56 KB",
  },
  "prod-line-optimizer": {
    name: "생산 공정 최적화",
    desc: "공장별 실시간 가동률과 생산 데이터를 분석하여 병목 구간을 찾고 최적 라인 배치 제안",
    steps: ["생산라인 데이터 수집", "가동률 분석", "병목 구간 탐지", "최적 배치 계산"],
    outputFile: "production_optimization.xlsx", outputSize: "178 KB",
  },
  "prod-qc-vision": {
    name: "품질 관리 및 불량 예측",
    desc: "비전 AI를 통해 생산 현장의 불량을 실시간 탐지하고 불량 패턴을 분석",
    steps: ["카메라 영상 분석", "불량 탐지", "유형 분류", "패턴 분석 및 경고"],
    outputFile: "qc_defect_report.xlsx", outputSize: "234 KB",
  },
  "logistics-tracker": {
    name: "물류 최적화 및 가시성 확보",
    desc: "전 세계로 배송되는 제품의 실시간 위치를 추적하고 최적 경로를 재설계",
    steps: ["선적 데이터 수집", "실시간 위치 추적", "기상/항만 분석", "최적 경로 계산"],
    outputFile: "logistics_optimization.xlsx", outputSize: "167 KB",
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

const TREND_PRODUCTS = [
  { name: "Oversized Linen Blend Blazer", price: "€79.90", emoji: "🧥", tag: "Best Seller", tags: ["Linen", "Oversized", "Natural Tone"], weeks: [{ w: "W18", h: 80 }, { w: "W19", h: 80 }, { w: "W20", h: 60 }, { w: "W21", h: 60 }], desc: "린넨 혼방 소재의 오버사이즈 핏. 내추럴 톤의 버튼 디테일이 특징." },
  { name: "Printed Satin Effect Dress", price: "€45.95", emoji: "👗", tag: "New Entry", tags: ["Satin", "Geometric", "V-Neck"], weeks: [{ w: "W18", h: 0 }, { w: "W19", h: 0 }, { w: "W20", h: 40 }, { w: "W21", h: 75 }], desc: "기하학적 프린트의 새틴 소재 드레스. V넥 라인과 롱 슬리브." },
  { name: "Wide Leg Cropped Jeans", price: "€39.95", emoji: "👖", tag: "Trending", tags: ["Denim", "Wide Leg", "Cropped"], weeks: [{ w: "W18", h: 50 }, { w: "W19", h: 60 }, { w: "W20", h: 70 }, { w: "W21", h: 85 }], desc: "와이드 레그 크롭 핏 데님. 하이웨이스트 디자인." },
  { name: "Ribbed Knit Tank Top", price: "€19.95", emoji: "👕", tag: "Steady", tags: ["Ribbed", "Knit", "Basic"], weeks: [{ w: "W18", h: 70 }, { w: "W19", h: 65 }, { w: "W20", h: 68 }, { w: "W21", h: 72 }], desc: "립 니트 소재의 베이직 탱크탑. 슬림 핏 실루엣." },
]

function DesignCrawlDashboard({ brand, config }: { brand: string; config: AgentConfig }) {
  const products = PRODUCTS[brand] || PRODUCTS.ZARA
  const avgTrend = Math.round(products.reduce((s, p) => s + p.trend, 0) / products.length)
  const avgFob = (products.reduce((s, p) => s + p.fob, 0) / products.length).toFixed(1)

  return (
    <>
      <KpiGrid items={[
        { label: "정보 수집량", value: "20x↑", change: "vs 수동 수집", positive: true, icon: Eye },
        { label: "분석 리드타임", value: "-90%", icon: Clock },
        { label: "분석 제품수", value: `${products.length}개`, icon: Package },
        { label: "평균 FOB", value: `$${avgFob}`, icon: DollarSign },
      ]} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{brand} New Arrival Analysis (Week 21)</h3>
        <span className="text-xs text-gray-500">Region: <strong className="text-gray-900">Global / Spain</strong></span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {TREND_PRODUCTS.map((tp) => (
          <Card key={tp.name} className="border-0 shadow-sm overflow-hidden">
            <div className="h-[100px] bg-gray-100 flex items-center justify-center relative">
              <span className="text-5xl">{tp.emoji}</span>
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded">{tp.tag}</span>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm font-bold text-gray-900">{tp.name}</div>
              <div className="text-sm font-bold text-red-600">{tp.price}</div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{tp.desc}</p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[9px] font-bold text-gray-700 mb-2">Price Trend (Last 4 Weeks)</p>
                <div className="flex items-end gap-2 h-[50px]">
                  {tp.weeks.map((w, i) => (
                    <div key={w.w} className="flex-1 flex flex-col items-center">
                      <div className="w-full rounded-t" style={{ height: `${w.h * 0.5}px`, background: i >= 2 ? "#3B82F6" : "#EF4444" }} />
                      <span className="text-[8px] text-gray-400 mt-1">{w.w}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                <p className="text-[9px] font-bold text-red-600 mb-1.5">AI Style Tagging</p>
                <div className="flex flex-wrap gap-1.5">
                  {tp.tags.map((t) => (
                    <span key={t} className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-gray-50">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-hansae-navy flex items-center justify-center flex-shrink-0 text-sm">📊</div>
          <div>
            <p className="text-xs font-bold text-gray-900">시장 분석 인사이트</p>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
              이번 주 ZARA의 신제품 중 <strong>&apos;Linen&apos;</strong> 소재 비중이 전주 대비 <strong>25% 증가</strong>했습니다.
              당사 S/S 시즌 기획에 반영을 검토하십시오. Wide Leg 실루엣이 3주 연속 상승세입니다.
            </p>
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
        { label: "처리 시간", value: "1.2s", icon: Clock },
        { label: "정확도", value: "99.9%", change: "AI Vision 검증", positive: true, icon: CheckCircle2 },
        { label: "총 수량", value: totalQty.toLocaleString(), icon: Package },
        { label: "총 금액", value: `$${Math.round(totalAmt).toLocaleString()}`, icon: DollarSign },
      ]} />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700">Source: Target_PO_829103.pdf</span>
              <span className="text-[10px] text-gray-400">Page 1 of 1</span>
            </div>
            <div className="p-5 bg-gray-100 min-h-[360px] relative">
              <div className="bg-white p-5 shadow-sm rounded space-y-4 relative">
                <div className="border-b-2 border-black pb-2 font-black text-base">TARGET PURCHASE ORDER</div>
                <div className="flex justify-between text-xs text-gray-700">
                  <div><strong>PO Number:</strong> 829103</div>
                  <div><strong>Date:</strong> 05/19/2026</div>
                </div>
                <div className="absolute top-[42px] left-[120px] w-[52px] h-[14px] border-2 border-red-500 bg-red-500/5 rounded-sm">
                  <span className="absolute -top-4 left-0 bg-red-500 text-white text-[7px] font-bold px-1 rounded">PO_NUM</span>
                </div>
                <table className="w-full text-[10px] mt-4 border-collapse">
                  <thead><tr className="border-b border-black">
                    <th className="text-left py-1">Style / Description</th>
                    <th className="text-left py-1">Color</th>
                    <th className="text-right py-1">Qty</th>
                  </tr></thead>
                  <tbody>
                    <tr><td className="py-1">TS-102 / Men&apos;s Basic Tee</td><td>NAVY BLUE</td><td className="text-right">1,200</td></tr>
                    <tr><td className="py-1">TS-102 / Men&apos;s Basic Tee</td><td>PURE WHITE</td><td className="text-right">850</td></tr>
                    <tr><td className="py-1">TS-205 / Women&apos;s V-Neck</td><td>CORAL PINK</td><td className="text-right">1,500</td></tr>
                  </tbody>
                </table>
                <div className="absolute top-[105px] left-[16px] w-[200px] h-[50px] border-2 border-red-500 bg-red-500/5 rounded-sm">
                  <span className="absolute -top-4 left-0 bg-red-500 text-white text-[7px] font-bold px-1 rounded">LINE_ITEMS</span>
                </div>
                <div className="absolute top-[120px] left-[220px] w-[70px] h-[12px] border-2 border-red-500 bg-red-500/5 rounded-sm">
                  <span className="absolute -top-4 left-0 bg-red-500 text-white text-[7px] font-bold px-1 rounded">COLOR</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-700">Extracted Result (ERP Template)</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">✓ 100% Mapped</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Style No</th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Color Code</th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Size</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium">Qty</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium">Price</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-bold">TS-102</td>
                      <td className="py-2.5 px-3 text-red-600 font-medium">NVY-001</td>
                      <td className="py-2.5 px-3">OS</td>
                      <td className="py-2.5 px-3 text-right">1,200</td>
                      <td className="py-2.5 px-3 text-right">$4.50</td>
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-bold">TS-102</td>
                      <td className="py-2.5 px-3 text-red-600 font-medium">WHT-002</td>
                      <td className="py-2.5 px-3">OS</td>
                      <td className="py-2.5 px-3 text-right">850</td>
                      <td className="py-2.5 px-3 text-right">$4.50</td>
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-bold">TS-205</td>
                      <td className="py-2.5 px-3 text-red-600 font-medium">CPK-003</td>
                      <td className="py-2.5 px-3">OS</td>
                      <td className="py-2.5 px-3 text-right">1,500</td>
                      <td className="py-2.5 px-3 text-right">$5.20</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-2.5 px-3 text-right font-bold">Total</td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600">3,550</td>
                      <td className="py-2.5 px-3 text-right font-medium">$23,830</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-hansae-navy flex items-center justify-center flex-shrink-0">
                <span className="text-sm">✨</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">AI Mapping Note</p>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  &apos;NAVY BLUE&apos;를 한세 표준 코드 <strong>&apos;NVY-001&apos;</strong>로 자동 매핑했습니다. 과거 12건의 이력과 일치합니다.
                  &apos;CORAL PINK&apos;는 신규 코드 <strong>&apos;CPK-003&apos;</strong>으로 등록되었습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">스타일별 오더 수량</h3>
          <p className="text-xs text-gray-500 mb-4">{slug === "po-download" ? "바이어 포탈에서 다운로드된 PO" : slug === "po-sample-pdf-excel" ? "PDF에서 변환된 PO" : "파싱된 PO 오더리캡"}</p>
          <div className="h-[240px]">
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
   Dashboard: Fabric Cost Calculator (4-8)
   ================================================================= */

function FabricCostDashboard({ config }: { config: AgentConfig }) {
  const FABRIC_TYPES = ["Single Jersey", "Rib 1x1", "Interlock", "Pique", "French Terry"] as const
  const ORIGINS = ["Vietnam", "Cambodia", "Indonesia"] as const
  const [selectedFabric, setSelectedFabric] = useState(0)
  const [selectedOrigin, setSelectedOrigin] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)

  const COST_DB: Record<string, Record<string, { yarn: number; knit: number; dye: number; inspect: number }>> = {
    "Single Jersey": { Vietnam: { yarn: 2.45, knit: 0.65, dye: 1.10, inspect: 0.18 }, Cambodia: { yarn: 2.25, knit: 0.60, dye: 1.01, inspect: 0.17 }, Indonesia: { yarn: 2.57, knit: 0.68, dye: 1.16, inspect: 0.19 } },
    "Rib 1x1": { Vietnam: { yarn: 2.60, knit: 0.75, dye: 1.15, inspect: 0.18 }, Cambodia: { yarn: 2.39, knit: 0.69, dye: 1.06, inspect: 0.17 }, Indonesia: { yarn: 2.73, knit: 0.79, dye: 1.21, inspect: 0.19 } },
    "Interlock": { Vietnam: { yarn: 2.80, knit: 0.85, dye: 1.20, inspect: 0.20 }, Cambodia: { yarn: 2.58, knit: 0.78, dye: 1.10, inspect: 0.18 }, Indonesia: { yarn: 2.94, knit: 0.89, dye: 1.26, inspect: 0.21 } },
    "Pique": { Vietnam: { yarn: 2.70, knit: 0.80, dye: 1.18, inspect: 0.19 }, Cambodia: { yarn: 2.48, knit: 0.74, dye: 1.09, inspect: 0.17 }, Indonesia: { yarn: 2.84, knit: 0.84, dye: 1.24, inspect: 0.20 } },
    "French Terry": { Vietnam: { yarn: 3.10, knit: 0.90, dye: 1.25, inspect: 0.20 }, Cambodia: { yarn: 2.85, knit: 0.83, dye: 1.15, inspect: 0.18 }, Indonesia: { yarn: 3.26, knit: 0.95, dye: 1.31, inspect: 0.21 } },
  }

  const fabric = FABRIC_TYPES[selectedFabric]
  const origin = ORIGINS[selectedOrigin]
  const c = COST_DB[fabric][origin]
  const loss = Number((c.yarn * 0.05).toFixed(2))
  const costItems = [
    { item: "Yarn Cost", detail: `Cotton 30s + Span 20D`, cost: c.yarn },
    { item: "Knitting", detail: `Circular Knit`, cost: c.knit },
    { item: "Dyeing/Finishing", detail: `Solid Dyeing + Softener`, cost: c.dye },
    { item: "Inspection/Packing", detail: `AQL 2.5 + Polybag`, cost: c.inspect },
    { item: "Loss (5%)", detail: `Wastage included`, cost: loss },
  ]
  const totalCost = costItems.reduce((s, ci) => s + ci.cost, 0)

  const compareData = ORIGINS.map((o) => {
    const oc = COST_DB[fabric][o]
    return { origin: o, Yarn: oc.yarn, Knitting: oc.knit, Dyeing: oc.dye, Total: Number((oc.yarn + oc.knit + oc.dye + oc.inspect + oc.yarn * 0.05).toFixed(2)) }
  })

  const yarnTrend = [
    { week: "W15", cotton: 2.32, poly: 1.85 }, { week: "W16", cotton: 2.38, poly: 1.82 },
    { week: "W17", cotton: 2.41, poly: 1.88 }, { week: "W18", cotton: 2.45, poly: 1.90 },
    { week: "W19", cotton: 2.50, poly: 1.87 }, { week: "W20", cotton: 2.53, poly: 1.92 },
  ]

  const handleFabricChange = (idx: number) => {
    setIsCalculating(true)
    setSelectedFabric(idx)
    setTimeout(() => setIsCalculating(false), 400)
  }

  return (
    <>
      <KpiGrid items={[
        { label: "Estimated Cost", value: `$${totalCost.toFixed(2)}/yd`, icon: DollarSign },
        { label: "Yarn Index", value: "Cotton +2.3%", change: "+2.3% 전주 대비", positive: false, icon: TrendingUp },
        { label: "최저 소싱처", value: "Cambodia", icon: Activity },
        { label: "환율", value: "1,350 KRW/USD", icon: BarChart3 },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Input Specs</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1.5">Fabric Type</p>
                <div className="space-y-1.5">
                  {FABRIC_TYPES.map((ft, i) => (
                    <button key={ft} onClick={() => handleFabricChange(i)} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-all", i === selectedFabric ? "bg-hansae-navy text-white font-bold" : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100")}>{ft}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1.5">Sourcing Origin</p>
                <div className="flex gap-1.5">
                  {ORIGINS.map((o, i) => (
                    <button key={o} onClick={() => { setIsCalculating(true); setSelectedOrigin(i); setTimeout(() => setIsCalculating(false), 400) }} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all", i === selectedOrigin ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {[{ label: "GSM", value: "180" }, { label: "Width", value: "60\"" }, { label: "Composition", value: "CVC 95/5" }, { label: "Dyeing", value: "Reactive" }].map((f) => (
                  <div key={f.label} className="px-2 py-1.5 rounded bg-gray-50 border border-gray-200">
                    <p className="text-[9px] text-gray-400">{f.label}</p>
                    <p className="text-xs font-medium text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-0 shadow-sm lg:col-span-2 transition-opacity duration-300", isCalculating && "opacity-50")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Cost Breakdown — {fabric} ({origin})</h3>
              {isCalculating && <Loader2 className="w-4 h-4 animate-spin text-hansae-navy" />}
            </div>
            <table className="w-full text-sm mb-4">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-xs text-gray-500 font-medium">항목</th><th className="text-left py-2 text-xs text-gray-500 font-medium">상세</th><th className="text-right py-2 text-xs text-gray-500 font-medium">USD/yd</th><th className="text-right py-2 text-xs text-gray-500 font-medium">비중</th></tr></thead>
              <tbody>
                {costItems.map((ci) => (
                  <tr key={ci.item} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{ci.item}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{ci.detail}</td>
                    <td className="py-2.5 text-right font-bold text-gray-900">${ci.cost.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-xs text-gray-400">{((ci.cost / totalCost) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 rounded-xl bg-hansae-navy flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-100">Total Estimated Cost</span>
              <span className="text-2xl font-black text-red-400">${totalCost.toFixed(2)} / yd</span>
            </div>

            <h4 className="text-xs font-bold text-gray-700 mb-3">Origin Comparison — {fabric}</h4>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="origin" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Yarn" fill="#1E3A5F" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Knitting" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Dyeing" fill="#EF4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Yarn Price Trend (6 Weeks)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yarnTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="cotton" stroke="#1E3A5F" strokeWidth={2} name="Cotton 30s" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="poly" stroke="#EF4444" strokeWidth={2} name="Polyester" dot={{ r: 3 }} />
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
   Dashboard: Tech Pack (4-9)
   ================================================================= */

function TechPackDashboard({ config }: { config: AgentConfig }) {
  const PAGES = [
    { page: 1, section: "Cover", icon: "📋" },
    { page: 2, section: "Flat Sketch", icon: "✏️" },
    { page: 3, section: "Fabric Spec", icon: "🧵" },
    { page: 4, section: "Color Way", icon: "🎨" },
    { page: 5, section: "Trim Detail", icon: "🔩" },
    { page: 6, section: "Stitch Spec", icon: "🪡" },
    { page: 7, section: "Label & Packaging", icon: "🏷️" },
    { page: 8, section: "Measurement", icon: "📐" },
  ]
  const BOM_ITEMS = [
    { category: "Shell Fabric", item: "100% Cotton Jersey", spec: "180GSM, 60\"", supplier: "Texhong Vietnam", unitCost: 3.20, confidence: 99.1, page: 3 },
    { category: "Lining", item: "100% Polyester Taffeta", spec: "58GSM, 58\"", supplier: "Youngone", unitCost: 1.15, confidence: 97.8, page: 3 },
    { category: "Zipper", item: "YKK 5# Nylon Reverse", spec: "22cm", supplier: "YKK Vietnam", unitCost: 0.45, confidence: 98.5, page: 5 },
    { category: "Thread", item: "60/3 Spun Polyester", spec: "Color-matched", supplier: "Coats", unitCost: 0.08, confidence: 96.2, page: 6 },
    { category: "Button", item: "4-Hole Poly Button", spec: "20L, Navy", supplier: "HK Button", unitCost: 0.03, confidence: 95.0, page: 5 },
    { category: "Label", item: "Woven Main + Care", spec: "30x60mm", supplier: "Paxar", unitCost: 0.12, confidence: 99.5, page: 7 },
    { category: "Interlining", item: "Woven Fusible", spec: "90GSM", supplier: "Freudenberg", unitCost: 0.35, confidence: 97.3, page: 3 },
    { category: "Packaging", item: "Polybag + Carton", spec: "12\"x16\"", supplier: "Local", unitCost: 0.22, confidence: 98.0, page: 7 },
  ]

  const [currentPage, setCurrentPage] = useState(0)
  const [extractedCount, setExtractedCount] = useState(BOM_ITEMS.length)
  const [selectedBom, setSelectedBom] = useState<number | null>(null)

  const currentBoms = BOM_ITEMS.filter((b) => b.page === PAGES[currentPage].page)
  const avgConf = (BOM_ITEMS.reduce((s, b) => s + b.confidence, 0) / BOM_ITEMS.length).toFixed(1)
  const totalBomCost = BOM_ITEMS.reduce((s, b) => s + b.unitCost, 0)

  const confChartData = BOM_ITEMS.map((b) => ({ name: b.category, confidence: b.confidence, cost: b.unitCost }))

  return (
    <>
      <KpiGrid items={[
        { label: "분석 페이지", value: `${PAGES.length}p`, icon: FileText },
        { label: "추출 항목", value: `${extractedCount}개`, icon: Package },
        { label: "Avg. Confidence", value: `${avgConf}%`, icon: Activity },
        { label: "총 BOM 원가", value: `$${totalBomCost.toFixed(2)}`, icon: DollarSign },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Original Document</h3>
              <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-medium">Page {PAGES[currentPage].page} / {PAGES.length}</span>
            </div>
            <div className="relative rounded-lg bg-gray-50 border border-gray-200 h-[280px] flex flex-col items-center justify-center overflow-hidden">
              <span className="text-5xl mb-2">{PAGES[currentPage].icon}</span>
              <p className="text-sm font-bold text-gray-700">{PAGES[currentPage].section}</p>
              <p className="text-[10px] text-gray-400 mt-1">GAP / Old Navy — Style #ON-FW26-0042</p>
              {currentBoms.length > 0 && (
                <div className="absolute inset-3 border-2 border-red-500 rounded opacity-30 animate-pulse" />
              )}
              {currentBoms.length > 0 && (
                <div className="absolute bottom-3 left-3 bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold">
                  {currentBoms.length} items detected on this page
                </div>
              )}
            </div>
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
              {PAGES.map((p, i) => (
                <button key={p.page} onClick={() => setCurrentPage(i)} className={cn("flex-shrink-0 w-16 h-16 rounded-lg border text-center flex flex-col items-center justify-center gap-0.5 transition-all", i === currentPage ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50")}>
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-[8px] text-gray-500 leading-tight">{p.section}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Extracted BOM & Specs</h3>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">
                <CheckCircle2 className="w-3 h-3 mr-1" /> {extractedCount} items
              </Badge>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {BOM_ITEMS.map((item, i) => (
                <button key={item.category} onClick={() => setSelectedBom(selectedBom === i ? null : i)} className={cn("w-full text-left flex items-center justify-between p-2.5 rounded-lg border-l-[3px] transition-all", selectedBom === i ? "bg-blue-50 border-blue-500" : "bg-gray-50 border-red-500 hover:bg-gray-100")}>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400">{item.category}</span>
                    <p className="text-xs font-bold text-gray-900 truncate">{item.item}</p>
                    {selectedBom === i && (
                      <div className="mt-1.5 space-y-0.5 text-[10px] text-gray-500 animate-fade-in">
                        <p>Spec: {item.spec} | Supplier: {item.supplier}</p>
                        <p>Unit Cost: <strong className="text-gray-800">${item.unitCost.toFixed(2)}</strong> | Page {item.page}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2 text-right">
                    <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", item.confidence >= 98 ? "bg-emerald-100 text-emerald-700" : item.confidence >= 96 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>{item.confidence}%</div>
                  </div>
                </button>
              ))}
            </div>

            <Card className="border-0 bg-amber-50 mt-3">
              <CardContent className="p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>YKK Zipper</strong> 단가가 전 시즌 대비 <strong>+15%</strong> 상승. 대체 부자재(SBS Zipper $0.32) 검토를 권장합니다.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">BOM Confidence & Cost Analysis</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confChartData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" domain={[90, 100]} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="confidence" fill="#1E3A5F" name="Confidence %" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" fill="#EF4444" name="Unit Cost $" radius={[3, 3, 0, 0]} />
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
   Dashboard: Buyer Email (4-10)
   ================================================================= */

function BuyerEmailDashboard({ config }: { config: AgentConfig }) {
  const EMAILS = [
    {
      id: 0, subject: "Urgent: Shipment Delay for PO #829103", from: "Sarah Jenkins", company: "Target", time: "10:30 AM", priority: "HIGH" as const,
      body: "Dear Hansae Team,\n\nWe noticed that the shipment for PO #829103 is currently marked as delayed in the portal. Could you please provide an updated ETD and the reason for this delay? This is a priority style for our upcoming summer campaign.\n\nBest regards,\nSarah",
      category: "Delivery Inquiry", erpData: "PO-829103 | ETD: 2026-05-25 | Status: In Production (92%)",
      drafts: {
        Professional: "Dear Sarah,\n\nThank you for your inquiry. Regarding PO #829103, the ETD has been updated to May 25th due to a temporary raw material shortage which has now been resolved. Current production progress is at 92%, and we are fast-tracking to ensure minimal impact on your campaign timeline.\n\nWe will provide daily status updates until shipment confirmation.\n\nBest regards,\nHansae Sales Team",
        Friendly: "Hi Sarah,\n\nThanks for reaching out! Good news — PO #829103 is now at 92% completion and we've locked in the May 25th ETD. The brief delay was due to a raw material issue that's already been sorted out.\n\nI'll keep you posted with daily updates. Let me know if you need anything else!\n\nBest,\nHansae Sales Team",
        Urgent: "Dear Sarah,\n\nRe: PO #829103 — Immediate update:\n\n• Current status: In Production (92% complete)\n• Revised ETD: May 25, 2026\n• Root cause: Raw material delay (RESOLVED)\n• Action: Fast-track production in progress\n\nDaily status reports will follow. Please contact us immediately if this timeline impacts your campaign.\n\nRegards,\nHansae Sales Team",
      },
    },
    {
      id: 1, subject: "Sample Approval Request - Style TS-102", from: "Michael Chen", company: "Gap", time: "09:15 AM", priority: "MEDIUM" as const,
      body: "Hi Team,\n\nWe've reviewed the pre-production samples for Style TS-102. The fit looks good but we need the following adjustments before final approval:\n1. Sleeve length +0.5cm\n2. Neck opening needs to be adjusted\n3. Please provide updated measurement chart\n\nPlease confirm the timeline for revised samples.\n\nRegards,\nMichael",
      category: "Sample Request", erpData: "SAMPLE-TS102 | Stage: PP Sample | QC: Pending Revision",
      drafts: {
        Professional: "Dear Michael,\n\nThank you for the detailed feedback on Style TS-102. We acknowledge the three adjustments required:\n\n1. Sleeve length: Will extend +0.5cm across all sizes\n2. Neck opening: Our pattern team will adjust per your spec\n3. Updated measurement chart: Will be included with revised samples\n\nRevised samples will ship within 5 business days. Updated measurement chart attached.\n\nBest regards,\nHansae Sales Team",
        Friendly: "Hi Michael,\n\nThanks for the feedback on TS-102! We're on it — all three changes are noted and our pattern team is already working on the revisions.\n\nExpect the updated samples in about 5 days. We'll include the new measurement chart with the shipment.\n\nCheers,\nHansae Sales Team",
        Urgent: "Dear Michael,\n\nRe: Style TS-102 Sample Revision — Confirmed.\n\n• Sleeve length +0.5cm: ACCEPTED\n• Neck opening adjustment: IN PROGRESS\n• Measurement chart: WILL ATTACH\n• Revised sample ETA: 5 business days\n\nPrioritizing to meet your approval deadline.\n\nRegards,\nHansae Sales Team",
      },
    },
    {
      id: 2, subject: "Price Negotiation for FW26 Bulk Order", from: "Emma Williams", company: "Walmart", time: "Yesterday", priority: "HIGH" as const,
      body: "Dear Hansae Team,\n\nFollowing our QBR discussion, we'd like to proceed with the FW26 bulk order. However, we need a 5% price reduction on the following styles to meet our margin targets:\n- WM-FW26-001 (Fleece Hoodie)\n- WM-FW26-002 (Quilted Jacket)\n- WM-FW26-003 (Thermal Pant)\n\nCurrent volume commitment: 150,000 pcs. Open to increasing to 200,000 pcs if pricing is competitive.\n\nPlease advise.\n\nEmma Williams\nWalmart Global Sourcing",
      category: "Price Negotiation", erpData: "QUOTE-FW26-WM | Volume: 150K–200K pcs | Current margin: 18.5%",
      drafts: {
        Professional: "Dear Emma,\n\nThank you for your interest in proceeding with the FW26 order. We've carefully reviewed the pricing request:\n\n• At 150,000 pcs: We can offer a 3% reduction, bringing our margin to a sustainable level\n• At 200,000 pcs: We can meet your 5% target, leveraging fabric volume discounts\n\nThis proposal maintains quality standards while meeting your margin requirements. Detailed cost breakdown is attached.\n\nWould you like to schedule a call to discuss?\n\nBest regards,\nHansae Sales Team",
        Friendly: "Hi Emma,\n\nGreat to hear you want to move forward with FW26! We've run the numbers and here's what we can do:\n\n• 150K pcs → 3% off (our best at this volume)\n• 200K pcs → Full 5% off (the volume makes it work!)\n\nThe quality stays the same either way. Happy to jump on a call to work out the details!\n\nBest,\nHansae Sales Team",
        Urgent: "Dear Emma,\n\nRe: FW26 Pricing — Proposal:\n\n• 150,000 pcs → 3% reduction (maximum at this volume)\n• 200,000 pcs → 5% reduction (ACCEPTED with volume commitment)\n• Condition: Fabric booking by June 15\n\nDetailed cost breakdown attached. Request call to finalize.\n\nRegards,\nHansae Sales Team",
      },
    },
  ]

  const TONES = ["Professional", "Friendly", "Urgent"] as const
  const [selectedEmail, setSelectedEmail] = useState(0)
  const [selectedTone, setSelectedTone] = useState<typeof TONES[number]>("Professional")
  const [isGenerating, setIsGenerating] = useState(false)
  const [displayedDraft, setDisplayedDraft] = useState(EMAILS[0].drafts.Professional)
  const [charCount, setCharCount] = useState(EMAILS[0].drafts.Professional.length)

  const email = EMAILS[selectedEmail]
  const fullDraft = email.drafts[selectedTone]

  const handleEmailChange = (idx: number) => {
    setSelectedEmail(idx)
    setIsGenerating(true)
    setDisplayedDraft("")
    setCharCount(0)
  }

  const handleToneChange = (tone: typeof TONES[number]) => {
    setSelectedTone(tone)
    setIsGenerating(true)
    setDisplayedDraft("")
    setCharCount(0)
  }

  useEffect(() => {
    if (!isGenerating) return
    const draft = EMAILS[selectedEmail].drafts[selectedTone]
    if (charCount >= draft.length) {
      setIsGenerating(false)
      return
    }
    const speed = charCount < 20 ? 30 : 8
    const timer = setTimeout(() => {
      const next = Math.min(charCount + 3, draft.length)
      setDisplayedDraft(draft.slice(0, next))
      setCharCount(next)
    }, speed)
    return () => clearTimeout(timer)
  }, [isGenerating, charCount, selectedEmail, selectedTone])

  return (
    <>
      <KpiGrid items={[
        { label: "미처리 메일", value: "12건", icon: FileText },
        { label: "AI 답변 생성", value: `${EMAILS.length}건`, icon: Activity },
        { label: "평균 응답시간", value: "1.2s", icon: Clock },
        { label: "언어 지원", value: "EN/KO/CN", icon: Layers },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Inbox (12)</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {EMAILS.map((e, i) => (
                <button key={e.id} onClick={() => handleEmailChange(i)} className={cn("w-full text-left px-4 py-3 transition-all hover:bg-gray-50", i === selectedEmail && "bg-gray-50 border-l-[3px] border-red-500")}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn("text-[8px] h-4 px-1", e.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")} variant="secondary">{e.priority}</Badge>
                    <p className="text-sm font-bold text-gray-900 truncate flex-1">{e.subject}</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{e.from} ({e.company})</span>
                    <span>{e.time}</span>
                  </div>
                  <Badge className="mt-1 text-[8px] bg-gray-100 text-gray-600" variant="secondary">{e.category}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-1">{email.subject}</h3>
              <p className="text-xs text-gray-500">From: <strong>{email.from} ({email.company})</strong> | To: <strong>Hansae Sales Team</strong></p>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed border-b border-gray-100 whitespace-pre-line max-h-[160px] overflow-y-auto">{email.body}</div>

            <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] text-blue-700 font-medium">ERP Lookup: {email.erpData}</span>
            </div>

            <div className="m-5 p-5 rounded-xl bg-gray-50 border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-red-600 flex items-center gap-1.5">✨ AI Generated Draft</span>
                <div className="flex items-center gap-1.5">
                  {TONES.map((tone) => (
                    <button key={tone} onClick={() => handleToneChange(tone)} className={cn("px-2.5 py-1 rounded text-[10px] font-medium transition-all", tone === selectedTone ? "bg-hansae-navy text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100")}>{tone}</button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-line min-h-[120px]">
                {displayedDraft}
                {isGenerating && <span className="inline-block w-0.5 h-4 bg-hansae-navy animate-pulse ml-0.5" />}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-gray-400">* ERP 데이터 자동 연동 | {selectedTone} Tone</p>
                <Button size="sm" className="bg-hansae-navy hover:bg-hansae-navy-light text-xs h-7" disabled={isGenerating}>
                  {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />생성 중...</> : "Apply to Reply"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Production Line Optimizer (4-11)
   ================================================================= */

function ProductionOptimizerDashboard({ config }: { config: AgentConfig }) {
  const LINES_BEFORE = [
    { name: "A-01", product: "T-Shirt", target: 1200, actual: 1020, pct: 85, bottleneck: null },
    { name: "A-02", product: "Polo", target: 800, actual: 360, pct: 45, bottleneck: "Sewing Step 3" },
    { name: "B-01", product: "Jacket", target: 500, actual: 460, pct: 92, bottleneck: null },
    { name: "B-02", product: "Pants", target: 1000, actual: 780, pct: 78, bottleneck: null },
    { name: "C-01", product: "Dress", target: 600, actual: 540, pct: 90, bottleneck: null },
    { name: "C-02", product: "Shorts", target: 900, actual: 612, pct: 68, bottleneck: "Cutting" },
  ]
  const LINES_AFTER = [
    { name: "A-01", product: "T-Shirt", target: 1200, actual: 1080, pct: 90, bottleneck: null },
    { name: "A-02", product: "Polo", target: 800, actual: 608, pct: 76, bottleneck: null },
    { name: "B-01", product: "Jacket", target: 500, actual: 465, pct: 93, bottleneck: null },
    { name: "B-02", product: "Pants", target: 1000, actual: 830, pct: 83, bottleneck: null },
    { name: "C-01", product: "Dress", target: 600, actual: 558, pct: 93, bottleneck: null },
    { name: "C-02", product: "Shorts", target: 900, actual: 738, pct: 82, bottleneck: null },
  ]

  const HOURLY_DATA = [
    { hour: "08:00", before: 72, after: 72 }, { hour: "09:00", before: 78, after: 82 },
    { hour: "10:00", before: 82, after: 88 }, { hour: "11:00", before: 80, after: 90 },
    { hour: "12:00", before: 65, after: 70 }, { hour: "13:00", before: 75, after: 85 },
    { hour: "14:00", before: 79, after: 89 }, { hour: "15:00", before: 76, after: 88 },
    { hour: "16:00", before: 74, after: 86 }, { hour: "17:00", before: 70, after: 84 },
  ]

  const [optimized, setOptimized] = useState(false)
  const [animating, setAnimating] = useState(false)
  const lines = optimized ? LINES_AFTER : LINES_BEFORE
  const avgEff = (lines.reduce((s, l) => s + l.pct, 0) / lines.length).toFixed(1)
  const bottleneckCount = lines.filter((l) => l.bottleneck).length

  const toggleOptimize = () => {
    setAnimating(true)
    setTimeout(() => {
      setOptimized(!optimized)
      setAnimating(false)
    }, 600)
  }

  const compareData = LINES_BEFORE.map((b, i) => ({
    name: b.name,
    Before: b.pct,
    After: LINES_AFTER[i].pct,
    delta: LINES_AFTER[i].pct - b.pct,
  }))

  return (
    <>
      <KpiGrid items={[
        { label: "가동 라인", value: `${lines.length}개`, icon: Factory },
        { label: "Overall Efficiency", value: `${avgEff}%`, change: optimized ? "+11.3% optimized" : "+2.4% vs 어제", positive: true, icon: Activity },
        { label: "병목 라인", value: `${bottleneckCount}개`, icon: AlertTriangle },
        { label: "Shift", value: "Day (08:00–17:00)", icon: Clock },
      ]} />

      <div className="flex items-center gap-3 mb-2">
        <Button onClick={toggleOptimize} disabled={animating} className={cn("gap-2 transition-all", optimized ? "bg-emerald-600 hover:bg-emerald-700" : "bg-hansae-navy hover:bg-hansae-navy-light")}>
          {animating ? <Loader2 className="w-4 h-4 animate-spin" /> : optimized ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          {optimized ? "최적화 적용됨 (원복)" : "AI 최적화 실행"}
        </Button>
        {optimized && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">병목 0건 · 평균 +11.3%p 개선</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={cn("border-0 shadow-sm lg:col-span-2 transition-opacity duration-300", animating && "opacity-40")}>
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Production Lines — {optimized ? "After Optimization" : "Current Status"}</h3>
            <div className="grid grid-cols-2 gap-3">
              {lines.map((line) => (
                <div key={line.name} className={cn("p-3.5 rounded-lg border transition-all", line.bottleneck ? "border-amber-300 bg-amber-50" : optimized ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 bg-white")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">{line.name} <span className="text-xs font-normal text-gray-500">({line.product})</span></p>
                    <span className={cn("text-xs font-bold", line.pct >= 90 ? "text-emerald-600" : line.pct >= 70 ? "text-blue-600" : "text-amber-600")}>{line.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div className={cn("h-full rounded-full transition-all duration-700", line.pct >= 90 ? "bg-emerald-500" : line.pct >= 70 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${line.pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Target: {line.target.toLocaleString()}</span>
                    <span className="font-medium">Actual: {line.actual.toLocaleString()}</span>
                  </div>
                  {line.bottleneck && <p className="text-[10px] text-amber-600 mt-1.5 font-bold">⚠️ Bottleneck: {line.bottleneck}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">AI Optimization</h3>
            <div className="space-y-3 mb-4">
              {[
                { action: "A-02: B-02 유휴 인력 2명 재배치", impact: "+31%p", status: optimized },
                { action: "C-02: 커팅기 1대 추가 투입", impact: "+14%p", status: optimized },
                { action: "A-01 → C-01 로트 순서 변경", impact: "+5%p", status: optimized },
              ].map((r) => (
                <div key={r.action} className={cn("p-3 rounded-lg border text-xs transition-all", r.status ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50")}>
                  <div className="flex items-center gap-2">
                    {r.status ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                    <span className="text-gray-700">{r.action}</span>
                  </div>
                  <p className="text-emerald-700 font-bold ml-5.5 mt-1">예상 개선: {r.impact}</p>
                </div>
              ))}
            </div>
            <div className={cn("p-4 rounded-xl text-center transition-all", optimized ? "bg-emerald-600" : "bg-hansae-navy")}>
              <p className="text-[10px] text-gray-300 font-medium">Overall Efficiency</p>
              <p className="text-3xl font-black text-white mt-1">{avgEff}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Hourly Efficiency Trend</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={HOURLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="before" stroke="#94A3B8" strokeWidth={2} name="Before" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="after" stroke="#10B981" strokeWidth={2} name="After Optimization" dot={{ r: 2 }} />
                  <ReferenceLine y={85} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "Target 85%", fontSize: 9, fill: "#EF4444" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Before vs After Comparison</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Before" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="After" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: QC Vision (4-12)
   ================================================================= */

function QcVisionDashboard({ config }: { config: AgentConfig }) {
  const DEFECTS = [
    { id: "DEF-001", time: "14:30:05", camera: "CAM-01", type: "Stain", label: "오염", confidence: 99.2, severity: "Major" as const, lot: "LOT-A" },
    { id: "DEF-002", time: "14:32:18", camera: "CAM-02", type: "Seam Puckering", label: "봉제 불량", confidence: 96.5, severity: "Minor" as const, lot: "LOT-A" },
    { id: "DEF-003", time: "14:35:41", camera: "CAM-01", type: "Hole", label: "구멍", confidence: 98.8, severity: "Critical" as const, lot: "LOT-B" },
    { id: "DEF-004", time: "14:40:12", camera: "CAM-03", type: "Shading", label: "이색", confidence: 94.1, severity: "Minor" as const, lot: "LOT-B" },
    { id: "DEF-005", time: "14:42:55", camera: "CAM-01", type: "Stain", label: "오염", confidence: 97.6, severity: "Major" as const, lot: "LOT-C" },
    { id: "DEF-006", time: "14:45:30", camera: "CAM-04", type: "Open Seam", label: "봉제 터짐", confidence: 95.3, severity: "Major" as const, lot: "LOT-C" },
  ]

  const TIMELINE = [
    { time: "08:00", inspected: 320, defects: 0 }, { time: "09:00", inspected: 480, defects: 1 },
    { time: "10:00", inspected: 510, defects: 1 }, { time: "11:00", inspected: 490, defects: 2 },
    { time: "12:00", inspected: 280, defects: 0 }, { time: "13:00", inspected: 460, defects: 1 },
    { time: "14:00", inspected: 520, defects: 3 }, { time: "14:30", inspected: 380, defects: 4 },
  ]

  const [scanCount, setScanCount] = useState(4281)
  const [selectedDefect, setSelectedDefect] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    if (!isScanning) return
    const interval = setInterval(() => {
      setScanCount((c) => c + Math.floor(Math.random() * 3) + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [isScanning])

  const defectRate = ((DEFECTS.length / scanCount) * 100).toFixed(2)
  const defectTypes = [
    { name: "Stain", count: 2, pct: 33, color: "bg-red-500" },
    { name: "Seam", count: 2, pct: 33, color: "bg-blue-500" },
    { name: "Hole", count: 1, pct: 17, color: "bg-emerald-500" },
    { name: "Shading", count: 1, pct: 17, color: "bg-amber-500" },
  ]

  const SEV_COLOR = { Critical: "bg-red-600 text-white", Major: "bg-amber-100 text-amber-800", Minor: "bg-gray-100 text-gray-600" }

  return (
    <>
      <KpiGrid items={[
        { label: "총 검사수", value: scanCount.toLocaleString(), icon: Activity },
        { label: "불량 탐지", value: `${DEFECTS.length}건 (${defectRate}%)`, icon: AlertTriangle },
        { label: "모델 정확도", value: "98.5%", icon: BarChart3 },
        { label: "카메라", value: "4대 Online", icon: Eye },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Live Camera Feed</h3>
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", isScanning ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
                <button onClick={() => setIsScanning(!isScanning)} className="text-[10px] text-gray-500 hover:text-gray-800">{isScanning ? "Scanning..." : "Paused"}</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["CAM-01", "CAM-02", "CAM-03", "CAM-04"].map((cam, i) => (
                <div key={cam} className="relative rounded-lg bg-gray-900 h-[100px] flex items-center justify-center overflow-hidden">
                  <span className="text-3xl opacity-60">👕</span>
                  {isScanning && <div className={cn("absolute left-0 w-full h-0.5 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)]")} style={{ top: `${(Date.now() / 20 + i * 25) % 100}%`, transition: "top 0.1s linear" }} />}
                  {i < 2 && <div className="absolute inset-3 border border-red-500/40 rounded" />}
                  <div className="absolute top-1.5 left-1.5 bg-black/60 text-green-400 text-[8px] px-1.5 py-0.5 rounded font-mono">{cam}</div>
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-gray-400 text-[8px] px-1.5 py-0.5 rounded font-mono">{scanCount + i * 100}</div>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold text-gray-700 mb-2">Recent Detections</h4>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {DEFECTS.map((d, i) => (
                <button key={d.id} onClick={() => setSelectedDefect(selectedDefect === i ? null : i)} className={cn("w-full text-left flex items-center gap-3 p-2 rounded-lg border transition-all text-xs", selectedDefect === i ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100")}>
                  <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", SEV_COLOR[d.severity])}>{d.severity}</span>
                  <span className="font-medium text-gray-900 flex-1">{d.type} ({d.label})</span>
                  <span className="text-gray-400 text-[10px]">{d.camera} · {d.time}</span>
                </button>
              ))}
            </div>
            {selectedDefect !== null && (
              <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs animate-fade-in">
                <p className="font-bold text-red-800 mb-1">{DEFECTS[selectedDefect].type} — Detail</p>
                <p className="text-red-700">Confidence: <strong>{DEFECTS[selectedDefect].confidence}%</strong> | LOT: {DEFECTS[selectedDefect].lot} | Camera: {DEFECTS[selectedDefect].camera}</p>
                <p className="text-red-600 mt-1">Action: {DEFECTS[selectedDefect].severity === "Critical" ? "즉시 라인 정지 및 원인 조사" : DEFECTS[selectedDefect].severity === "Major" ? "해당 LOT 격리 후 재검사" : "기록 후 모니터링 지속"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Defect Timeline (Today)</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TIMELINE} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={TT} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar yAxisId="left" dataKey="inspected" fill="#E2E8F0" name="Inspected" radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="right" dataKey="defects" fill="#EF4444" name="Defects" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Defect Distribution</h3>
              <div className="space-y-3">
                {defectTypes.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{d.name}</span>
                      <span className="font-bold text-gray-900">{d.count}건 ({d.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", d.color)} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    14:30 이후 <strong>Stain</strong> 불량 급증 감지. 원단 롤 #402 청결 상태 점검 및 CAM-01 라인 긴급 확인 필요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <OutputFile name={config.outputFile} size={config.outputSize} />
    </>
  )
}

/* =================================================================
   Dashboard: Logistics Tracker (4-13)
   ================================================================= */

function LogisticsDashboard({ config }: { config: AgentConfig }) {
  const SHIPMENTS = [
    { id: "SHP-0519-A", origin: "HCM", dest: "Long Beach", vessel: "EVER GIVEN", departure: "05/10", eta: "06/05", status: "on-track" as const, progress: 62, cartons: 2400, cbm: 86.4, cost: 4200, airAlt: 18500 },
    { id: "SHP-0518-B", origin: "Haiphong", dest: "Savannah", vessel: "MSC BELLA", departure: "05/08", eta: "06/15", status: "delayed" as const, progress: 48, cartons: 1800, cbm: 64.8, cost: 3100, airAlt: 14200, delayReason: "Tropical Storm" },
    { id: "SHP-0517-C", origin: "Chittagong", dest: "Rotterdam", vessel: "MAERSK SELETAR", departure: "05/05", eta: "06/02", status: "on-track" as const, progress: 78, cartons: 3200, cbm: 115.2, cost: 5600, airAlt: 24000 },
    { id: "SHP-0520-D", origin: "Phnom Penh", dest: "Los Angeles", vessel: "CMA CGM MARCO", departure: "05/12", eta: "06/08", status: "on-track" as const, progress: 55, cartons: 1500, cbm: 54.0, cost: 2800, airAlt: 12500 },
  ]

  const [selectedShip, setSelectedShip] = useState(0)
  const ship = SHIPMENTS[selectedShip]

  const costCompare = SHIPMENTS.map((s) => ({
    name: s.id.replace("SHP-", ""),
    Sea: s.cost,
    Air: s.airAlt,
    Savings: s.airAlt - s.cost,
  }))

  const transitTimeline = [
    { day: "D+0", pct: 0 }, { day: "D+5", pct: 15 }, { day: "D+10", pct: 32 },
    { day: "D+15", pct: 48 }, { day: "D+20", pct: 62 }, { day: "D+25", pct: 78 },
    { day: "D+28", pct: 90 }, { day: "D+30", pct: 100 },
  ]

  const onTrack = SHIPMENTS.filter((s) => s.status === "on-track").length
  const totalCartons = SHIPMENTS.reduce((s, sh) => s + sh.cartons, 0)

  return (
    <>
      <KpiGrid items={[
        { label: "Active Shipments", value: `${SHIPMENTS.length}`, icon: Package },
        { label: "On Track Rate", value: `${Math.round((onTrack / SHIPMENTS.length) * 100)}%`, change: "-2.1% 전주 대비", positive: false, icon: Activity },
        { label: "Total Cartons", value: totalCartons.toLocaleString(), icon: Truck },
        { label: "ETA 정확도", value: "95%", icon: BarChart3 },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Real-time Route Tracking</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-gray-500">AIS Live</span>
              </div>
            </div>
            <div className="relative rounded-lg bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 h-[280px] overflow-hidden">
              <div className="absolute text-[10px] font-bold text-blue-800 bg-white/70 px-2 py-1 rounded" style={{ top: "55%", left: "12%" }}>🇻🇳 Vietnam</div>
              <div className="absolute text-[10px] font-bold text-blue-800 bg-white/70 px-2 py-1 rounded" style={{ top: "50%", left: "5%" }}>🇧🇩 Bangladesh</div>
              <div className="absolute text-[10px] font-bold text-blue-800 bg-white/70 px-2 py-1 rounded" style={{ top: "55%", left: "18%" }}>🇰🇭 Cambodia</div>
              <div className="absolute text-[10px] font-bold text-red-700 bg-white/70 px-2 py-1 rounded" style={{ top: "25%", left: "78%" }}>🇺🇸 USA</div>
              <div className="absolute text-[10px] font-bold text-red-700 bg-white/70 px-2 py-1 rounded" style={{ top: "30%", left: "55%" }}>🇳🇱 Rotterdam</div>

              {SHIPMENTS.map((s, i) => {
                const leftPos = 15 + (s.progress / 100) * 65
                const topPos = 35 + i * 8
                return (
                  <button key={s.id} onClick={() => setSelectedShip(i)} className={cn("absolute transition-all duration-500", i === selectedShip && "scale-125 z-10")} style={{ left: `${leftPos}%`, top: `${topPos}%` }}>
                    <span className={cn("text-xl", s.status === "delayed" && "animate-pulse")}>{s.status === "delayed" ? "⚠️" : "🚢"}</span>
                  </button>
                )
              })}

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="bg-white/80 px-2 py-1 rounded text-[10px] text-gray-600">Weather API: Connected</span>
                <span className="bg-white/80 px-2 py-1 rounded text-[10px] text-gray-600">Selected: {ship.id}</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{ship.id} — {ship.vessel}</p>
                  <p className="text-xs text-gray-500">{ship.origin} → {ship.dest} | Departed {ship.departure}</p>
                </div>
                <Badge className={cn("text-[10px]", ship.status === "on-track" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")} variant="outline">
                  {ship.status === "on-track" ? "On Track" : `Delayed (${ship.delayReason})`}
                </Badge>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className={cn("h-full rounded-full transition-all duration-500", ship.status === "delayed" ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${ship.progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>Progress: {ship.progress}%</span>
                <span>{ship.cartons.toLocaleString()} ctns · {ship.cbm} CBM</span>
                <span>ETA: <strong className={ship.status === "delayed" ? "text-red-600" : "text-gray-900"}>{ship.eta}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Shipment List</h3>
            <div className="space-y-2">
              {SHIPMENTS.map((s, i) => (
                <button key={s.id} onClick={() => setSelectedShip(i)} className={cn("w-full text-left p-3 rounded-lg border transition-all", i === selectedShip ? "border-blue-400 bg-blue-50" : s.status === "delayed" ? "border-red-200 bg-red-50/50 hover:bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900">{s.id}</span>
                    <span className={cn("w-2 h-2 rounded-full", s.status === "on-track" ? "bg-emerald-500" : "bg-red-500")} />
                  </div>
                  <p className="text-[10px] text-gray-500">{s.origin} → {s.dest}</p>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-1.5">
                    <div className={cn("h-full rounded-full", s.status === "delayed" ? "bg-red-400" : "bg-emerald-400")} style={{ width: `${s.progress}%` }} />
                  </div>
                </button>
              ))}
            </div>

            {SHIPMENTS.some((s) => s.status === "delayed") && (
              <Card className="border-0 bg-amber-50 mt-4">
                <CardContent className="p-3 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>SHP-0518-B</strong> 지연분의 긴급 물량은 <strong>항공 운송</strong>으로 전환 시 6/03 도착 가능 (추가 비용: ${(SHIPMENTS[1].airAlt - SHIPMENTS[1].cost).toLocaleString()})
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Sea vs Air Freight Cost ($)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costCompare} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Sea" fill="#1E3A5F" name="Sea Freight" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Air" fill="#EF4444" name="Air Freight" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Transit Progress Curve (Typical)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transitTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={TT} />
                  <Line type="monotone" dataKey="pct" stroke="#1E3A5F" strokeWidth={2} name="Progress" dot={{ r: 3 }} />
                  <ReferenceLine y={ship.progress} stroke="#EF4444" strokeDasharray="3 3" label={{ value: `Current: ${ship.progress}%`, fontSize: 9, fill: "#EF4444" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
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
    case "fabric-cost-calculator": return <FabricCostDashboard config={config} />
    case "design-techpack": return <TechPackDashboard config={config} />
    case "comm-buyer-email": return <BuyerEmailDashboard config={config} />
    case "prod-line-optimizer": return <ProductionOptimizerDashboard config={config} />
    case "prod-qc-vision": return <QcVisionDashboard config={config} />
    case "logistics-tracker": return <LogisticsDashboard config={config} />
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
