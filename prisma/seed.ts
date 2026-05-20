import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcryptjs";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const PASSWORD_HASH = hashSync("demo1234", 10);

async function main() {
  console.log("🌱 Seeding database...");

  // ── Teams ──────────────────────────────────────────────
  const teamDesign = await prisma.team.upsert({
    where: { id: "team-design" },
    update: {},
    create: { id: "team-design", name: "Design / Intelligence" },
  });

  const teamSales = await prisma.team.upsert({
    where: { id: "team-sales" },
    update: {},
    create: { id: "team-sales", name: "Sales / PO" },
  });

  console.log("  ✔ Teams created");

  // ── Users ──────────────────────────────────────────────
  const userUser = await prisma.user.upsert({
    where: { email: "user@hansae.demo" },
    update: {},
    create: {
      id: "user-user",
      email: "user@hansae.demo",
      passwordHash: PASSWORD_HASH,
      displayName: "김실무",
      role: "USER",
      teamId: teamSales.id,
    },
  });

  const userCreator = await prisma.user.upsert({
    where: { email: "creator@hansae.demo" },
    update: {},
    create: {
      id: "user-creator",
      email: "creator@hansae.demo",
      passwordHash: PASSWORD_HASH,
      displayName: "이제작",
      role: "CREATOR",
      teamId: teamDesign.id,
    },
  });

  const userApprover = await prisma.user.upsert({
    where: { email: "approver@hansae.demo" },
    update: {},
    create: {
      id: "user-approver",
      email: "approver@hansae.demo",
      passwordHash: PASSWORD_HASH,
      displayName: "박팀장",
      role: "APPROVER",
      teamId: teamDesign.id,
    },
  });

  const userAdmin = await prisma.user.upsert({
    where: { email: "admin@hansae.demo" },
    update: {},
    create: {
      id: "user-admin",
      email: "admin@hansae.demo",
      passwordHash: PASSWORD_HASH,
      displayName: "최관리",
      role: "ADMIN",
      teamId: teamSales.id,
    },
  });

  console.log("  ✔ Users created");

  // ── Templates ──────────────────────────────────────────
  const templates = [
    {
      id: "TPL_CRAWL_WEEKLY",
      name: "주간 크롤링 리포트",
      description: "외부 사이트를 주 1회 크롤링하여 트렌드 리포트를 생성합니다.",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "EXTERNAL",
      formSchema: JSON.stringify({
        fields: [
          { name: "targetUrl", type: "url", label: "대상 URL", required: true },
          { name: "schedule", type: "cron", label: "스케줄", default: "0 9 * * MON" },
          { name: "outputFormat", type: "select", label: "출력형식", options: ["XLSX", "PDF", "JSON"] },
        ],
      }),
      defaultExecutorKey: "design-crawl-brand",
    },
    {
      id: "TPL_FILE_TRANSFORM",
      name: "파일 변환 자동화",
      description: "업로드된 파일을 규칙 기반으로 변환(PDF→Excel, CSV→피벗 등)합니다.",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      formSchema: JSON.stringify({
        fields: [
          { name: "inputFile", type: "file", label: "입력 파일", required: true },
          { name: "transformRule", type: "select", label: "변환 규칙", options: ["PDF_TO_EXCEL", "CSV_PIVOT", "MERGE_SHEETS"] },
          { name: "outputName", type: "text", label: "출력 파일명" },
        ],
      }),
      defaultExecutorKey: "po-order-recap",
    },
    {
      id: "TPL_NOTIFY_THRESHOLD",
      name: "임계치 알림 설정",
      description: "특정 지표가 임계치를 초과하면 Slack/이메일로 알림을 발송합니다.",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "INTERNAL",
      formSchema: JSON.stringify({
        fields: [
          { name: "metric", type: "text", label: "모니터링 지표", required: true },
          { name: "threshold", type: "number", label: "임계치", required: true },
          { name: "channel", type: "select", label: "알림 채널", options: ["SLACK", "EMAIL", "BOTH"] },
        ],
      }),
      defaultExecutorKey: "comm-stock-alert-mock",
    },
  ];

  for (const t of templates) {
    await prisma.template.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  console.log("  ✔ Templates created");

  // ── Agents ─────────────────────────────────────────────
  interface AgentSeed {
    slug: string;
    name: string;
    description: string;
    agentGroup: string;
    buildTier: string;
    runtimeType: string;
    dataClassification: string;
    demoRunnable: boolean;
    executorKey?: string;
    lockedReason?: string;
    teamId: string;
    ownerId: string;
    department: string;
    asIsSummary: string;
    toBeSummary: string;
    workflowMd: string;
    tags: string[];
    inputsSchema: object[];
    outputsSchema: object[];
  }

  const agents: AgentSeed[] = [
    // ── DESIGN_INTELLIGENCE ──
    {
      slug: "design-zara-trousers",
      name: "ZARA Trousers 신제품 분석",
      description: "ZARA 온라인 스토어에서 Trousers 카테고리 신제품을 크롤링하여 트렌드 리포트를 자동 생성합니다.",
      agentGroup: "DESIGN_INTELLIGENCE",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "EXTERNAL",
      demoRunnable: true,
      executorKey: "design-crawl-brand",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "디자인실",
      asIsSummary: "디자이너가 매주 ZARA 웹사이트를 수동으로 방문하여 신제품 이미지를 캡처하고 Excel에 정리",
      toBeSummary: "에이전트가 자동으로 ZARA 신제품을 크롤링하여 이미지·가격·소재 정보를 포함한 트렌드 리포트를 생성",
      workflowMd: "1. ZARA 온라인 스토어 Trousers 카테고리 접속\n2. 신제품 목록 크롤링 (이미지, 가격, 소재, 컬러)\n3. 트렌드 분석 및 카테고리별 분류\n4. Excel/PDF 리포트 자동 생성\n5. 담당자에게 알림 발송",
      tags: ["크롤링", "ZARA", "트렌드", "디자인"],
      inputsSchema: [
        { name: "category", type: "select", label: "카테고리", default: "trousers" },
        { name: "maxItems", type: "number", label: "최대 수집 건수", default: 50 },
      ],
      outputsSchema: [
        { name: "report_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { name: "thumbnail_grid", type: "file", mimeType: "image/png" },
      ],
    },
    {
      slug: "design-target-trousers",
      name: "Target Trousers 신제품 분석",
      description: "Target 온라인 스토어에서 Trousers 카테고리 신제품을 크롤링하여 트렌드 리포트를 자동 생성합니다.",
      agentGroup: "DESIGN_INTELLIGENCE",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "EXTERNAL",
      demoRunnable: true,
      executorKey: "design-crawl-brand",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "디자인실",
      asIsSummary: "디자이너가 매주 Target 웹사이트를 수동으로 방문하여 신제품 이미지를 캡처하고 Excel에 정리",
      toBeSummary: "에이전트가 자동으로 Target 신제품을 크롤링하여 이미지·가격·소재 정보를 포함한 트렌드 리포트를 생성",
      workflowMd: "1. Target 온라인 스토어 Trousers 카테고리 접속\n2. 신제품 목록 크롤링 (이미지, 가격, 소재, 컬러)\n3. 트렌드 분석 및 카테고리별 분류\n4. Excel/PDF 리포트 자동 생성\n5. 담당자에게 알림 발송",
      tags: ["크롤링", "Target", "트렌드", "디자인"],
      inputsSchema: [
        { name: "category", type: "select", label: "카테고리", default: "trousers" },
        { name: "maxItems", type: "number", label: "최대 수집 건수", default: 50 },
      ],
      outputsSchema: [
        { name: "report_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { name: "thumbnail_grid", type: "file", mimeType: "image/png" },
      ],
    },
    {
      slug: "design-walmart-trousers",
      name: "Walmart Trousers 신제품 분석",
      description: "Walmart 온라인 스토어에서 Trousers 카테고리 신제품을 크롤링하여 트렌드 리포트를 자동 생성합니다.",
      agentGroup: "DESIGN_INTELLIGENCE",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "EXTERNAL",
      demoRunnable: true,
      executorKey: "design-crawl-brand",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "디자인실",
      asIsSummary: "디자이너가 매주 Walmart 웹사이트를 수동으로 방문하여 신제품 이미지를 캡처하고 Excel에 정리",
      toBeSummary: "에이전트가 자동으로 Walmart 신제품을 크롤링하여 이미지·가격·소재 정보를 포함한 트렌드 리포트를 생성",
      workflowMd: "1. Walmart 온라인 스토어 Trousers 카테고리 접속\n2. 신제품 목록 크롤링 (이미지, 가격, 소재, 컬러)\n3. 트렌드 분석 및 카테고리별 분류\n4. Excel/PDF 리포트 자동 생성\n5. 담당자에게 알림 발송",
      tags: ["크롤링", "Walmart", "트렌드", "디자인"],
      inputsSchema: [
        { name: "category", type: "select", label: "카테고리", default: "trousers" },
        { name: "maxItems", type: "number", label: "최대 수집 건수", default: 50 },
      ],
      outputsSchema: [
        { name: "report_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { name: "thumbnail_grid", type: "file", mimeType: "image/png" },
      ],
    },
    {
      slug: "design-alvanon",
      name: "Alvanon 3D Fit 분석",
      description: "Alvanon 3D 바디 스캔 데이터를 기반으로 핏(Fit) 분석 리포트를 자동 생성합니다.",
      agentGroup: "DESIGN_INTELLIGENCE",
      buildTier: "LOWCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "EXTERNAL",
      demoRunnable: true,
      executorKey: "design-alvanon-mock",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "디자인실",
      asIsSummary: "패턴사가 Alvanon 시스템에서 수동으로 3D 데이터를 다운로드하여 Excel로 비교 분석",
      toBeSummary: "에이전트가 Alvanon API를 통해 3D 피팅 데이터를 자동 수집하고 사이즈별 편차 리포트를 생성",
      workflowMd: "1. Alvanon API에서 3D 바디 스캔 데이터 조회\n2. 사이즈 스펙 대비 편차 분석\n3. 핏 이슈 자동 감지 및 분류\n4. 3D 시각화 리포트 생성\n5. 디자인팀에 리포트 공유",
      tags: ["3D", "Alvanon", "핏분석", "패턴"],
      inputsSchema: [
        { name: "styleNo", type: "text", label: "스타일 번호", required: true },
        { name: "sizeRange", type: "text", label: "사이즈 범위", default: "S-XL" },
      ],
      outputsSchema: [
        { name: "fit_report_pdf", type: "file", mimeType: "application/pdf" },
        { name: "deviation_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      ],
    },
    {
      slug: "design-linesheet",
      name: "Wholesale Linesheet 생성",
      description: "시즌 제품 정보를 기반으로 바이어 제출용 Wholesale Linesheet를 자동 생성합니다.",
      agentGroup: "DESIGN_INTELLIGENCE",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "design-linesheet",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "디자인실",
      asIsSummary: "MD가 제품 사진·스펙·가격을 수동으로 PowerPoint/Excel에 배치하여 Linesheet 제작 (2~3일 소요)",
      toBeSummary: "에이전트가 PLM 데이터를 기반으로 Linesheet를 자동 레이아웃하여 PDF/Excel로 생성 (30분 이내)",
      workflowMd: "1. PLM에서 시즌 제품 마스터 데이터 조회\n2. 제품 이미지·스펙·가격 정보 매핑\n3. 바이어별 Linesheet 템플릿 적용\n4. PDF/Excel Linesheet 자동 생성\n5. 바이어 포털에 업로드",
      tags: ["Linesheet", "바이어", "MD", "시즌"],
      inputsSchema: [
        { name: "season", type: "text", label: "시즌", required: true },
        { name: "buyer", type: "text", label: "바이어명", required: true },
        { name: "format", type: "select", label: "출력형식", options: ["PDF", "XLSX"] },
      ],
      outputsSchema: [
        { name: "linesheet_file", type: "file", mimeType: "application/pdf" },
      ],
    },

    // ── PO_PROCESSING ──
    {
      slug: "po-order-recap",
      name: "PO 오더리캡 자동화",
      description: "바이어 PO를 파싱하여 오더리캡(Order Recap)을 자동 생성하고 ERP에 반영합니다.",
      agentGroup: "PO_PROCESSING",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "po-order-recap",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "영업관리팀",
      asIsSummary: "영업 담당자가 바이어 PO PDF를 수동으로 읽고 Excel 오더리캡을 작성, ERP에 수기 입력 (건당 30분)",
      toBeSummary: "에이전트가 PO PDF를 자동 파싱하여 오더리캡을 생성하고 ERP 연동까지 자동 처리 (건당 2분)",
      workflowMd: "1. 바이어 PO PDF 업로드 수신\n2. AI OCR로 PO 항목(스타일, 수량, 납기, 가격) 파싱\n3. ERP 마스터와 스타일/컬러 매칭 검증\n4. 오더리캡 Excel 자동 생성\n5. ERP 시스템에 데이터 반영",
      tags: ["PO", "오더리캡", "ERP", "자동화"],
      inputsSchema: [
        { name: "poFile", type: "file", label: "PO 파일", required: true, accept: ".pdf,.xlsx" },
        { name: "buyer", type: "text", label: "바이어", required: true },
      ],
      outputsSchema: [
        { name: "recap_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { name: "validation_log", type: "file", mimeType: "application/json" },
      ],
    },
    {
      slug: "po-pocn",
      name: "POCN 확인서 처리",
      description: "PO Change Notice(POCN)를 자동으로 파싱하고 기존 오더와 비교하여 변경사항을 추적합니다.",
      agentGroup: "PO_PROCESSING",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "po-pocn",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "영업관리팀",
      asIsSummary: "영업 담당자가 POCN 문서를 수동으로 비교하여 변경사항을 파악하고 관련 부서에 개별 전달",
      toBeSummary: "에이전트가 POCN을 자동 파싱하여 원본 PO 대비 변경사항을 하이라이트하고 관련 부서에 자동 알림",
      workflowMd: "1. POCN 문서 수신 및 파싱\n2. 원본 PO 데이터 조회\n3. 변경사항(수량/납기/가격/스타일) 자동 비교\n4. 변경 확인서(Diff Report) 생성\n5. 관련 부서(생산/자재/물류)에 자동 알림",
      tags: ["POCN", "PO변경", "추적", "알림"],
      inputsSchema: [
        { name: "pocnFile", type: "file", label: "POCN 파일", required: true },
        { name: "originalPoRef", type: "text", label: "원본 PO 번호", required: true },
      ],
      outputsSchema: [
        { name: "diff_report", type: "file", mimeType: "application/pdf" },
        { name: "change_summary", type: "file", mimeType: "application/json" },
      ],
    },
    {
      slug: "po-pivot",
      name: "PO Style×Week 피벗",
      description: "다수의 PO 데이터를 스타일×주차 기준으로 피벗 테이블을 자동 생성합니다.",
      agentGroup: "PO_PROCESSING",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "po-pivot",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "영업관리팀",
      asIsSummary: "영업 담당자가 여러 PO의 스타일별 주차별 물량을 수동으로 Excel 피벗 테이블로 정리 (반나절 소요)",
      toBeSummary: "에이전트가 PO 데이터를 자동으로 Style×Week 피벗으로 변환하여 생산 계획 수립에 즉시 활용",
      workflowMd: "1. 복수 PO 파일 또는 ERP 데이터 수집\n2. 스타일번호/컬러/사이즈 정규화\n3. 주차(Ship Week) 기준 피벗 테이블 생성\n4. 바이어별/공장별 분류 옵션 적용\n5. 피벗 Excel 다운로드 제공",
      tags: ["PO", "피벗", "생산계획", "물량"],
      inputsSchema: [
        { name: "poFiles", type: "file", label: "PO 파일(복수)", required: true, multiple: true },
        { name: "groupBy", type: "select", label: "그룹 기준", options: ["BUYER", "FACTORY", "BOTH"] },
      ],
      outputsSchema: [
        { name: "pivot_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      ],
    },
    {
      slug: "po-download",
      name: "바이어 PO 다운로드",
      description: "바이어 포털(EDI/웹)에 접속하여 최신 PO 파일을 자동으로 다운로드합니다.",
      agentGroup: "PO_PROCESSING",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "po-order-recap",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "영업관리팀",
      asIsSummary: "영업 담당자가 매일 각 바이어 포털에 수동 로그인하여 신규 PO를 확인하고 다운로드",
      toBeSummary: "에이전트가 스케줄에 따라 바이어 포털에 자동 접속하여 신규 PO를 다운로드하고 알림 발송",
      workflowMd: "1. 바이어 포털 자동 로그인\n2. 신규/변경 PO 목록 확인\n3. PO 파일 자동 다운로드\n4. 다운로드 이력 기록\n5. 담당자에게 신규 PO 알림",
      tags: ["PO", "다운로드", "바이어포털", "EDI"],
      inputsSchema: [
        { name: "buyer", type: "select", label: "바이어", options: ["ZARA", "TARGET", "WALMART", "H&M"] },
        { name: "dateRange", type: "text", label: "조회 기간", default: "최근 7일" },
      ],
      outputsSchema: [
        { name: "downloaded_files", type: "file", mimeType: "application/zip" },
        { name: "download_log", type: "file", mimeType: "application/json" },
      ],
    },
    {
      slug: "po-sample-pdf-excel",
      name: "PO PDF→Excel 변환",
      description: "바이어 PO PDF 파일을 구조화된 Excel 파일로 자동 변환합니다.",
      agentGroup: "PO_PROCESSING",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "po-order-recap",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "영업관리팀",
      asIsSummary: "영업 담당자가 PO PDF를 보면서 수동으로 Excel에 데이터를 타이핑 (건당 20분, 오류 빈발)",
      toBeSummary: "에이전트가 AI OCR로 PO PDF를 파싱하여 정확한 Excel 데이터로 자동 변환 (건당 1분)",
      workflowMd: "1. PO PDF 파일 업로드\n2. AI OCR로 테이블/텍스트 영역 인식\n3. 스타일/수량/가격/납기 데이터 추출\n4. 표준 Excel 템플릿에 매핑\n5. 변환 결과 검증 및 다운로드",
      tags: ["PO", "PDF변환", "OCR", "Excel"],
      inputsSchema: [
        { name: "pdfFile", type: "file", label: "PO PDF 파일", required: true, accept: ".pdf" },
      ],
      outputsSchema: [
        { name: "converted_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      ],
    },
    {
      slug: "po-trim-order",
      name: "Trim 발주 대시보드",
      description: "PO 기반으로 부자재(Trim) 소요량을 자동 산출하고 발주 현황 대시보드를 제공합니다.",
      agentGroup: "PO_PROCESSING",
      buildTier: "LOWCODE",
      runtimeType: "STREAMLIT_HOST",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "streamlit-redirect",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "자재팀",
      asIsSummary: "자재 담당자가 PO 물량을 기반으로 BOM을 수동 조회하여 Trim 소요량을 Excel로 산출",
      toBeSummary: "에이전트가 PO-BOM 연동으로 Trim 소요량을 자동 산출하고 실시간 대시보드로 발주 현황 제공",
      workflowMd: "1. 확정 PO 물량 자동 수집\n2. BOM 마스터에서 Trim 소요량 산출\n3. 기존 재고/발주 현황 대비 부족분 계산\n4. Trim 발주서 자동 생성\n5. 실시간 대시보드 업데이트",
      tags: ["Trim", "부자재", "BOM", "대시보드"],
      inputsSchema: [
        { name: "poRef", type: "text", label: "PO 번호", required: true },
      ],
      outputsSchema: [
        { name: "dashboard_url", type: "url", label: "대시보드 URL" },
      ],
    },

    // ── SALES_INVENTORY ──
    {
      slug: "sales-report",
      name: "일별 매출 리포트",
      description: "ERP 데이터를 기반으로 일별 매출 현황 대시보드를 자동 생성합니다.",
      agentGroup: "SALES_INVENTORY",
      buildTier: "LOWCODE",
      runtimeType: "STREAMLIT_HOST",
      dataClassification: "INTERNAL",
      demoRunnable: true,
      executorKey: "streamlit-redirect",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "영업기획팀",
      asIsSummary: "영업기획 담당자가 ERP에서 매출 데이터를 추출하여 수동으로 일일 보고서 작성 (매일 1시간)",
      toBeSummary: "에이전트가 ERP 데이터를 자동 집계하여 실시간 매출 대시보드와 일일 리포트를 자동 생성",
      workflowMd: "1. ERP 일별 출하/매출 데이터 자동 수집\n2. 바이어별/공장별/품목별 매출 집계\n3. 전일/전주/전월 대비 분석\n4. Streamlit 대시보드 자동 갱신\n5. 경영진에 일일 매출 요약 발송",
      tags: ["매출", "리포트", "대시보드", "ERP"],
      inputsSchema: [
        { name: "reportDate", type: "date", label: "기준일", default: "today" },
        { name: "scope", type: "select", label: "범위", options: ["ALL", "BUYER", "FACTORY"] },
      ],
      outputsSchema: [
        { name: "dashboard_url", type: "url", label: "대시보드 URL" },
        { name: "daily_report_pdf", type: "file", mimeType: "application/pdf" },
      ],
    },

    // ── COMMUNICATION ──
    {
      slug: "comm-stock-alert",
      name: "한세실업 주가 알림",
      description: "한세실업(105630) 주가를 모니터링하여 임계치 초과 시 Slack/이메일로 알림을 발송합니다.",
      agentGroup: "COMMUNICATION",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "EXTERNAL",
      demoRunnable: true,
      executorKey: "comm-stock-alert-mock",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "경영기획팀",
      asIsSummary: "재무 담당자가 증권 사이트를 수시로 확인하여 주가 변동을 모니터링",
      toBeSummary: "에이전트가 실시간 주가를 모니터링하여 설정된 임계치 초과 시 즉시 알림 발송",
      workflowMd: "1. 한세실업(105630) 실시간 주가 조회\n2. 등락률/거래량 임계치 비교\n3. 임계치 초과 시 알림 생성\n4. Slack 채널 및 이메일 발송\n5. 알림 이력 기록",
      tags: ["주가", "알림", "모니터링", "Slack"],
      inputsSchema: [
        { name: "threshold", type: "number", label: "등락률 임계치(%)", default: 3 },
        { name: "channel", type: "select", label: "알림 채널", options: ["SLACK", "EMAIL", "BOTH"] },
      ],
      outputsSchema: [
        { name: "alert_log", type: "file", mimeType: "application/json" },
      ],
    },
    {
      slug: "comm-email-fit",
      name: "핏 코멘트 자동 메일",
      description: "바이어 핏 코멘트를 자동으로 수집하여 관련 부서에 이메일을 발송합니다.",
      agentGroup: "COMMUNICATION",
      buildTier: "LOWCODE",
      runtimeType: "WINDOWS_WORKER",
      dataClassification: "INTERNAL",
      demoRunnable: false,
      lockedReason: "Phase 2 · Outlook 연동 필요",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "QC팀",
      asIsSummary: "QC 담당자가 바이어 핏 코멘트를 수동으로 정리하여 디자인/패턴팀에 이메일 전달",
      toBeSummary: "에이전트가 핏 코멘트를 자동 수집·분류하여 관련 부서에 구조화된 이메일을 자동 발송",
      workflowMd: "1. 바이어 포털에서 핏 코멘트 수집\n2. 코멘트 유형별 자동 분류 (사이즈/원단/봉제)\n3. 관련 부서 자동 매핑\n4. 구조화된 이메일 템플릿 생성\n5. Outlook을 통한 자동 발송",
      tags: ["핏코멘트", "이메일", "Outlook", "QC"],
      inputsSchema: [
        { name: "buyer", type: "text", label: "바이어", required: true },
        { name: "styleNo", type: "text", label: "스타일 번호" },
      ],
      outputsSchema: [
        { name: "email_log", type: "file", mimeType: "application/json" },
      ],
    },
    {
      slug: "comm-handcarry",
      name: "핸드캐리 요청 자동화",
      description: "긴급 샘플 핸드캐리 요청을 자동으로 처리하고 물류팀에 알림을 발송합니다.",
      agentGroup: "COMMUNICATION",
      buildTier: "LOWCODE",
      runtimeType: "WINDOWS_WORKER",
      dataClassification: "INTERNAL",
      demoRunnable: false,
      lockedReason: "Phase 2 · 사내 시스템 연동 필요",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "물류팀",
      asIsSummary: "영업 담당자가 핸드캐리 요청서를 수동 작성하여 물류팀에 이메일로 전달, 승인까지 2~3시간 소요",
      toBeSummary: "에이전트가 핸드캐리 요청을 자동 생성하고 승인 워크플로우를 통해 물류팀에 즉시 전달",
      workflowMd: "1. 핸드캐리 요청 정보 입력\n2. 자동 요청서 생성\n3. 팀장 자동 승인 요청\n4. 승인 완료 시 물류팀에 알림\n5. 픽업/배송 스케줄 등록",
      tags: ["핸드캐리", "물류", "긴급", "승인"],
      inputsSchema: [
        { name: "sampleDesc", type: "text", label: "샘플 설명", required: true },
        { name: "destination", type: "text", label: "목적지", required: true },
        { name: "urgency", type: "select", label: "긴급도", options: ["NORMAL", "URGENT", "CRITICAL"] },
      ],
      outputsSchema: [
        { name: "request_form", type: "file", mimeType: "application/pdf" },
      ],
    },

    // ── PRODUCTION_QUALITY ──
    {
      slug: "prod-inspection",
      name: "검사 리포트 자동화",
      description: "공장 검사 데이터를 수집하여 바이어 제출용 검사 리포트를 자동 생성합니다.",
      agentGroup: "PRODUCTION_QUALITY",
      buildTier: "NOCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "prod-inspection",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "품질관리팀",
      asIsSummary: "QC 담당자가 검사 결과를 수동으로 Word/Excel에 작성하여 바이어에게 이메일 제출 (건당 1시간)",
      toBeSummary: "에이전트가 검사 데이터를 자동 수집하여 바이어 포맷에 맞는 검사 리포트를 자동 생성 (건당 5분)",
      workflowMd: "1. 공장 검사 데이터 자동 수집\n2. AQL 기준 합격/불합격 자동 판정\n3. 바이어별 리포트 템플릿 적용\n4. 검사 사진 자동 첨부\n5. 바이어 포털에 리포트 업로드",
      tags: ["검사", "QC", "리포트", "AQL"],
      inputsSchema: [
        { name: "inspectionId", type: "text", label: "검사 번호", required: true },
        { name: "buyer", type: "text", label: "바이어", required: true },
      ],
      outputsSchema: [
        { name: "inspection_report", type: "file", mimeType: "application/pdf" },
        { name: "photo_package", type: "file", mimeType: "application/zip" },
      ],
    },
    {
      slug: "prod-erp-monitor",
      name: "ERP 생산현황 모니터링",
      description: "ERP 시스템의 생산현황 데이터를 실시간으로 모니터링하고 이상 감지 시 알림을 발송합니다.",
      agentGroup: "PRODUCTION_QUALITY",
      buildTier: "LOWCODE",
      runtimeType: "WINDOWS_WORKER",
      dataClassification: "INTERNAL",
      demoRunnable: true,
      executorKey: "windows-worker-sim",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "생산관리팀",
      asIsSummary: "생산관리 담당자가 ERP에 수시로 접속하여 각 공장의 생산 진행률을 수동 확인",
      toBeSummary: "에이전트가 ERP 생산현황을 실시간 모니터링하여 지연/이상 감지 시 즉시 알림 발송",
      workflowMd: "1. ERP 생산현황 데이터 실시간 수집\n2. 공장별/라인별 진행률 모니터링\n3. 납기 지연 위험 자동 감지\n4. 이상 감지 시 관련 부서에 알림\n5. 일일 생산현황 요약 리포트 생성",
      tags: ["ERP", "생산현황", "모니터링", "알림"],
      inputsSchema: [
        { name: "factory", type: "select", label: "공장", options: ["ALL", "VN1", "VN2", "ID1", "MM1"] },
        { name: "alertThreshold", type: "number", label: "지연 임계치(일)", default: 3 },
      ],
      outputsSchema: [
        { name: "monitor_dashboard", type: "url", label: "모니터링 URL" },
        { name: "alert_log", type: "file", mimeType: "application/json" },
      ],
    },
    {
      slug: "prod-bom-wip",
      name: "BOM/WIP 실시간 추적",
      description: "BOM(Bill of Materials)과 WIP(Work In Progress) 데이터를 실시간으로 추적합니다.",
      agentGroup: "PRODUCTION_QUALITY",
      buildTier: "PROCODE",
      runtimeType: "WINDOWS_WORKER",
      dataClassification: "INTERNAL",
      demoRunnable: false,
      lockedReason: "Phase 3 · ERP 연동 필요",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "생산관리팀",
      asIsSummary: "자재/생산 담당자가 ERP에서 BOM 대비 투입 현황을 수동으로 조회하고 Excel로 관리",
      toBeSummary: "에이전트가 BOM 대비 실시간 자재 투입·WIP 현황을 자동 추적하고 부족분을 사전 경고",
      workflowMd: "1. ERP BOM 마스터 데이터 연동\n2. 실시간 자재 투입 현황 수집\n3. BOM 대비 소진율 자동 계산\n4. WIP 단계별 진행률 추적\n5. 부족분 사전 경고 및 발주 제안",
      tags: ["BOM", "WIP", "자재", "실시간"],
      inputsSchema: [
        { name: "poRef", type: "text", label: "PO 번호", required: true },
        { name: "factory", type: "select", label: "공장", options: ["VN1", "VN2", "ID1", "MM1"] },
      ],
      outputsSchema: [
        { name: "bom_tracking", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { name: "wip_status", type: "file", mimeType: "application/json" },
      ],
    },

    // ── HR_COMPLIANCE ──
    {
      slug: "hr-auditsync",
      name: "HR 감사 동기화",
      description: "HR 시스템과 감사 시스템 간 인사 데이터를 자동으로 동기화하고 불일치를 감지합니다.",
      agentGroup: "HR_COMPLIANCE",
      buildTier: "PROCODE",
      runtimeType: "WINDOWS_WORKER",
      dataClassification: "RESTRICTED",
      demoRunnable: false,
      lockedReason: "Phase 4 · 인사 데이터 보안",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "인사팀",
      asIsSummary: "인사 담당자가 분기별 감사 시 HR 시스템 데이터를 수동으로 추출하여 감사 자료 준비",
      toBeSummary: "에이전트가 HR 시스템과 감사 시스템 간 데이터를 자동 동기화하고 불일치를 사전 감지",
      workflowMd: "1. HR 시스템에서 인사 마스터 데이터 추출\n2. 감사 시스템 데이터와 자동 비교\n3. 불일치 항목 자동 감지 및 분류\n4. 불일치 리포트 생성\n5. 인사팀 담당자에게 검토 요청",
      tags: ["HR", "감사", "동기화", "컴플라이언스"],
      inputsSchema: [
        { name: "period", type: "text", label: "감사 기간", required: true },
        { name: "scope", type: "select", label: "범위", options: ["ALL", "DOMESTIC", "OVERSEAS"] },
      ],
      outputsSchema: [
        { name: "sync_report", type: "file", mimeType: "application/pdf" },
        { name: "discrepancy_list", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      ],
    },
    {
      slug: "hr-dashboard",
      name: "HR 현황 대시보드",
      description: "인사 현황(인원, 이직률, 교육 이수율 등)을 실시간 대시보드로 제공합니다.",
      agentGroup: "HR_COMPLIANCE",
      buildTier: "LOWCODE",
      runtimeType: "STREAMLIT_HOST",
      dataClassification: "RESTRICTED",
      demoRunnable: false,
      lockedReason: "Phase 4 · 인사 데이터 보안",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "인사팀",
      asIsSummary: "인사 담당자가 월별 인사 현황 보고서를 수동으로 작성하여 경영진에 보고",
      toBeSummary: "에이전트가 HR 데이터를 자동 집계하여 실시간 인사 현황 대시보드를 제공",
      workflowMd: "1. HR 시스템에서 인사 데이터 자동 수집\n2. 인원/이직률/교육 이수율 KPI 산출\n3. 부서별/법인별 현황 집계\n4. Streamlit 대시보드 자동 갱신\n5. 월별 인사 현황 리포트 자동 생성",
      tags: ["HR", "대시보드", "인사현황", "KPI"],
      inputsSchema: [
        { name: "period", type: "text", label: "기준 기간", default: "이번 달" },
        { name: "entity", type: "select", label: "법인", options: ["ALL", "KOREA", "VIETNAM", "INDONESIA", "MYANMAR"] },
      ],
      outputsSchema: [
        { name: "dashboard_url", type: "url", label: "대시보드 URL" },
      ],
    },

    // ── FINANCE_AUDIT ──
    {
      slug: "analytics-inventory",
      name: "재고 분석 리포트",
      description: "창고별 재고 현황을 분석하여 과잉/부족 재고 리포트를 자동 생성합니다.",
      agentGroup: "FINANCE_AUDIT",
      buildTier: "LOWCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "INTERNAL",
      demoRunnable: false,
      lockedReason: "Phase 3 · 재무 데이터 보안",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "재무팀",
      asIsSummary: "재무 담당자가 ERP에서 재고 데이터를 추출하여 수동으로 과잉/부족 분석 리포트 작성",
      toBeSummary: "에이전트가 실시간 재고 데이터를 분석하여 과잉/부족 재고를 자동 감지하고 리포트 생성",
      workflowMd: "1. ERP에서 창고별 재고 데이터 수집\n2. ABC 분석 및 재고 회전율 산출\n3. 과잉/부족 재고 자동 감지\n4. 재고 최적화 제안 리포트 생성\n5. 관련 부서에 조치 요청 알림",
      tags: ["재고", "분석", "재무", "리포트"],
      inputsSchema: [
        { name: "warehouse", type: "select", label: "창고", options: ["ALL", "VN_WH1", "VN_WH2", "ID_WH1", "KR_WH1"] },
        { name: "analysisType", type: "select", label: "분석 유형", options: ["ABC", "AGING", "TURNOVER"] },
      ],
      outputsSchema: [
        { name: "inventory_report", type: "file", mimeType: "application/pdf" },
        { name: "raw_data", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      ],
    },
    {
      slug: "bi-daily",
      name: "BI Daily 대시보드",
      description: "주요 경영 지표를 통합한 일일 BI 대시보드를 자동 생성합니다.",
      agentGroup: "FINANCE_AUDIT",
      buildTier: "LOWCODE",
      runtimeType: "BI_CONNECTOR",
      dataClassification: "INTERNAL",
      demoRunnable: true,
      executorKey: "bi-redirect",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "경영기획팀",
      asIsSummary: "경영기획 담당자가 여러 시스템에서 데이터를 추출하여 수동으로 일일 BI 보고서 작성",
      toBeSummary: "에이전트가 ERP/SCM/HR 데이터를 자동 수집하여 통합 BI 대시보드를 매일 자동 갱신",
      workflowMd: "1. ERP/SCM/HR 시스템에서 주요 지표 수집\n2. 매출/생산/인사 KPI 자동 산출\n3. 전일/전주/전월 대비 트렌드 분석\n4. BI 대시보드 자동 갱신\n5. 경영진에 일일 요약 메일 발송",
      tags: ["BI", "대시보드", "KPI", "경영"],
      inputsSchema: [
        { name: "reportDate", type: "date", label: "기준일", default: "today" },
      ],
      outputsSchema: [
        { name: "dashboard_url", type: "url", label: "BI 대시보드 URL" },
      ],
    },
    // ── NEW AGENTS (Proposal 4-8 ~ 4-13) ──
    {
      slug: "fabric-cost-calculator",
      name: "원단 단가 자동 산출",
      description: "원단 종류, 가공 방법, 수량에 따라 단가를 자동 산출하고 최적 소싱 옵션을 추천합니다.",
      agentGroup: "PRODUCTION_QUALITY",
      buildTier: "LOWCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "INTERNAL",
      demoRunnable: true,
      executorKey: "fabric-cost-mock",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "자재팀",
      asIsSummary: "자재 담당자가 원단 업체별 견적서를 수동 비교하여 단가 산출 (건당 2시간)",
      toBeSummary: "에이전트가 원단 스펙 입력 시 자동으로 단가를 산출하고 최적 소싱 옵션을 AI로 추천",
      workflowMd: "1. 원단 스펙 입력 (조직, 중량, 폭, 가공)\n2. 단가 DB에서 기준 단가 조회\n3. 가공비·물류비·관세 자동 계산\n4. AI 소싱 추천 (가격/품질/납기 기준)\n5. 견적서 자동 생성",
      tags: ["원단", "단가", "소싱", "자재"],
      inputsSchema: [
        { name: "fabricType", type: "text", label: "원단 조직", required: true },
        { name: "weight", type: "text", label: "중량 (GSM)" },
        { name: "finish", type: "text", label: "가공 방법" },
      ],
      outputsSchema: [
        { name: "cost_report", type: "file", mimeType: "application/pdf" },
      ],
    },
    {
      slug: "design-techpack",
      name: "Tech Pack BOM 자동추출",
      description: "Tech Pack 문서에서 BOM(부자재 명세)을 AI로 자동 추출하고 정형화합니다.",
      agentGroup: "DESIGN_INTELLIGENCE",
      buildTier: "LOWCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "techpack-bom-mock",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "디자인실",
      asIsSummary: "패턴사/MD가 Tech Pack PDF를 수동으로 읽어 BOM 항목을 Excel에 수기 입력 (건당 1시간)",
      toBeSummary: "에이전트가 Tech Pack을 AI OCR로 스캔하여 BOM 항목을 자동 추출하고 표준 코드로 매핑",
      workflowMd: "1. Tech Pack PDF 업로드\n2. AI OCR로 문서 구조 분석\n3. BOM 항목(원단/부자재/부속) 자동 추출\n4. 한세 표준 코드로 자동 매핑\n5. BOM 시트 Excel 생성",
      tags: ["TechPack", "BOM", "OCR", "디자인"],
      inputsSchema: [
        { name: "techpackFile", type: "file", label: "Tech Pack PDF", required: true, accept: ".pdf" },
        { name: "buyer", type: "text", label: "바이어" },
      ],
      outputsSchema: [
        { name: "bom_xlsx", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      ],
    },
    {
      slug: "comm-buyer-email",
      name: "바이어 메일 AI 어시스턴트",
      description: "바이어 수신 메일을 AI가 분석하여 자동 요약하고 맞춤 회신 초안을 생성합니다.",
      agentGroup: "COMMUNICATION",
      buildTier: "LOWCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "BUYER_PORTAL",
      demoRunnable: true,
      executorKey: "buyer-email-mock",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "해외영업팀",
      asIsSummary: "영업 담당자가 바이어 메일을 일일이 읽고 회신 초안을 직접 작성 (하루 평균 2시간)",
      toBeSummary: "에이전트가 수신 메일을 자동 분석·요약하고 AI 기반 회신 초안을 생성하여 업무 속도 3배 향상",
      workflowMd: "1. 이메일 수신함 자동 모니터링\n2. 바이어 메일 자동 분류 (PO/클레임/문의)\n3. AI 요약 및 핵심 Action Item 추출\n4. 맞춤 회신 초안 자동 생성\n5. 담당자 검토 후 발송",
      tags: ["이메일", "바이어", "AI", "회신"],
      inputsSchema: [
        { name: "emailId", type: "text", label: "이메일 ID" },
        { name: "buyer", type: "text", label: "바이어" },
      ],
      outputsSchema: [
        { name: "draft_email", type: "file", mimeType: "text/html" },
      ],
    },
    {
      slug: "prod-line-optimizer",
      name: "생산 공정 최적화",
      description: "생산 라인별 실시간 데이터를 분석하여 병목 구간을 탐지하고 최적화 방안을 제안합니다.",
      agentGroup: "PRODUCTION_QUALITY",
      buildTier: "LOWCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "INTERNAL",
      demoRunnable: true,
      executorKey: "line-optimizer-mock",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "생산관리팀",
      asIsSummary: "생산관리자가 라인별 실적을 수동으로 집계하여 병목 구간을 파악 (일 1회, 반나절 소요)",
      toBeSummary: "에이전트가 실시간 생산 데이터를 분석하여 병목 구간을 즉시 탐지하고 AI 최적화 방안 제안",
      workflowMd: "1. MES/ERP에서 라인별 실시간 생산 데이터 수집\n2. 라인별 효율성·불량률 자동 분석\n3. 병목 구간 AI 탐지\n4. 최적화 시뮬레이션 실행\n5. 개선 방안 리포트 생성",
      tags: ["생산", "최적화", "병목", "MES"],
      inputsSchema: [
        { name: "factory", type: "select", label: "공장", options: ["VN1", "VN2", "ID1", "MM1"] },
        { name: "date", type: "date", label: "기준일", default: "today" },
      ],
      outputsSchema: [
        { name: "optimization_report", type: "file", mimeType: "application/pdf" },
      ],
    },
    {
      slug: "prod-qc-vision",
      name: "AI 비전 품질검사",
      description: "카메라/이미지 기반 AI 비전으로 원단·봉제 불량을 자동 탐지하고 분류합니다.",
      agentGroup: "PRODUCTION_QUALITY",
      buildTier: "PROCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "INTERNAL",
      demoRunnable: true,
      executorKey: "qc-vision-mock",
      teamId: teamDesign.id,
      ownerId: userCreator.id,
      department: "품질관리팀",
      asIsSummary: "QC 검사원이 육안으로 원단/봉제 불량을 검사하여 수기로 기록 (검사 속도 한계, 피로도 높음)",
      toBeSummary: "AI 비전 카메라가 실시간으로 불량을 탐지하고 유형별 자동 분류·기록 (검사 속도 10배 향상)",
      workflowMd: "1. 라인 카메라에서 실시간 이미지 수집\n2. AI 비전 모델로 불량 탐지\n3. 불량 유형별 자동 분류 (얼룩/올풀림/봉제불량)\n4. 불량 패턴 분석 리포트 생성\n5. QC 담당자에게 즉시 알림",
      tags: ["AI비전", "품질검사", "불량탐지", "QC"],
      inputsSchema: [
        { name: "lineId", type: "text", label: "검사 라인", required: true },
        { name: "batchId", type: "text", label: "배치 번호" },
      ],
      outputsSchema: [
        { name: "defect_report", type: "file", mimeType: "application/pdf" },
        { name: "defect_images", type: "file", mimeType: "application/zip" },
      ],
    },
    {
      slug: "logistics-tracker",
      name: "글로벌 물류 추적",
      description: "선적부터 도착까지 글로벌 물류 현황을 실시간 추적하고 지연 위험을 사전 알림합니다.",
      agentGroup: "PRODUCTION_QUALITY",
      buildTier: "LOWCODE",
      runtimeType: "PYTHON_JOB",
      dataClassification: "INTERNAL",
      demoRunnable: true,
      executorKey: "logistics-mock",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "물류팀",
      asIsSummary: "물류 담당자가 각 선사 웹사이트를 개별 방문하여 B/L별 위치를 수동 확인 (하루 2시간)",
      toBeSummary: "에이전트가 모든 선적 건의 위치를 실시간 추적하고 지연 위험 시 AI가 대안 루트를 추천",
      workflowMd: "1. 선적 B/L 정보 자동 수집\n2. 선사 API/크롤링으로 실시간 위치 추적\n3. ETA 대비 지연 위험 AI 분석\n4. 지연 발생 시 대안 루트 추천\n5. 관련 부서 자동 알림",
      tags: ["물류", "추적", "선적", "글로벌"],
      inputsSchema: [
        { name: "blNumber", type: "text", label: "B/L 번호" },
        { name: "carrier", type: "select", label: "선사", options: ["MAERSK", "MSC", "CMA_CGM", "EVERGREEN", "ALL"] },
      ],
      outputsSchema: [
        { name: "tracking_report", type: "file", mimeType: "application/pdf" },
      ],
    },

    {
      slug: "finance-audit-pad",
      name: "재무감사 PAD 자동화",
      description: "Power Automate Desktop을 활용하여 재무감사 프로세스를 자동화합니다.",
      agentGroup: "FINANCE_AUDIT",
      buildTier: "PROCODE",
      runtimeType: "WINDOWS_WORKER",
      dataClassification: "RESTRICTED",
      demoRunnable: false,
      lockedReason: "Phase 4 · PAD 연동 필요",
      teamId: teamSales.id,
      ownerId: userCreator.id,
      department: "재무팀",
      asIsSummary: "감사팀이 재무 데이터를 수동으로 추출하고 검증하여 감사 워크시트 작성 (분기당 2주 소요)",
      toBeSummary: "에이전트가 PAD를 통해 재무 시스템에서 데이터를 자동 추출하고 감사 워크시트를 자동 생성",
      workflowMd: "1. PAD로 재무 시스템 자동 로그인\n2. 감사 대상 기간 재무 데이터 추출\n3. 계정별 자동 검증 (잔액, 거래내역)\n4. 감사 워크시트 자동 생성\n5. 이상 거래 플래그 및 감사팀 알림",
      tags: ["재무감사", "PAD", "자동화", "컴플라이언스"],
      inputsSchema: [
        { name: "auditPeriod", type: "text", label: "감사 기간", required: true },
        { name: "accountScope", type: "select", label: "계정 범위", options: ["ALL", "BS", "PL", "CF"] },
      ],
      outputsSchema: [
        { name: "audit_worksheet", type: "file", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { name: "exception_report", type: "file", mimeType: "application/pdf" },
      ],
    },
  ];

  // Create agents and their versions
  for (const agentData of agents) {
    const {
      tags,
      inputsSchema,
      outputsSchema,
      ...rest
    } = agentData;

    // Determine a run count for demo purposes
    const runCount = agentData.demoRunnable ? Math.floor(Math.random() * 50) + 5 : 0;

    const agent = await prisma.agent.upsert({
      where: { slug: agentData.slug },
      update: {},
      create: {
        ...rest,
        status: "PUBLISHED",
        tags: JSON.stringify(tags),
        inputsSchema: JSON.stringify(inputsSchema),
        outputsSchema: JSON.stringify(outputsSchema),
        runCount,
        lastRunAt: agentData.demoRunnable
          ? new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
          : null,
      },
    });

    // Create AgentVersion 1.0.0
    const version = await prisma.agentVersion.upsert({
      where: { agentId_version: { agentId: agent.id, version: "1.0.0" } },
      update: {},
      create: {
        agentId: agent.id,
        version: "1.0.0",
        changelog: "초기 릴리스",
        status: "PUBLISHED",
      },
    });

    // Set publishedVersionId
    await prisma.agent.update({
      where: { id: agent.id },
      data: { publishedVersionId: version.id },
    });
  }

  console.log("  ✔ 29 Agents + versions created");

  // ── Favorites (sample) ──────────────────────────────────
  const favoriteSlugs = ["design-zara-trousers", "po-order-recap", "comm-stock-alert"];
  for (const slug of favoriteSlugs) {
    const agent = await prisma.agent.findUnique({ where: { slug } });
    if (agent) {
      await prisma.favorite.upsert({
        where: { userId_agentId: { userId: userUser.id, agentId: agent.id } },
        update: {},
        create: { userId: userUser.id, agentId: agent.id },
      });
    }
  }

  console.log("  ✔ Favorites created");

  // ── Audit Logs ─────────────────────────────────────────
  const auditAgents = await prisma.agent.findMany({ take: 5 });
  const auditEvents = [
    {
      eventType: "AGENT_CREATED",
      userId: userCreator.id,
      agentId: auditAgents[0]?.id,
      payload: JSON.stringify({ name: auditAgents[0]?.name }),
      ipAddress: "192.168.1.100",
    },
    {
      eventType: "AGENT_SUBMITTED",
      userId: userCreator.id,
      agentId: auditAgents[1]?.id,
      payload: JSON.stringify({ version: "1.0.0" }),
      ipAddress: "192.168.1.100",
    },
    {
      eventType: "AGENT_APPROVED",
      userId: userApprover.id,
      agentId: auditAgents[1]?.id,
      payload: JSON.stringify({ version: "1.0.0", comment: "승인 완료" }),
      ipAddress: "192.168.1.101",
    },
    {
      eventType: "AGENT_PUBLISHED",
      userId: userAdmin.id,
      agentId: auditAgents[2]?.id,
      payload: JSON.stringify({ version: "1.0.0" }),
      ipAddress: "192.168.1.102",
    },
    {
      eventType: "JOB_COMPLETED",
      userId: userUser.id,
      agentId: auditAgents[3]?.id,
      payload: JSON.stringify({ durationMs: 12340, status: "COMPLETED" }),
      ipAddress: "192.168.1.103",
    },
  ];

  // Delete existing audit logs first for idempotency
  await prisma.auditLog.deleteMany({});

  for (const event of auditEvents) {
    await prisma.auditLog.create({ data: event });
  }

  console.log("  ✔ Audit logs created");

  // ── System Config ──────────────────────────────────────
  const configs = [
    {
      key: "platform.name",
      value: JSON.stringify("한세 AI Agent Platform"),
    },
    {
      key: "platform.version",
      value: JSON.stringify("1.0.0-prototype"),
    },
    {
      key: "approval.requiredForPublish",
      value: JSON.stringify(true),
    },
    {
      key: "agentGroups",
      value: JSON.stringify([
        { key: "DESIGN_INTELLIGENCE", label: "디자인 인텔리전스", icon: "palette" },
        { key: "PO_PROCESSING", label: "PO 처리", icon: "file-text" },
        { key: "SALES_INVENTORY", label: "영업/재고", icon: "bar-chart-3" },
        { key: "COMMUNICATION", label: "커뮤니케이션", icon: "message-square" },
        { key: "PRODUCTION_QUALITY", label: "생산/품질", icon: "factory" },
        { key: "HR_COMPLIANCE", label: "HR/컴플라이언스", icon: "shield-check" },
        { key: "FINANCE_AUDIT", label: "재무/감사", icon: "calculator" },
      ]),
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log("  ✔ System config created");

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
